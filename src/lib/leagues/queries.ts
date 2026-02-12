// League page database queries

import { eq, and, sql, desc, count, isNotNull } from 'drizzle-orm';
import { getDb } from '@/db/connection';
import { fixtureEvents, fixtures, players, teams } from '@/db/schema';

// ── Types ──────────────────────────────────────────────────────────────────

export interface TopScorerRow {
  playerId: number;
  playerName: string;
  teamId: number;
  teamName: string;
  teamLogoUrl: string | null;
  goalCount: number;
}

export interface LeagueDescriptionData {
  description: string;
  country: string;
  teamCount: number;
  founded: string;
}

// ── League Descriptions (editorial, static) ────────────────────────────────

const LEAGUE_DESCRIPTIONS: Record<string, LeagueDescriptionData> = {
  'premier-league': {
    description:
      'The top tier of English football, founded in 1992. Known for its global reach, competitive balance, and intense atmosphere. 20 clubs compete across 38 matchweeks from August to May.',
    country: 'England',
    teamCount: 20,
    founded: '1992',
  },
  'la-liga': {
    description:
      "Spain's premier football competition, founded in 1929. Known for technical excellence, tiki-taka passing, and producing world-class talent. 20 clubs compete across 38 matchweeks.",
    country: 'Spain',
    teamCount: 20,
    founded: '1929',
  },
  'serie-a': {
    description:
      "Italy's top-flight football league, founded in 1898. Known for tactical sophistication, strong defensive traditions, and passionate supporters. 20 clubs compete across 38 matchweeks.",
    country: 'Italy',
    teamCount: 20,
    founded: '1898',
  },
  bundesliga: {
    description:
      "Germany's premier football league, founded in 1963. Known for high attendance, affordable ticket prices, and developing young talent. 18 clubs compete across 34 matchweeks.",
    country: 'Germany',
    teamCount: 18,
    founded: '1963',
  },
  'ligue-1': {
    description:
      "France's top division of football, founded in 1932. Known for producing exceptional young talent who go on to star across Europe. 18 clubs compete across 34 matchweeks.",
    country: 'France',
    teamCount: 18,
    founded: '1932',
  },
};

// ── Queries ────────────────────────────────────────────────────────────────

/**
 * Get the top N scorers for a league and season.
 * Counts goals and penalties scored (excludes own goals).
 * Skips events without a player ID.
 */
export async function getTopScorersForLeague(
  leagueId: number,
  season: string,
  limit: number = 5
): Promise<TopScorerRow[]> {
  const db = getDb();

  const result = await db
    .select({
      playerId: fixtureEvents.playerId,
      playerName: players.name,
      teamId: teams.id,
      teamName: teams.name,
      teamLogoUrl: teams.logoUrl,
      goalCount: count(fixtureEvents.id).as('goal_count'),
    })
    .from(fixtureEvents)
    .innerJoin(fixtures, eq(fixtureEvents.fixtureId, fixtures.id))
    .innerJoin(players, eq(fixtureEvents.playerId, players.id))
    .innerJoin(teams, eq(players.teamId, teams.id))
    .where(
      and(
        eq(fixtures.leagueId, leagueId),
        eq(fixtures.season, season),
        isNotNull(fixtureEvents.playerId),
        sql`${fixtureEvents.type} IN ('goal', 'penalty_scored')`
      )
    )
    .groupBy(
      fixtureEvents.playerId,
      players.name,
      teams.id,
      teams.name,
      teams.logoUrl
    )
    .orderBy(desc(sql`goal_count`))
    .limit(limit);

  return result.map((row) => ({
    playerId: row.playerId!,
    playerName: row.playerName,
    teamId: row.teamId,
    teamName: row.teamName,
    teamLogoUrl: row.teamLogoUrl,
    goalCount: row.goalCount,
  }));
}

/**
 * Get static league description data for a given league slug.
 * Returns null if the slug is not one of the 5 supported leagues.
 */
export function getLeagueDescription(
  leagueSlug: string
): LeagueDescriptionData | null {
  return LEAGUE_DESCRIPTIONS[leagueSlug] ?? null;
}
