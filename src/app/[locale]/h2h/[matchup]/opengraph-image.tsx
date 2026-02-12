import { ImageResponse } from 'next/og';
import { isDatabaseConfigured, getDb } from '@/db/connection';
import { teams } from '@/db/schema';
import {
  getH2HMeetings,
  getH2HAggregateRecord,
} from '@/lib/h2h/queries';

export const alt = 'Head-to-Head comparison';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/**
 * Parse a matchup slug like "arsenal-vs-chelsea" into two team slugs.
 * Team slugs can contain hyphens, so we query all slugs from DB to
 * find the valid -vs- split position.
 */
async function parseMatchupSlug(
  matchupSlug: string
): Promise<{ team1Slug: string; team2Slug: string } | null> {
  const db = getDb();
  const allTeams = await db
    .select({ slug: teams.slug })
    .from(teams);
  const slugSet = new Set(allTeams.map((t) => t.slug));

  const separator = '-vs-';
  let searchFrom = 0;

  while (true) {
    const idx = matchupSlug.indexOf(separator, searchFrom);
    if (idx === -1) break;

    const left = matchupSlug.slice(0, idx);
    const right = matchupSlug.slice(idx + separator.length);

    if (slugSet.has(left) && slugSet.has(right)) {
      return { team1Slug: left, team2Slug: right };
    }

    searchFrom = idx + 1;
  }

  return null;
}

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; matchup: string }>;
}) {
  const { matchup } = await params;

  // Fallback card
  const fallback = new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          fontSize: 48,
          background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
          color: '#1a1a2e',
          width: '100%',
          height: '100%',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
        }}
      >
        KickLeague
      </div>
    ),
    { ...size },
  );

  if (!isDatabaseConfigured()) {
    return fallback;
  }

  let parsed: { team1Slug: string; team2Slug: string } | null = null;
  try {
    parsed = await parseMatchupSlug(matchup);
  } catch {
    return fallback;
  }

  if (!parsed) {
    return fallback;
  }

  const { team1Slug, team2Slug } = parsed;

  let meetings: Awaited<ReturnType<typeof getH2HMeetings>>;
  try {
    meetings = await getH2HMeetings(team1Slug, team2Slug);
  } catch {
    return fallback;
  }

  if (meetings.length < 3) {
    return fallback;
  }

  // Determine team names from first meeting
  const first = meetings[0];
  const team1Name =
    first.homeTeamSlug === team1Slug
      ? first.homeTeamName
      : first.awayTeamName;
  const team2Name =
    first.homeTeamSlug === team2Slug
      ? first.homeTeamName
      : first.awayTeamName;

  const team1Id =
    first.homeTeamSlug === team1Slug
      ? first.homeTeamId
      : first.awayTeamId;
  const team2Id =
    first.homeTeamSlug === team2Slug
      ? first.homeTeamId
      : first.awayTeamId;

  const aggregate = getH2HAggregateRecord(meetings, team1Id, team2Id);

  const recordLine = `${aggregate.team1Wins} ${aggregate.team1Wins === 1 ? 'Win' : 'Wins'} | ${aggregate.draws} ${aggregate.draws === 1 ? 'Draw' : 'Draws'} | ${aggregate.team2Wins} ${aggregate.team2Wins === 1 ? 'Win' : 'Wins'}`;

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
          color: '#1a1a2e',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ fontSize: 52, fontWeight: 800 }}>
          {team1Name} vs {team2Name}
        </div>
        <div
          style={{
            fontSize: 28,
            marginTop: 16,
            opacity: 0.6,
          }}
        >
          Head-to-Head
        </div>
        <div
          style={{
            fontSize: 22,
            marginTop: 16,
            opacity: 0.5,
          }}
        >
          {recordLine}
        </div>
        <div
          style={{
            fontSize: 16,
            marginTop: 12,
            opacity: 0.35,
          }}
        >
          {aggregate.totalMeetings} meetings
        </div>
        <div style={{ fontSize: 20, marginTop: 28, opacity: 0.4 }}>
          KickLeague
        </div>
      </div>
    ),
    { ...size },
  );
}
