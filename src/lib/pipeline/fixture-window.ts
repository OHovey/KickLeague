/**
 * Fixture-window detection for the live data pipeline.
 *
 * Determines which leagues have active or upcoming matches by querying
 * the fixtures table for kickoffs within a 6-hour window (3 hours ago
 * to 3 hours from now) that are NOT in terminal states.
 *
 * This prevents wasting API calls on quiet days when no matches are
 * happening. The polling handler calls getActiveLeagues() before
 * making any API-Football requests.
 */

import { getDb } from '@/db/connection';
import { fixtures, leagues } from '@/db/schema';
import { and, gte, lte, notInArray, eq } from 'drizzle-orm';

export interface ActiveLeague {
  leagueDbId: number;
  leagueApiId: number;
  leagueSlug: string;
  season: string;
  activeFixtureIds: number[];
}

/**
 * Find leagues with fixtures in the active window.
 *
 * Active window: kickoff between 3 hours ago and 3 hours from now,
 * AND fixture status is NOT terminal (finished, cancelled, postponed).
 *
 * Results are grouped by league with their fixture API IDs.
 */
export async function getActiveLeagues(): Promise<ActiveLeague[]> {
  const now = new Date();
  const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  const threeHoursFromNow = new Date(now.getTime() + 3 * 60 * 60 * 1000);

  const TERMINAL_STATUSES = ['finished', 'cancelled', 'postponed'] as const;

  const activeFixtures = await getDb()
    .select({
      fixtureApiId: fixtures.apiId,
      leagueId: fixtures.leagueId,
      season: fixtures.season,
    })
    .from(fixtures)
    .where(
      and(
        gte(fixtures.kickoff, threeHoursAgo),
        lte(fixtures.kickoff, threeHoursFromNow),
        notInArray(fixtures.status, [...TERMINAL_STATUSES]),
      ),
    );

  if (activeFixtures.length === 0) return [];

  // Group fixtures by league
  const leagueMap = new Map<
    number,
    { fixtureApiIds: number[]; season: string }
  >();
  for (const f of activeFixtures) {
    const existing = leagueMap.get(f.leagueId);
    if (existing) {
      existing.fixtureApiIds.push(f.fixtureApiId);
    } else {
      leagueMap.set(f.leagueId, {
        fixtureApiIds: [f.fixtureApiId],
        season: f.season,
      });
    }
  }

  // Look up API IDs and slugs for each league
  const leagueIds = [...leagueMap.keys()];
  const leagueRows: { id: number; apiId: number; slug: string }[] = [];

  for (const leagueId of leagueIds) {
    const rows = await getDb()
      .select({ id: leagues.id, apiId: leagues.apiId, slug: leagues.slug })
      .from(leagues)
      .where(eq(leagues.id, leagueId));

    if (rows[0]) leagueRows.push(rows[0]);
  }

  return leagueRows.map((l) => {
    const data = leagueMap.get(l.id)!;
    return {
      leagueDbId: l.id,
      leagueApiId: l.apiId,
      leagueSlug: l.slug,
      season: data.season,
      activeFixtureIds: data.fixtureApiIds,
    };
  });
}

/**
 * Check if any leagues have active match windows.
 * Thin wrapper around getActiveLeagues() for quick boolean checks.
 */
export async function isMatchWindowActive(): Promise<boolean> {
  const activeLeagues = await getActiveLeagues();
  return activeLeagues.length > 0;
}
