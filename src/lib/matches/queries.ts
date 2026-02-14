// Match database queries for recent results, upcoming fixtures, and key events

import { eq, and, desc, asc, inArray, max, min, isNotNull } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { getDb, isDatabaseConfigured } from '@/db/connection';
import { fixtures, fixtureEvents, teams, standings, players } from '@/db/schema';
import { getLeagueBySlug } from '@/lib/standings/queries';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface MatchTeam {
  id: number;
  name: string;
  shortName: string | null;
  logoUrl: string | null;
  slug: string;
}

export interface MatchWithTeams {
  id: number;
  matchweek: number | null;
  kickoff: Date;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  venue: string | null;
  homeTeam: MatchTeam;
  awayTeam: MatchTeam;
}

export interface MatchEvent {
  id: number;
  fixtureId: number;
  type: string;
  minute: number;
  extraMinute: number | null;
  teamId: number;
  playerName: string | null;
  detail: string | null;
}

// ─── Queries ────────────────────────────────────────────────────────────────

/**
 * Fetch recent finished matches for a league, ordered by kickoff descending.
 * When byMatchweek is true, limit means "number of distinct matchweeks" and
 * returns all matches from those matchweeks (avoids gaps from rescheduled games).
 */
export async function getRecentMatches(
  leagueSlug: string,
  limit: number = 10,
  byMatchweek: boolean = false,
): Promise<MatchWithTeams[]> {
  if (!isDatabaseConfigured()) return [];

  const league = await getLeagueBySlug(leagueSlug);
  if (!league) return [];

  const homeTeam = alias(teams, 'homeTeam');
  const awayTeam = alias(teams, 'awayTeam');

  const selectFields = {
    id: fixtures.id,
    matchweek: fixtures.matchweek,
    kickoff: fixtures.kickoff,
    status: fixtures.status,
    homeScore: fixtures.homeScore,
    awayScore: fixtures.awayScore,
    venue: fixtures.venue,
    homeTeamId: homeTeam.id,
    homeTeamName: homeTeam.name,
    homeTeamShortName: homeTeam.shortName,
    homeTeamLogoUrl: homeTeam.logoUrl,
    homeTeamSlug: homeTeam.slug,
    awayTeamId: awayTeam.id,
    awayTeamName: awayTeam.name,
    awayTeamShortName: awayTeam.shortName,
    awayTeamLogoUrl: awayTeam.logoUrl,
    awayTeamSlug: awayTeam.slug,
  };

  let rows;

  if (byMatchweek) {
    // Step 1: find the N most recent matchweeks by kickoff date (not number,
    // since rescheduled games mean lower-numbered matchweeks can be played later)
    const recentMws = await getDb()
      .select({
        matchweek: fixtures.matchweek,
        latestKickoff: max(fixtures.kickoff),
      })
      .from(fixtures)
      .where(
        and(
          eq(fixtures.leagueId, league.id),
          eq(fixtures.season, league.currentSeason),
          eq(fixtures.status, 'finished'),
          isNotNull(fixtures.matchweek),
        ),
      )
      .groupBy(fixtures.matchweek)
      .orderBy(desc(max(fixtures.kickoff)))
      .limit(limit);

    const mwValues = recentMws.map((r) => r.matchweek!);
    if (mwValues.length === 0) return [];

    // Step 2: fetch all matches from those matchweeks
    rows = await getDb()
      .select(selectFields)
      .from(fixtures)
      .innerJoin(homeTeam, eq(fixtures.homeTeamId, homeTeam.id))
      .innerJoin(awayTeam, eq(fixtures.awayTeamId, awayTeam.id))
      .where(
        and(
          eq(fixtures.leagueId, league.id),
          eq(fixtures.season, league.currentSeason),
          eq(fixtures.status, 'finished'),
          inArray(fixtures.matchweek, mwValues),
        ),
      )
      .orderBy(desc(fixtures.kickoff));
  } else {
    rows = await getDb()
      .select(selectFields)
      .from(fixtures)
      .innerJoin(homeTeam, eq(fixtures.homeTeamId, homeTeam.id))
      .innerJoin(awayTeam, eq(fixtures.awayTeamId, awayTeam.id))
      .where(
        and(
          eq(fixtures.leagueId, league.id),
          eq(fixtures.season, league.currentSeason),
          eq(fixtures.status, 'finished'),
        ),
      )
      .orderBy(desc(fixtures.kickoff))
      .limit(limit);
  }

  return rows.map((row) => ({
    id: row.id,
    matchweek: row.matchweek,
    kickoff: row.kickoff,
    status: row.status,
    homeScore: row.homeScore,
    awayScore: row.awayScore,
    venue: row.venue,
    homeTeam: {
      id: row.homeTeamId,
      name: row.homeTeamName,
      shortName: row.homeTeamShortName,
      logoUrl: row.homeTeamLogoUrl,
      slug: row.homeTeamSlug,
    },
    awayTeam: {
      id: row.awayTeamId,
      name: row.awayTeamName,
      shortName: row.awayTeamShortName,
      logoUrl: row.awayTeamLogoUrl,
      slug: row.awayTeamSlug,
    },
  }));
}

/**
 * Fetch upcoming scheduled matches for a league, ordered by kickoff ascending (soonest first).
 * When byMatchweek is true, limit means "number of distinct matchweeks" and
 * returns all matches from those matchweeks (avoids gaps from rescheduled games).
 */
export async function getUpcomingFixtures(
  leagueSlug: string,
  limit: number = 10,
  byMatchweek: boolean = false,
): Promise<MatchWithTeams[]> {
  if (!isDatabaseConfigured()) return [];

  const league = await getLeagueBySlug(leagueSlug);
  if (!league) return [];

  const homeTeam = alias(teams, 'homeTeam');
  const awayTeam = alias(teams, 'awayTeam');

  const selectFields = {
    id: fixtures.id,
    matchweek: fixtures.matchweek,
    kickoff: fixtures.kickoff,
    status: fixtures.status,
    homeScore: fixtures.homeScore,
    awayScore: fixtures.awayScore,
    venue: fixtures.venue,
    homeTeamId: homeTeam.id,
    homeTeamName: homeTeam.name,
    homeTeamShortName: homeTeam.shortName,
    homeTeamLogoUrl: homeTeam.logoUrl,
    homeTeamSlug: homeTeam.slug,
    awayTeamId: awayTeam.id,
    awayTeamName: awayTeam.name,
    awayTeamShortName: awayTeam.shortName,
    awayTeamLogoUrl: awayTeam.logoUrl,
    awayTeamSlug: awayTeam.slug,
  };

  let rows;

  if (byMatchweek) {
    // Find the N soonest matchweeks by earliest kickoff date (not number,
    // since rescheduled games mean lower-numbered matchweeks can be later)
    const upcomingMws = await getDb()
      .select({
        matchweek: fixtures.matchweek,
        earliestKickoff: min(fixtures.kickoff),
      })
      .from(fixtures)
      .where(
        and(
          eq(fixtures.leagueId, league.id),
          eq(fixtures.season, league.currentSeason),
          eq(fixtures.status, 'scheduled'),
          isNotNull(fixtures.matchweek),
        ),
      )
      .groupBy(fixtures.matchweek)
      .orderBy(asc(min(fixtures.kickoff)))
      .limit(limit);

    const mwValues = upcomingMws.map((r) => r.matchweek!);
    if (mwValues.length === 0) return [];

    rows = await getDb()
      .select(selectFields)
      .from(fixtures)
      .innerJoin(homeTeam, eq(fixtures.homeTeamId, homeTeam.id))
      .innerJoin(awayTeam, eq(fixtures.awayTeamId, awayTeam.id))
      .where(
        and(
          eq(fixtures.leagueId, league.id),
          eq(fixtures.season, league.currentSeason),
          eq(fixtures.status, 'scheduled'),
          inArray(fixtures.matchweek, mwValues),
        ),
      )
      .orderBy(asc(fixtures.kickoff));
  } else {
    rows = await getDb()
      .select(selectFields)
      .from(fixtures)
      .innerJoin(homeTeam, eq(fixtures.homeTeamId, homeTeam.id))
      .innerJoin(awayTeam, eq(fixtures.awayTeamId, awayTeam.id))
      .where(
        and(
          eq(fixtures.leagueId, league.id),
          eq(fixtures.season, league.currentSeason),
          eq(fixtures.status, 'scheduled'),
        ),
      )
      .orderBy(asc(fixtures.kickoff))
      .limit(limit);
  }

  return rows.map((row) => ({
    id: row.id,
    matchweek: row.matchweek,
    kickoff: row.kickoff,
    status: row.status,
    homeScore: row.homeScore,
    awayScore: row.awayScore,
    venue: row.venue,
    homeTeam: {
      id: row.homeTeamId,
      name: row.homeTeamName,
      shortName: row.homeTeamShortName,
      logoUrl: row.homeTeamLogoUrl,
      slug: row.homeTeamSlug,
    },
    awayTeam: {
      id: row.awayTeamId,
      name: row.awayTeamName,
      shortName: row.awayTeamShortName,
      logoUrl: row.awayTeamLogoUrl,
      slug: row.awayTeamSlug,
    },
  }));
}

/**
 * Batch fetch key events (goals, own goals, penalties scored, red cards) for a set of fixtures.
 * Returns a Map keyed by fixtureId for O(1) lookup.
 */
export async function getKeyEventsForMatches(
  fixtureIds: number[]
): Promise<Map<number, MatchEvent[]>> {
  const eventsMap = new Map<number, MatchEvent[]>();
  if (fixtureIds.length === 0 || !isDatabaseConfigured()) return eventsMap;

  const rows = await getDb()
    .select({
      id: fixtureEvents.id,
      fixtureId: fixtureEvents.fixtureId,
      type: fixtureEvents.type,
      minute: fixtureEvents.minute,
      extraMinute: fixtureEvents.extraMinute,
      teamId: fixtureEvents.teamId,
      playerName: players.name,
      detail: fixtureEvents.detail,
    })
    .from(fixtureEvents)
    .leftJoin(players, eq(fixtureEvents.playerId, players.id))
    .where(
      and(
        inArray(fixtureEvents.fixtureId, fixtureIds),
        inArray(fixtureEvents.type, ['goal', 'own_goal', 'penalty_scored', 'red_card'])
      )
    )
    .orderBy(asc(fixtureEvents.minute));

  for (const row of rows) {
    const events = eventsMap.get(row.fixtureId) ?? [];
    events.push({
      id: row.id,
      fixtureId: row.fixtureId,
      type: row.type,
      minute: row.minute,
      extraMinute: row.extraMinute,
      teamId: row.teamId,
      playerName: row.playerName,
      detail: row.detail,
    });
    eventsMap.set(row.fixtureId, events);
  }

  return eventsMap;
}

/**
 * Batch fetch form strings for a set of teams at the latest matchweek.
 * Returns a Map of teamId -> form string (e.g. "WWDLW").
 */
export async function getTeamForm(
  teamIds: number[],
  leagueId: number,
  season: string
): Promise<Map<number, string>> {
  const formMap = new Map<number, string>();
  if (teamIds.length === 0 || !isDatabaseConfigured()) return formMap;

  // Get the max matchweek for these teams in this league/season
  const maxWeekResult = await getDb()
    .select({ maxWeek: max(standings.matchweek) })
    .from(standings)
    .where(
      and(
        eq(standings.leagueId, leagueId),
        eq(standings.season, season)
      )
    );

  const maxWeek = maxWeekResult[0]?.maxWeek;
  if (!maxWeek) return formMap;

  const rows = await getDb()
    .select({
      teamId: standings.teamId,
      form: standings.form,
    })
    .from(standings)
    .where(
      and(
        inArray(standings.teamId, teamIds),
        eq(standings.leagueId, leagueId),
        eq(standings.season, season),
        eq(standings.matchweek, maxWeek)
      )
    );

  for (const row of rows) {
    if (row.form) {
      formMap.set(row.teamId, row.form);
    }
  }

  return formMap;
}
