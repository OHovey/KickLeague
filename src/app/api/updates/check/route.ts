import { NextResponse } from 'next/server';
import { getDb, isDatabaseConfigured } from '@/db/connection';
import { standings } from '@/db/schema/standings';
import { fixtures } from '@/db/schema/fixtures';
import { leagues } from '@/db/schema/leagues';
import { eq, and, max, inArray, gte, sql } from 'drizzle-orm';
import { rateLimit, RATE_LIMIT_UPDATES } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

/** Live match statuses that indicate a match is currently in play. */
const LIVE_STATUSES = [
  'live',
  'first_half',
  'halftime',
  'second_half',
  'extra_time',
  'penalties',
] as const;

export async function GET(request: Request) {
  // Rate limit check -- must be first guard
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown';
  const rl = rateLimit(ip, RATE_LIMIT_UPDATES);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many requests', retryAfter: rl.retryAfterSeconds },
      {
        status: 429,
        headers: { 'Retry-After': String(rl.retryAfterSeconds) },
      }
    );
  }

  const { searchParams } = new URL(request.url);
  const leagueSlug = searchParams.get('leagueSlug');
  const season = searchParams.get('season');

  if (!leagueSlug || !season) {
    return NextResponse.json(
      { error: 'Missing leagueSlug or season' },
      { status: 400 }
    );
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { updatedAt: null, matchWindowActive: false },
      { status: 200 }
    );
  }

  const db = getDb();

  // Resolve league slug to league ID
  const leagueRow = await db
    .select({ id: leagues.id })
    .from(leagues)
    .where(eq(leagues.slug, leagueSlug))
    .limit(1);

  if (leagueRow.length === 0) {
    return NextResponse.json(
      { updatedAt: null, matchWindowActive: false },
      { status: 200 }
    );
  }

  const leagueId = leagueRow[0].id;

  // Get the latest updatedAt for this league+season standings
  const [updatedAtResult] = await db
    .select({ latest: max(standings.updatedAt) })
    .from(standings)
    .where(
      and(
        eq(standings.leagueId, leagueId),
        eq(standings.season, season)
      )
    );

  const updatedAt = updatedAtResult?.latest?.toISOString() ?? null;

  // Check if any fixture for this league is currently live or kicked off within the last 3 hours
  const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);

  const liveFixtures = await db
    .select({ id: fixtures.id })
    .from(fixtures)
    .where(
      and(
        eq(fixtures.leagueId, leagueId),
        eq(fixtures.season, season),
        inArray(fixtures.status, [...LIVE_STATUSES]),
        gte(fixtures.kickoff, threeHoursAgo)
      )
    )
    .limit(1);

  const matchWindowActive = liveFixtures.length > 0;

  return NextResponse.json({ updatedAt, matchWindowActive });
}
