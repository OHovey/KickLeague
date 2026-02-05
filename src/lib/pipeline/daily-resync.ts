/**
 * Daily resync pipeline with drift detection.
 *
 * Runs once per day (04:00 UTC via Vercel cron) to:
 * 1. Refresh fixture data for all 5 leagues (current season only)
 * 2. Detect and auto-correct standings drift
 * 3. Update postponed/cancelled fixture statuses
 *
 * Processes leagues sequentially (not parallel) to be gentle on API rate limits.
 * Skips player/squad data during resync (per CONTEXT.md decision).
 */

import { getDb } from '@/db/connection';
import { fixtures, standings, leagues, teams } from '@/db/schema';
import { eq, and, asc, lte, sql } from 'drizzle-orm';
import { ApiFootballClient } from '@/lib/api-football/client';
import { ENDPOINTS } from '@/lib/api-football/endpoints';
import { fixtureBasicResponseSchema } from '@/lib/api-football/types';
import { mapStatus, extractMatchweek } from '@/lib/api-football/status-map';
import { buildConflictUpdateColumns } from '@/lib/seed/utils';
import { canMakePipelineCall, logApiCall } from './api-budget';
import { withRetry } from './retry';
import { revalidatePath } from 'next/cache';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ResyncResult {
  leaguesResynced: number;
  fixturesUpdated: number;
  standingsCorrected: number;
  apiCallsUsed: number;
  errors: string[];
}

interface TeamStats {
  teamId: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  homeWon: number;
  homeDrawn: number;
  homeLost: number;
  homeGoalsFor: number;
  homeGoalsAgainst: number;
  awayWon: number;
  awayDrawn: number;
  awayLost: number;
  awayGoalsFor: number;
  awayGoalsAgainst: number;
  form: string[];
}

interface FixtureResult {
  matchweek: number;
  homeTeamId: number;
  awayTeamId: number;
  homeScore: number;
  awayScore: number;
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

/**
 * Perform a full daily resync: refresh fixtures for all leagues and detect
 * standings drift.
 */
export async function dailyResync(): Promise<ResyncResult> {
  const result: ResyncResult = {
    leaguesResynced: 0,
    fixturesUpdated: 0,
    standingsCorrected: 0,
    apiCallsUsed: 0,
    errors: [],
  };

  // Budget check
  const budgetOk = await canMakePipelineCall();
  if (!budgetOk) {
    result.errors.push('Budget exhausted, skipping daily resync');
    return result;
  }

  // Get API key
  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) {
    result.errors.push('Missing API_FOOTBALL_KEY environment variable');
    return result;
  }

  const client = new ApiFootballClient(apiKey, { useCache: false });
  const db = getDb();

  // Get all leagues with their current season
  const allLeagues = await db
    .select({
      id: leagues.id,
      apiId: leagues.apiId,
      slug: leagues.slug,
      currentSeason: leagues.currentSeason,
    })
    .from(leagues);

  let dataChanged = false;

  // Process each league sequentially
  for (const league of allLeagues) {
    // Re-check budget before each league
    const canContinue = await canMakePipelineCall();
    if (!canContinue) {
      result.errors.push(
        `Budget exhausted mid-resync, skipped league ${league.slug}`,
      );
      break;
    }

    try {
      const leagueResult = await resyncLeague(
        client,
        db,
        league.id,
        league.apiId,
        league.slug,
        league.currentSeason,
      );

      result.fixturesUpdated += leagueResult.fixturesUpdated;
      result.standingsCorrected += leagueResult.standingsCorrected;
      result.apiCallsUsed += leagueResult.apiCallsUsed;
      result.leaguesResynced++;

      if (leagueResult.fixturesUpdated > 0 || leagueResult.standingsCorrected > 0) {
        dataChanged = true;
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      result.errors.push(`Failed to resync league ${league.slug}: ${msg}`);
    }
  }

  // Revalidate ISR pages if any data changed
  if (dataChanged) {
    try {
      revalidatePath('/');
      revalidatePath('/matches');
    } catch {
      // revalidatePath may throw outside of a request context
    }
  }

  console.log(
    JSON.stringify({
      event: 'daily_resync_complete',
      leaguesResynced: result.leaguesResynced,
      fixturesUpdated: result.fixturesUpdated,
      standingsCorrected: result.standingsCorrected,
      apiCallsUsed: result.apiCallsUsed,
      errors: result.errors.length,
    }),
  );

  return result;
}

// ---------------------------------------------------------------------------
// Per-league resync
// ---------------------------------------------------------------------------

interface LeagueResyncResult {
  fixturesUpdated: number;
  standingsCorrected: number;
  apiCallsUsed: number;
}

async function resyncLeague(
  client: ApiFootballClient,
  db: ReturnType<typeof getDb>,
  leagueDbId: number,
  leagueApiId: number,
  leagueSlug: string,
  season: string,
): Promise<LeagueResyncResult> {
  const result: LeagueResyncResult = {
    fixturesUpdated: 0,
    standingsCorrected: 0,
    apiCallsUsed: 0,
  };

  // Build team apiId -> dbId map
  const teamRows = await db
    .select({ id: teams.id, apiId: teams.apiId })
    .from(teams)
    .where(eq(teams.leagueId, leagueDbId));

  const teamApiIdToDbId = new Map<number, number>();
  for (const row of teamRows) {
    teamApiIdToDbId.set(row.apiId, row.id);
  }

  // Fetch all fixtures for the league-season
  const startTime = Date.now();
  let apiResponse;

  try {
    apiResponse = await withRetry(
      () =>
        client.get(
          ENDPOINTS.fixtures,
          {
            league: String(leagueApiId),
            season: season,
          },
          fixtureBasicResponseSchema,
        ),
      2,
      1000,
    );
  } catch (error) {
    const responseTimeMs = Date.now() - startTime;
    await logApiCall({
      endpoint: ENDPOINTS.fixtures,
      leagueApiId,
      season,
      params: JSON.stringify({ league: leagueApiId, season }),
      success: false,
      responseTimeMs,
      errorMessage:
        (error instanceof Error ? error.message : String(error)).slice(0, 500),
    });
    result.apiCallsUsed++;
    throw error;
  }

  const responseTimeMs = Date.now() - startTime;
  await logApiCall({
    endpoint: ENDPOINTS.fixtures,
    leagueApiId,
    season,
    params: JSON.stringify({ league: leagueApiId, season }),
    success: true,
    httpStatus: 200,
    responseTimeMs,
  });
  result.apiCallsUsed++;

  // Upsert fixtures
  for (const item of apiResponse.response) {
    const fixtureApiId = item.fixture.id;
    const newStatus = mapStatus(item.fixture.status.short);
    const homeTeamDbId = teamApiIdToDbId.get(item.teams.home.id);
    const awayTeamDbId = teamApiIdToDbId.get(item.teams.away.id);

    if (!homeTeamDbId || !awayTeamDbId) continue;

    const matchweek = extractMatchweek(item.league.round);

    // Check if this fixture exists and has changed
    const existing = await db
      .select({ id: fixtures.id, status: fixtures.status })
      .from(fixtures)
      .where(eq(fixtures.apiId, fixtureApiId))
      .then((rows) => rows[0]);

    const statusChanged = !existing || existing.status !== newStatus;

    await db
      .insert(fixtures)
      .values({
        apiId: fixtureApiId,
        leagueId: leagueDbId,
        season,
        matchweek,
        homeTeamId: homeTeamDbId,
        awayTeamId: awayTeamDbId,
        kickoff: new Date(item.fixture.date),
        status: newStatus,
        homeScore: item.goals?.home ?? null,
        awayScore: item.goals?.away ?? null,
        referee: item.fixture.referee ?? null,
        venue: item.fixture.venue?.name ?? null,
      })
      .onConflictDoUpdate({
        target: fixtures.apiId,
        set: buildConflictUpdateColumns(fixtures, [
          'matchweek',
          'kickoff',
          'status',
          'homeScore',
          'awayScore',
          'referee',
          'venue',
        ]),
      });

    if (statusChanged) {
      result.fixturesUpdated++;
    }
  }

  // Drift detection: find the latest fully completed matchweek and verify standings
  const driftCorrected = await detectAndCorrectDrift(
    db,
    leagueDbId,
    season,
  );
  result.standingsCorrected += driftCorrected;

  return result;
}

// ---------------------------------------------------------------------------
// Drift detection
// ---------------------------------------------------------------------------

/**
 * Find the latest matchweek where all fixtures are finished, recompute
 * standings, and compare against stored values. Auto-correct any drift.
 *
 * Returns the number of standings rows corrected.
 */
async function detectAndCorrectDrift(
  db: ReturnType<typeof getDb>,
  leagueDbId: number,
  season: string,
): Promise<number> {
  // Find the latest matchweek where ALL fixtures for that matchweek are finished.
  // We do this by finding matchweeks that have no non-finished fixtures.
  const matchweekCounts = await db
    .select({
      matchweek: fixtures.matchweek,
      total: sql<number>`count(*)::int`,
      finished: sql<number>`count(*) filter (where ${fixtures.status} = 'finished')::int`,
    })
    .from(fixtures)
    .where(
      and(
        eq(fixtures.leagueId, leagueDbId),
        eq(fixtures.season, season),
      ),
    )
    .groupBy(fixtures.matchweek)
    .orderBy(asc(fixtures.matchweek));

  // Find latest matchweek where total === finished (all complete)
  let latestCompleteMatchweek: number | null = null;
  for (const mw of matchweekCounts) {
    if (mw.matchweek !== null && mw.total === mw.finished && mw.total > 0) {
      latestCompleteMatchweek = mw.matchweek;
    }
  }

  if (latestCompleteMatchweek === null) return 0;

  // Recompute standings for this matchweek
  const computed = await computeStandingsForMatchweek(
    db,
    leagueDbId,
    season,
    latestCompleteMatchweek,
  );

  if (computed.length === 0) return 0;

  // Load stored standings for comparison
  const stored = await db
    .select({
      teamId: standings.teamId,
      position: standings.position,
      points: standings.points,
      goalDifference: standings.goalDifference,
      goalsFor: standings.goalsFor,
    })
    .from(standings)
    .where(
      and(
        eq(standings.leagueId, leagueDbId),
        eq(standings.season, season),
        eq(standings.matchweek, latestCompleteMatchweek),
      ),
    );

  // Build lookup of stored positions
  const storedMap = new Map<
    number,
    { position: number; points: number; goalDifference: number; goalsFor: number }
  >();
  for (const row of stored) {
    storedMap.set(row.teamId, {
      position: row.position,
      points: row.points,
      goalDifference: row.goalDifference,
      goalsFor: row.goalsFor,
    });
  }

  // Check for drift
  let driftDetected = false;
  for (const team of computed) {
    const storedTeam = storedMap.get(team.teamId);
    if (!storedTeam) {
      driftDetected = true;
      break;
    }
    if (
      storedTeam.position !== team.position ||
      storedTeam.points !== team.points ||
      storedTeam.goalDifference !== team.goalDifference ||
      storedTeam.goalsFor !== team.goalsFor
    ) {
      driftDetected = true;
      break;
    }
  }

  // Also detect if stored has rows for teams not in computed
  if (stored.length !== computed.length) {
    driftDetected = true;
  }

  if (!driftDetected) return 0;

  // Drift detected -- overwrite with freshly computed data
  console.log(
    JSON.stringify({
      event: 'standings_drift_detected',
      leagueId: leagueDbId,
      season,
      matchweek: latestCompleteMatchweek,
    }),
  );

  const now = new Date();
  let corrected = 0;

  for (const team of computed) {
    await db
      .insert(standings)
      .values({
        leagueId: leagueDbId,
        season,
        matchweek: latestCompleteMatchweek,
        teamId: team.teamId,
        position: team.position,
        played: team.played,
        won: team.won,
        drawn: team.drawn,
        lost: team.lost,
        goalsFor: team.goalsFor,
        goalsAgainst: team.goalsAgainst,
        goalDifference: team.goalDifference,
        points: team.points,
        form: team.form,
        homeWon: team.homeWon,
        homeDrawn: team.homeDrawn,
        homeLost: team.homeLost,
        homeGoalsFor: team.homeGoalsFor,
        homeGoalsAgainst: team.homeGoalsAgainst,
        awayWon: team.awayWon,
        awayDrawn: team.awayDrawn,
        awayLost: team.awayLost,
        awayGoalsFor: team.awayGoalsFor,
        awayGoalsAgainst: team.awayGoalsAgainst,
        pointsDeduction: 0,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [
          standings.leagueId,
          standings.season,
          standings.matchweek,
          standings.teamId,
        ],
        set: buildConflictUpdateColumns(standings, [
          'position',
          'played',
          'won',
          'drawn',
          'lost',
          'goalsFor',
          'goalsAgainst',
          'goalDifference',
          'points',
          'form',
          'homeWon',
          'homeDrawn',
          'homeLost',
          'homeGoalsFor',
          'homeGoalsAgainst',
          'awayWon',
          'awayDrawn',
          'awayLost',
          'awayGoalsFor',
          'awayGoalsAgainst',
          'updatedAt',
        ]),
      });

    corrected++;
  }

  return corrected;
}

// ---------------------------------------------------------------------------
// Standings computation (shared between drift detection and correction)
// ---------------------------------------------------------------------------

interface ComputedStanding {
  teamId: number;
  position: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: string;
  homeWon: number;
  homeDrawn: number;
  homeLost: number;
  homeGoalsFor: number;
  homeGoalsAgainst: number;
  awayWon: number;
  awayDrawn: number;
  awayLost: number;
  awayGoalsFor: number;
  awayGoalsAgainst: number;
}

async function computeStandingsForMatchweek(
  db: ReturnType<typeof getDb>,
  leagueDbId: number,
  season: string,
  targetMatchweek: number,
): Promise<ComputedStanding[]> {
  const fixtureResults = await db
    .select({
      matchweek: fixtures.matchweek,
      homeTeamId: fixtures.homeTeamId,
      awayTeamId: fixtures.awayTeamId,
      homeScore: fixtures.homeScore,
      awayScore: fixtures.awayScore,
    })
    .from(fixtures)
    .where(
      and(
        eq(fixtures.leagueId, leagueDbId),
        eq(fixtures.season, season),
        eq(fixtures.status, 'finished'),
        lte(fixtures.matchweek, targetMatchweek),
      ),
    )
    .orderBy(asc(fixtures.matchweek));

  const validFixtures: FixtureResult[] = fixtureResults.filter(
    (f): f is FixtureResult =>
      f.matchweek !== null && f.homeScore !== null && f.awayScore !== null,
  );

  if (validFixtures.length === 0) return [];

  // Collect teams
  const teamIds = new Set<number>();
  for (const f of validFixtures) {
    teamIds.add(f.homeTeamId);
    teamIds.add(f.awayTeamId);
  }

  // Initialize stats
  const teamStats = new Map<number, TeamStats>();
  for (const teamId of teamIds) {
    teamStats.set(teamId, {
      teamId,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
      homeWon: 0,
      homeDrawn: 0,
      homeLost: 0,
      homeGoalsFor: 0,
      homeGoalsAgainst: 0,
      awayWon: 0,
      awayDrawn: 0,
      awayLost: 0,
      awayGoalsFor: 0,
      awayGoalsAgainst: 0,
      form: [],
    });
  }

  // Accumulate
  for (const fixture of validFixtures) {
    const homeStats = teamStats.get(fixture.homeTeamId)!;
    const awayStats = teamStats.get(fixture.awayTeamId)!;

    homeStats.played++;
    awayStats.played++;

    homeStats.goalsFor += fixture.homeScore;
    homeStats.goalsAgainst += fixture.awayScore;
    homeStats.goalDifference = homeStats.goalsFor - homeStats.goalsAgainst;
    homeStats.homeGoalsFor += fixture.homeScore;
    homeStats.homeGoalsAgainst += fixture.awayScore;

    awayStats.goalsFor += fixture.awayScore;
    awayStats.goalsAgainst += fixture.homeScore;
    awayStats.goalDifference = awayStats.goalsFor - awayStats.goalsAgainst;
    awayStats.awayGoalsFor += fixture.awayScore;
    awayStats.awayGoalsAgainst += fixture.homeScore;

    if (fixture.homeScore > fixture.awayScore) {
      homeStats.won++;
      homeStats.homeWon++;
      homeStats.points += 3;
      awayStats.lost++;
      awayStats.awayLost++;
      homeStats.form.push('W');
      awayStats.form.push('L');
    } else if (fixture.homeScore < fixture.awayScore) {
      awayStats.won++;
      awayStats.awayWon++;
      awayStats.points += 3;
      homeStats.lost++;
      homeStats.homeLost++;
      homeStats.form.push('L');
      awayStats.form.push('W');
    } else {
      homeStats.drawn++;
      homeStats.homeDrawn++;
      homeStats.points += 1;
      awayStats.drawn++;
      awayStats.awayDrawn++;
      awayStats.points += 1;
      homeStats.form.push('D');
      awayStats.form.push('D');
    }

    if (homeStats.form.length > 5) homeStats.form.shift();
    if (awayStats.form.length > 5) awayStats.form.shift();
  }

  // Rank
  const ranked = [...teamStats.values()]
    .filter((t) => t.played > 0)
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference)
        return b.goalDifference - a.goalDifference;
      return b.goalsFor - a.goalsFor;
    });

  return ranked.map((team, i) => ({
    teamId: team.teamId,
    position: i + 1,
    played: team.played,
    won: team.won,
    drawn: team.drawn,
    lost: team.lost,
    goalsFor: team.goalsFor,
    goalsAgainst: team.goalsAgainst,
    goalDifference: team.goalDifference,
    points: team.points,
    form: team.form.join(''),
    homeWon: team.homeWon,
    homeDrawn: team.homeDrawn,
    homeLost: team.homeLost,
    homeGoalsFor: team.homeGoalsFor,
    homeGoalsAgainst: team.homeGoalsAgainst,
    awayWon: team.awayWon,
    awayDrawn: team.awayDrawn,
    awayLost: team.awayLost,
    awayGoalsFor: team.awayGoalsFor,
    awayGoalsAgainst: team.awayGoalsAgainst,
  }));
}
