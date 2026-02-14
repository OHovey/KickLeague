// Match database queries for recent results, upcoming fixtures, and key events

import { eq, and, desc, asc, inArray, notInArray, max, isNotNull, gte, lte } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { getDb, isDatabaseConfigured } from '@/db/connection';
import { fixtures, fixtureEvents, teams, standings, players } from '@/db/schema';
import { getLeagueBySlug, getLatestMatchweek } from '@/lib/standings/queries';

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
    // Get the latest completed matchweek from standings to set a boundary
    // This excludes straggler rescheduled matches from old matchweeks
    const latestCompleted = await getLatestMatchweek(league.id, league.currentSeason);

    // Step 1: find the N most recent distinct matchweeks with finished matches
    const recentMws = await getDb()
      .selectDistinct({ matchweek: fixtures.matchweek })
      .from(fixtures)
      .where(
        and(
          eq(fixtures.leagueId, league.id),
          eq(fixtures.season, league.currentSeason),
          eq(fixtures.status, 'finished'),
          isNotNull(fixtures.matchweek),
          ...(latestCompleted !== null ? [lte(fixtures.matchweek, latestCompleted)] : []),
        ),
      )
      .orderBy(desc(fixtures.matchweek))
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
  // Tracks rescheduled matches whose matchweek is overridden for display
  const matchweekOverrides = new Map<number, number>();

  if (byMatchweek) {
    // Get the latest matchweek from standings to set a boundary
    // This excludes straggler rescheduled matches from old matchweeks (e.g. MW16 showing before MW24)
    const latestFromStandings = await getLatestMatchweek(league.id, league.currentSeason);

    // Determine the boundary matchweek for upcoming matches.
    // Default: latestFromStandings + 1 (exclude completed matchweeks).
    // Exception: if the latest standings MW still has scheduled fixtures that
    // play BEFORE the next MW starts, it's genuinely in-progress — include it.
    // (Rescheduled stragglers that play AFTER the next MW starts don't count.)
    let boundary: number | null = null;
    if (latestFromStandings !== null) {
      boundary = latestFromStandings + 1;

      const stillScheduled = await getDb()
        .select({ kickoff: fixtures.kickoff })
        .from(fixtures)
        .where(
          and(
            eq(fixtures.leagueId, league.id),
            eq(fixtures.season, league.currentSeason),
            eq(fixtures.matchweek, latestFromStandings),
            eq(fixtures.status, 'scheduled'),
          ),
        );

      if (stillScheduled.length > 0) {
        // Compare against the next matchweek's earliest kickoff
        const nextMwFirst = await getDb()
          .select({ kickoff: fixtures.kickoff })
          .from(fixtures)
          .where(
            and(
              eq(fixtures.leagueId, league.id),
              eq(fixtures.season, league.currentSeason),
              eq(fixtures.matchweek, latestFromStandings + 1),
            ),
          )
          .orderBy(asc(fixtures.kickoff))
          .limit(1);

        if (nextMwFirst.length > 0) {
          // If any scheduled match plays before the next MW starts,
          // the matchweek is genuinely in-progress
          const anyBeforeNext = stillScheduled.some(
            (m) => m.kickoff.getTime() <= nextMwFirst[0].kickoff.getTime(),
          );
          if (anyBeforeNext) {
            boundary = latestFromStandings;
          }
        } else {
          // No next matchweek — this is the last one, include it
          boundary = latestFromStandings;
        }
      }
    }

    // Find the N soonest distinct matchweeks by matchweek number
    const upcomingMws = await getDb()
      .selectDistinct({ matchweek: fixtures.matchweek })
      .from(fixtures)
      .where(
        and(
          eq(fixtures.leagueId, league.id),
          eq(fixtures.season, league.currentSeason),
          eq(fixtures.status, 'scheduled'),
          isNotNull(fixtures.matchweek),
          ...(boundary !== null ? [gte(fixtures.matchweek, boundary)] : []),
        ),
      )
      .orderBy(asc(fixtures.matchweek))
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

    // Find rescheduled matches from other matchweeks that play within our
    // date window (e.g. MW31 match on Feb 18 when we fetched MW27-29,
    // or MW24 match on Feb 18 when boundary pushed us to MW25+)
    if (rows.length > 0) {
      const latestKickoff = rows[rows.length - 1].kickoff;

      const rescheduled = await getDb()
        .select(selectFields)
        .from(fixtures)
        .innerJoin(homeTeam, eq(fixtures.homeTeamId, homeTeam.id))
        .innerJoin(awayTeam, eq(fixtures.awayTeamId, awayTeam.id))
        .where(
          and(
            eq(fixtures.leagueId, league.id),
            eq(fixtures.season, league.currentSeason),
            eq(fixtures.status, 'scheduled'),
            notInArray(fixtures.matchweek, mwValues),
            lte(fixtures.kickoff, latestKickoff),
          ),
        )
        .orderBy(asc(fixtures.kickoff));

      if (rescheduled.length > 0) {
        // Compute median kickoff per fetched matchweek for nearest-match assignment
        const mwMedians = new Map<number, number>();
        for (const mw of mwValues) {
          const times = rows
            .filter((r) => r.matchweek === mw)
            .map((r) => r.kickoff.getTime())
            .sort((a, b) => a - b);
          if (times.length > 0) {
            mwMedians.set(mw, times[Math.floor(times.length / 2)]);
          }
        }

        // Assign each rescheduled match to the nearest matchweek by date
        for (const match of rescheduled) {
          let closestMw = mwValues[0];
          let closestDist = Infinity;
          for (const [mw, median] of mwMedians) {
            const dist = Math.abs(match.kickoff.getTime() - median);
            if (dist < closestDist) {
              closestDist = dist;
              closestMw = mw;
            }
          }
          matchweekOverrides.set(match.id, closestMw);
        }

        rows = [...rows, ...rescheduled];
        rows.sort((a, b) => a.kickoff.getTime() - b.kickoff.getTime());
      }
    }
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
    matchweek: matchweekOverrides.get(row.id) ?? row.matchweek,
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
