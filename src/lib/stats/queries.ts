// Stat highlight database queries for homepage cards

import { eq, and, sql, desc, count, max, isNotNull } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { getDb } from '@/db/connection';
import {
  fixtureEvents,
  fixtures,
  fixtureOdds,
  players,
  teams,
  standings,
} from '@/db/schema';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface TopScorerResult {
  playerId: number;
  playerName: string;
  teamId: number;
  teamName: string;
  teamLogoUrl: string | null;
  goalCount: number;
}

export interface BiggestUpsetResult {
  fixtureId: number;
  homeTeamId: number;
  homeTeamName: string;
  homeTeamLogoUrl: string | null;
  awayTeamId: number;
  awayTeamName: string;
  awayTeamLogoUrl: string | null;
  homeScore: number;
  awayScore: number;
  matchweek: number | null;
  winningOdds: number;
}

export interface FormTeamResult {
  teamId: number;
  teamName: string;
  teamLogoUrl: string | null;
  form: string;
  position: number;
  points: number;
}

// ─── Queries ────────────────────────────────────────────────────────────────

/**
 * Get the top scorer for a league and season.
 * Counts goals and penalties scored (excludes own goals).
 * Skips events without a player ID.
 */
export async function getTopScorer(
  leagueId: number,
  season: string
): Promise<TopScorerResult | null> {
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
    .limit(1);

  if (!result[0]) return null;

  return {
    playerId: result[0].playerId!,
    playerName: result[0].playerName,
    teamId: result[0].teamId,
    teamName: result[0].teamName,
    teamLogoUrl: result[0].teamLogoUrl,
    goalCount: result[0].goalCount,
  };
}

/**
 * Get the biggest upset for a league and season.
 * Uses odds-based approach: the winning team's average pre-match odds
 * determine the upset magnitude (higher odds = bigger upset).
 * Only considers decisive results (no draws).
 */
export async function getBiggestUpset(
  leagueId: number,
  season: string
): Promise<BiggestUpsetResult | null> {
  const db = getDb();

  // Find the fixture with the highest winning-side average odds
  const result = await db
    .select({
      fixtureId: fixtures.id,
      homeTeamId: fixtures.homeTeamId,
      awayTeamId: fixtures.awayTeamId,
      homeScore: fixtures.homeScore,
      awayScore: fixtures.awayScore,
      matchweek: fixtures.matchweek,
      winningOdds: sql<number>`CASE
        WHEN ${fixtures.homeScore} > ${fixtures.awayScore} THEN AVG(${fixtureOdds.homeOdds})
        ELSE AVG(${fixtureOdds.awayOdds})
      END`.as('winning_odds'),
    })
    .from(fixtures)
    .innerJoin(fixtureOdds, eq(fixtureOdds.fixtureId, fixtures.id))
    .where(
      and(
        eq(fixtures.leagueId, leagueId),
        eq(fixtures.season, season),
        eq(fixtures.status, 'finished'),
        sql`${fixtures.homeScore} != ${fixtures.awayScore}`
      )
    )
    .groupBy(
      fixtures.id,
      fixtures.homeTeamId,
      fixtures.awayTeamId,
      fixtures.homeScore,
      fixtures.awayScore,
      fixtures.matchweek
    )
    .orderBy(desc(sql`winning_odds`))
    .limit(1);

  if (!result[0]) return null;

  const row = result[0];

  // Enrich with team details using aliased self-joins
  const homeTeam = alias(teams, 'homeTeam');
  const awayTeam = alias(teams, 'awayTeam');

  const teamDetails = await db
    .select({
      homeTeamName: homeTeam.name,
      homeTeamLogoUrl: homeTeam.logoUrl,
      awayTeamName: awayTeam.name,
      awayTeamLogoUrl: awayTeam.logoUrl,
    })
    .from(homeTeam)
    .innerJoin(awayTeam, eq(awayTeam.id, sql`${row.awayTeamId}`))
    .where(eq(homeTeam.id, row.homeTeamId))
    .limit(1);

  if (!teamDetails[0]) return null;

  return {
    fixtureId: row.fixtureId,
    homeTeamId: row.homeTeamId,
    homeTeamName: teamDetails[0].homeTeamName,
    homeTeamLogoUrl: teamDetails[0].homeTeamLogoUrl,
    awayTeamId: row.awayTeamId,
    awayTeamName: teamDetails[0].awayTeamName,
    awayTeamLogoUrl: teamDetails[0].awayTeamLogoUrl,
    homeScore: row.homeScore!,
    awayScore: row.awayScore!,
    matchweek: row.matchweek,
    winningOdds: row.winningOdds,
  };
}

/**
 * Get the team in best form for a league and season.
 * Uses the standings form string (e.g. "WWWWW") at the latest matchweek.
 * Scores form using W=3, D=1, L=0 (mirrors football points).
 */
export async function getFormTeam(
  leagueId: number,
  season: string
): Promise<FormTeamResult | null> {
  const db = getDb();

  // Get the latest matchweek with standings data
  const maxWeekResult = await db
    .select({ maxWeek: max(standings.matchweek) })
    .from(standings)
    .where(
      and(eq(standings.leagueId, leagueId), eq(standings.season, season))
    );

  const maxWeek = maxWeekResult[0]?.maxWeek;
  if (!maxWeek) return null;

  // Get all teams at the latest matchweek, scored by form quality
  const result = await db
    .select({
      teamId: standings.teamId,
      teamName: teams.name,
      teamLogoUrl: teams.logoUrl,
      form: standings.form,
      position: standings.position,
      points: standings.points,
    })
    .from(standings)
    .innerJoin(teams, eq(standings.teamId, teams.id))
    .where(
      and(
        eq(standings.leagueId, leagueId),
        eq(standings.season, season),
        eq(standings.matchweek, maxWeek),
        isNotNull(standings.form)
      )
    )
    .orderBy(
      desc(
        sql`(LENGTH(${standings.form}) - LENGTH(REPLACE(${standings.form}, 'W', ''))) * 3 +
            (LENGTH(${standings.form}) - LENGTH(REPLACE(${standings.form}, 'D', '')))`
      )
    )
    .limit(1);

  if (!result[0] || !result[0].form) return null;

  return {
    teamId: result[0].teamId,
    teamName: result[0].teamName,
    teamLogoUrl: result[0].teamLogoUrl,
    form: result[0].form,
    position: result[0].position,
    points: result[0].points,
  };
}
