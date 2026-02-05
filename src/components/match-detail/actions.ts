'use server';

import { eq, and, asc, max } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { getDb, isDatabaseConfigured } from '@/db/connection';
import {
  fixtures,
  fixtureStats,
  fixtureEvents,
  teams,
  players,
  standings,
  leagues,
} from '@/db/schema';
import { getH2HSummary, type H2HSummary } from '@/lib/matches/h2h';

// ── Types ──────────────────────────────────────────────────────────────────

export interface MatchDetailTeam {
  id: number;
  name: string;
  shortName: string | null;
  logoUrl: string | null;
}

export interface MatchDetail {
  id: number;
  leagueId: number;
  season: string;
  matchweek: number | null;
  kickoff: Date;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  venue: string | null;
  referee: string | null;
  homeTeam: MatchDetailTeam;
  awayTeam: MatchDetailTeam;
}

export interface MatchStatRow {
  possession: number | null;
  shots: number | null;
  shotsOnTarget: number | null;
  corners: number | null;
  fouls: number | null;
  offsides: number | null;
  yellowCards: number | null;
  redCards: number | null;
  xg: number | null;
}

export interface MatchStatsResult {
  home: MatchStatRow | null;
  away: MatchStatRow | null;
}

export interface MatchEventRow {
  id: number;
  type: string;
  minute: number;
  extraMinute: number | null;
  teamId: number;
  playerName: string | null;
  assistPlayerName: string | null;
  detail: string | null;
}

export interface TeamSeasonStats {
  position: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  form: string | null;
}

export interface UpcomingMatchContext {
  h2h: H2HSummary;
  homeTeamStats: TeamSeasonStats | null;
  awayTeamStats: TeamSeasonStats | null;
}

// ── Actions ────────────────────────────────────────────────────────────────

/**
 * Fetch single fixture with home and away team data.
 */
export async function fetchMatchDetail(
  fixtureId: number
): Promise<MatchDetail | null> {
  if (!isDatabaseConfigured()) return null;

  const homeTeam = alias(teams, 'homeTeam');
  const awayTeam = alias(teams, 'awayTeam');

  const rows = await getDb()
    .select({
      id: fixtures.id,
      leagueId: fixtures.leagueId,
      season: fixtures.season,
      matchweek: fixtures.matchweek,
      kickoff: fixtures.kickoff,
      status: fixtures.status,
      homeScore: fixtures.homeScore,
      awayScore: fixtures.awayScore,
      venue: fixtures.venue,
      referee: fixtures.referee,
      homeTeamId: homeTeam.id,
      homeTeamName: homeTeam.name,
      homeTeamShortName: homeTeam.shortName,
      homeTeamLogoUrl: homeTeam.logoUrl,
      awayTeamId: awayTeam.id,
      awayTeamName: awayTeam.name,
      awayTeamShortName: awayTeam.shortName,
      awayTeamLogoUrl: awayTeam.logoUrl,
    })
    .from(fixtures)
    .innerJoin(homeTeam, eq(fixtures.homeTeamId, homeTeam.id))
    .innerJoin(awayTeam, eq(fixtures.awayTeamId, awayTeam.id))
    .where(eq(fixtures.id, fixtureId))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  return {
    id: row.id,
    leagueId: row.leagueId,
    season: row.season,
    matchweek: row.matchweek,
    kickoff: row.kickoff,
    status: row.status,
    homeScore: row.homeScore,
    awayScore: row.awayScore,
    venue: row.venue,
    referee: row.referee,
    homeTeam: {
      id: row.homeTeamId,
      name: row.homeTeamName,
      shortName: row.homeTeamShortName,
      logoUrl: row.homeTeamLogoUrl,
    },
    awayTeam: {
      id: row.awayTeamId,
      name: row.awayTeamName,
      shortName: row.awayTeamShortName,
      logoUrl: row.awayTeamLogoUrl,
    },
  };
}

/**
 * Fetch match stats for both teams in a fixture.
 */
export async function fetchMatchStats(
  fixtureId: number
): Promise<MatchStatsResult> {
  if (!isDatabaseConfigured()) return { home: null, away: null };

  // First get the fixture to know home/away team IDs
  const fix = await getDb()
    .select({
      homeTeamId: fixtures.homeTeamId,
      awayTeamId: fixtures.awayTeamId,
    })
    .from(fixtures)
    .where(eq(fixtures.id, fixtureId))
    .limit(1);

  if (!fix[0]) return { home: null, away: null };

  const rows = await getDb()
    .select({
      teamId: fixtureStats.teamId,
      possession: fixtureStats.possession,
      shots: fixtureStats.shots,
      shotsOnTarget: fixtureStats.shotsOnTarget,
      corners: fixtureStats.corners,
      fouls: fixtureStats.fouls,
      offsides: fixtureStats.offsides,
      yellowCards: fixtureStats.yellowCards,
      redCards: fixtureStats.redCards,
      xg: fixtureStats.xg,
    })
    .from(fixtureStats)
    .where(eq(fixtureStats.fixtureId, fixtureId));

  let home: MatchStatRow | null = null;
  let away: MatchStatRow | null = null;

  for (const row of rows) {
    const stat: MatchStatRow = {
      possession: row.possession,
      shots: row.shots,
      shotsOnTarget: row.shotsOnTarget,
      corners: row.corners,
      fouls: row.fouls,
      offsides: row.offsides,
      yellowCards: row.yellowCards,
      redCards: row.redCards,
      xg: row.xg,
    };

    if (row.teamId === fix[0].homeTeamId) {
      home = stat;
    } else if (row.teamId === fix[0].awayTeamId) {
      away = stat;
    }
  }

  return { home, away };
}

/**
 * Fetch all events for a fixture with player names.
 */
export async function fetchMatchEvents(
  fixtureId: number
): Promise<MatchEventRow[]> {
  if (!isDatabaseConfigured()) return [];

  const assistPlayer = alias(players, 'assistPlayer');

  const rows = await getDb()
    .select({
      id: fixtureEvents.id,
      type: fixtureEvents.type,
      minute: fixtureEvents.minute,
      extraMinute: fixtureEvents.extraMinute,
      teamId: fixtureEvents.teamId,
      playerName: players.name,
      assistPlayerName: assistPlayer.name,
      detail: fixtureEvents.detail,
    })
    .from(fixtureEvents)
    .leftJoin(players, eq(fixtureEvents.playerId, players.id))
    .leftJoin(assistPlayer, eq(fixtureEvents.assistPlayerId, assistPlayer.id))
    .where(eq(fixtureEvents.fixtureId, fixtureId))
    .orderBy(asc(fixtureEvents.minute), asc(fixtureEvents.extraMinute));

  return rows;
}

/**
 * Fetch context data for upcoming matches: H2H and both teams' season stats.
 */
export async function fetchUpcomingMatchContext(
  homeTeamId: number,
  awayTeamId: number,
  leagueId: number,
  season: string
): Promise<UpcomingMatchContext> {
  const h2h = await getH2HSummary(homeTeamId, awayTeamId);

  // Get latest matchweek for standings
  const maxWeekResult = await getDb()
    .select({ maxWeek: max(standings.matchweek) })
    .from(standings)
    .where(
      and(eq(standings.leagueId, leagueId), eq(standings.season, season))
    );

  const maxWeek = maxWeekResult[0]?.maxWeek;
  let homeTeamStats: TeamSeasonStats | null = null;
  let awayTeamStats: TeamSeasonStats | null = null;

  if (maxWeek) {
    const rows = await getDb()
      .select({
        teamId: standings.teamId,
        position: standings.position,
        points: standings.points,
        goalsFor: standings.goalsFor,
        goalsAgainst: standings.goalsAgainst,
        played: standings.played,
        won: standings.won,
        drawn: standings.drawn,
        lost: standings.lost,
        form: standings.form,
      })
      .from(standings)
      .where(
        and(
          eq(standings.leagueId, leagueId),
          eq(standings.season, season),
          eq(standings.matchweek, maxWeek)
        )
      );

    for (const row of rows) {
      const stats: TeamSeasonStats = {
        position: row.position,
        points: row.points,
        goalsFor: row.goalsFor,
        goalsAgainst: row.goalsAgainst,
        played: row.played,
        won: row.won,
        drawn: row.drawn,
        lost: row.lost,
        form: row.form,
      };

      if (row.teamId === homeTeamId) homeTeamStats = stats;
      if (row.teamId === awayTeamId) awayTeamStats = stats;
    }
  }

  return { h2h, homeTeamStats, awayTeamStats };
}

/**
 * Look up a league slug by league ID.
 */
export async function getLeagueSlugById(
  leagueId: number
): Promise<string | null> {
  if (!isDatabaseConfigured()) return null;

  const rows = await getDb()
    .select({ slug: leagues.slug })
    .from(leagues)
    .where(eq(leagues.id, leagueId))
    .limit(1);

  return rows[0]?.slug ?? null;
}
