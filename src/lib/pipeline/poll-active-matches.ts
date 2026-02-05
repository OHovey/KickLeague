/**
 * Core match polling orchestrator for the live data pipeline.
 *
 * Coordinates the full polling cycle:
 * 1. Check API budget
 * 2. Detect active match windows
 * 3. For each active league, fetch fresh fixture data from API-Football
 * 4. Detect status changes and upsert updated fixtures
 * 5. Log all API calls for budget tracking
 * 6. Collect completed fixtures for downstream processing
 *
 * Called by the QStash cron route handler every 30 minutes (budget tier).
 */

import { getDb } from '@/db/connection';
import { fixtures, teams } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { ApiFootballClient } from '@/lib/api-football/client';
import { ENDPOINTS } from '@/lib/api-football/endpoints';
import { fixtureBasicResponseSchema } from '@/lib/api-football/types';
import {
  mapStatus,
  extractMatchweek,
  isTerminalStatus,
} from '@/lib/api-football/status-map';
import { buildConflictUpdateColumns } from '@/lib/seed/utils';
import { getActiveLeagues } from './fixture-window';
import { canMakePipelineCall, logApiCall } from './api-budget';
import { withRetry } from './retry';

export interface PollResult {
  polled: boolean;
  reason?: string;
  leaguesChecked?: number;
  fixturesUpdated?: number;
  matchesCompleted?: number[];
  errors?: string[];
  timestamp: string;
}

/**
 * Poll API-Football for active match updates.
 *
 * Returns early if:
 * - API budget is exceeded (preserves daily quota)
 * - No leagues have active match windows (nothing to poll)
 */
export async function pollActiveMatches(): Promise<PollResult> {
  const timestamp = new Date().toISOString();

  // 1. Check API budget
  const budgetOk = await canMakePipelineCall();
  if (!budgetOk) {
    return {
      polled: false,
      reason: 'budget_exceeded',
      timestamp,
    };
  }

  // 2. Check for active match windows
  const activeLeagues = await getActiveLeagues();
  if (activeLeagues.length === 0) {
    return {
      polled: false,
      reason: 'no_active_matches',
      timestamp,
    };
  }

  // 3. Create API client for pipeline use (cache disabled for fresh data)
  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) {
    return {
      polled: false,
      reason: 'missing_api_key',
      timestamp,
    };
  }

  const client = new ApiFootballClient(apiKey, {
    useCache: false,
  });

  let totalFixturesUpdated = 0;
  const completedFixtureIds: number[] = [];
  const errors: string[] = [];

  // 4. Poll each active league
  for (const league of activeLeagues) {
    // Re-check budget before each league
    const canContinue = await canMakePipelineCall();
    if (!canContinue) {
      errors.push(
        `Budget exhausted mid-poll, skipped league ${league.leagueSlug}`,
      );
      break;
    }

    try {
      const leagueResult = await pollLeague(client, league);
      totalFixturesUpdated += leagueResult.fixturesUpdated;
      completedFixtureIds.push(...leagueResult.completedFixtureIds);
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : String(error);
      errors.push(`Failed to poll league ${league.leagueSlug}: ${msg}`);
    }
  }

  // 5. Log completed matches (Plan 06-02 will implement handleMatchCompletion)
  if (completedFixtureIds.length > 0) {
    console.log(
      `[poll-active-matches] ${completedFixtureIds.length} match(es) completed: ${completedFixtureIds.join(', ')}`,
    );
  }

  return {
    polled: true,
    leaguesChecked: activeLeagues.length,
    fixturesUpdated: totalFixturesUpdated,
    matchesCompleted: completedFixtureIds,
    errors: errors.length > 0 ? errors : undefined,
    timestamp,
  };
}

// ---------------------------------------------------------------------------
// Internal: Poll a single league
// ---------------------------------------------------------------------------

interface LeaguePollResult {
  fixturesUpdated: number;
  completedFixtureIds: number[];
}

async function pollLeague(
  client: ApiFootballClient,
  league: {
    leagueDbId: number;
    leagueApiId: number;
    leagueSlug: string;
    season: string;
  },
): Promise<LeaguePollResult> {
  const db = getDb();

  // Build team apiId -> dbId map for this league
  const teamRows = await db
    .select({ id: teams.id, apiId: teams.apiId })
    .from(teams)
    .where(eq(teams.leagueId, league.leagueDbId));

  const teamApiIdToDbId = new Map<number, number>();
  for (const row of teamRows) {
    teamApiIdToDbId.set(row.apiId, row.id);
  }

  // Fetch fixtures from API-Football with retry
  const startTime = Date.now();
  let apiResponse;
  let httpStatus: number | undefined;

  try {
    apiResponse = await withRetry(
      () =>
        client.get(
          ENDPOINTS.fixtures,
          {
            league: String(league.leagueApiId),
            season: league.season,
          },
          fixtureBasicResponseSchema,
        ),
      2, // Fewer retries for pipeline (don't burn budget on persistent failures)
      1000,
    );

    httpStatus = 200;
  } catch (error) {
    const responseTimeMs = Date.now() - startTime;
    const errorMsg =
      error instanceof Error ? error.message : String(error);

    await logApiCall({
      endpoint: ENDPOINTS.fixtures,
      leagueApiId: league.leagueApiId,
      season: league.season,
      params: JSON.stringify({
        league: league.leagueApiId,
        season: league.season,
      }),
      success: false,
      responseTimeMs,
      errorMessage: errorMsg.slice(0, 500),
    });

    throw error;
  }

  const responseTimeMs = Date.now() - startTime;

  // Log the successful API call
  await logApiCall({
    endpoint: ENDPOINTS.fixtures,
    leagueApiId: league.leagueApiId,
    season: league.season,
    params: JSON.stringify({
      league: league.leagueApiId,
      season: league.season,
    }),
    success: true,
    httpStatus,
    responseTimeMs,
  });

  // Process fixture updates
  let fixturesUpdated = 0;
  const completedFixtureIds: number[] = [];

  for (const item of apiResponse.response) {
    const fixtureApiId = item.fixture.id;
    const newStatus = mapStatus(item.fixture.status.short);
    const homeTeamDbId = teamApiIdToDbId.get(item.teams.home.id);
    const awayTeamDbId = teamApiIdToDbId.get(item.teams.away.id);

    if (!homeTeamDbId || !awayTeamDbId) continue;

    // Check current DB status for this fixture
    const existingFixture = await db
      .select({ id: fixtures.id, status: fixtures.status })
      .from(fixtures)
      .where(eq(fixtures.apiId, fixtureApiId))
      .then((rows) => rows[0]);

    if (!existingFixture) {
      // New fixture not in DB -- insert it
      await db
        .insert(fixtures)
        .values({
          apiId: fixtureApiId,
          leagueId: league.leagueDbId,
          season: league.season,
          matchweek: extractMatchweek(item.league.round),
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

      fixturesUpdated++;
      continue;
    }

    const oldStatus = existingFixture.status;

    // Only update if status or scores changed
    const scoresChanged =
      item.goals?.home !== undefined || item.goals?.away !== undefined;
    const statusChanged = oldStatus !== newStatus;

    if (!statusChanged && !scoresChanged) continue;

    // Upsert the fixture with updated data
    await db
      .insert(fixtures)
      .values({
        apiId: fixtureApiId,
        leagueId: league.leagueDbId,
        season: league.season,
        matchweek: extractMatchweek(item.league.round),
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

    fixturesUpdated++;

    // Detect match completion: status transitioned TO finished
    if (
      oldStatus !== 'finished' &&
      newStatus === 'finished'
    ) {
      completedFixtureIds.push(fixtureApiId);
    }
  }

  return { fixturesUpdated, completedFixtureIds };
}
