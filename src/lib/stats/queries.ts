// Stat highlight database queries for homepage cards

import { eq, and, sql, desc, count, max, isNotNull } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { getDb } from '@/db/connection';
import {
  fixtureEvents,
  fixtures,
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
  teamSlug: string;
  teamLogoUrl: string | null;
  goalCount: number;
}

export interface BiggestUpsetResult {
  fixtureId: number;
  homeTeamId: number;
  homeTeamName: string;
  homeTeamSlug: string;
  homeTeamLogoUrl: string | null;
  awayTeamId: number;
  awayTeamName: string;
  awayTeamSlug: string;
  awayTeamLogoUrl: string | null;
  homeScore: number;
  awayScore: number;
  matchweek: number | null;
  positionGap: number;
}

export interface FormTeamResult {
  teamId: number;
  teamName: string;
  teamSlug: string;
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
      teamSlug: teams.slug,
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
      teams.slug,
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
    teamSlug: result[0].teamSlug,
    teamLogoUrl: result[0].teamLogoUrl,
    goalCount: result[0].goalCount,
  };
}

/**
 * Get the biggest upset for a league and season.
 * Uses standings-position-based approach: the winning team had a worse
 * (higher number) league position than the loser, and we find the largest gap.
 * Only considers decisive results (no draws).
 */
export async function getBiggestUpset(
  leagueId: number,
  season: string
): Promise<BiggestUpsetResult | null> {
  const db = getDb();

  const homeStandings = alias(standings, 'home_standings');
  const awayStandings = alias(standings, 'away_standings');
  const homeTeam = alias(teams, 'homeTeam');
  const awayTeam = alias(teams, 'awayTeam');

  // Find the fixture with the largest position gap where the lower-ranked team won
  const result = await db
    .select({
      fixtureId: fixtures.id,
      homeTeamId: fixtures.homeTeamId,
      awayTeamId: fixtures.awayTeamId,
      homeScore: fixtures.homeScore,
      awayScore: fixtures.awayScore,
      matchweek: fixtures.matchweek,
      homeTeamName: homeTeam.name,
      homeTeamSlug: homeTeam.slug,
      homeTeamLogoUrl: homeTeam.logoUrl,
      awayTeamName: awayTeam.name,
      awayTeamSlug: awayTeam.slug,
      awayTeamLogoUrl: awayTeam.logoUrl,
      positionGap: sql<number>`CASE
        WHEN ${fixtures.homeScore} > ${fixtures.awayScore}
          THEN ${homeStandings.position} - ${awayStandings.position}
        ELSE ${awayStandings.position} - ${homeStandings.position}
      END`.as('position_gap'),
    })
    .from(fixtures)
    .innerJoin(
      homeStandings,
      and(
        eq(homeStandings.teamId, fixtures.homeTeamId),
        eq(homeStandings.leagueId, fixtures.leagueId),
        eq(homeStandings.season, fixtures.season),
        eq(homeStandings.matchweek, fixtures.matchweek)
      )
    )
    .innerJoin(
      awayStandings,
      and(
        eq(awayStandings.teamId, fixtures.awayTeamId),
        eq(awayStandings.leagueId, fixtures.leagueId),
        eq(awayStandings.season, fixtures.season),
        eq(awayStandings.matchweek, fixtures.matchweek)
      )
    )
    .innerJoin(homeTeam, eq(homeTeam.id, fixtures.homeTeamId))
    .innerJoin(awayTeam, eq(awayTeam.id, fixtures.awayTeamId))
    .where(
      and(
        eq(fixtures.leagueId, leagueId),
        eq(fixtures.season, season),
        eq(fixtures.status, 'finished'),
        sql`${fixtures.homeScore} != ${fixtures.awayScore}`,
        isNotNull(fixtures.matchweek),
        // Only include upsets: winner had a worse (higher) position than loser
        sql`CASE
          WHEN ${fixtures.homeScore} > ${fixtures.awayScore}
            THEN ${homeStandings.position} - ${awayStandings.position}
          ELSE ${awayStandings.position} - ${homeStandings.position}
        END > 0`
      )
    )
    .orderBy(desc(sql`position_gap`))
    .limit(1);

  if (!result[0]) return null;

  const row = result[0];

  return {
    fixtureId: row.fixtureId,
    homeTeamId: row.homeTeamId,
    homeTeamName: row.homeTeamName,
    homeTeamSlug: row.homeTeamSlug,
    homeTeamLogoUrl: row.homeTeamLogoUrl,
    awayTeamId: row.awayTeamId,
    awayTeamName: row.awayTeamName,
    awayTeamSlug: row.awayTeamSlug,
    awayTeamLogoUrl: row.awayTeamLogoUrl,
    homeScore: row.homeScore!,
    awayScore: row.awayScore!,
    matchweek: row.matchweek,
    positionGap: row.positionGap,
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
      teamSlug: teams.slug,
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
    teamSlug: result[0].teamSlug,
    teamLogoUrl: result[0].teamLogoUrl,
    form: result[0].form,
    position: result[0].position,
    points: result[0].points,
  };
}
