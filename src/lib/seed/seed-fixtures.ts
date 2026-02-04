/**
 * Seed fixtures with batch detail fetching, plus fixture_events and fixture_stats.
 *
 * Two-phase approach:
 * Phase A: Fetch all fixtures for a league-season (1 API call), upsert basic data
 * Phase B: For finished fixtures, batch-fetch details (20 IDs per call), upsert events + stats
 */

import chalk from "chalk";
import { eq } from "drizzle-orm";
import { ENDPOINTS } from "../api-football/endpoints.js";
import {
  fixtureBasicResponseSchema,
  fixtureDetailedResponseSchema,
  type FixtureDetailedResponseItem,
  type FixtureEvent,
} from "../api-football/types.js";
import type { ApiFootballClient } from "../api-football/client.js";
import {
  fixtures,
  fixtureEvents,
  fixtureStats,
} from "../../db/schema/fixtures.js";
import { players } from "../../db/schema/players.js";
import {
  buildConflictUpdateColumns,
  chunk,
  formatProgress,
} from "./utils.js";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";

// ---------------------------------------------------------------------------
// Status mapping
// ---------------------------------------------------------------------------

/**
 * Map API-Football status short codes to our match_status enum.
 */
function mapStatus(
  short: string | null | undefined,
): "scheduled" | "live" | "finished" | "postponed" | "cancelled" | "first_half" | "halftime" | "second_half" | "extra_time" | "penalties" {
  if (!short) return "scheduled";
  const map: Record<string, string> = {
    TBD: "scheduled",
    NS: "scheduled",
    "1H": "first_half",
    HT: "halftime",
    "2H": "second_half",
    ET: "extra_time",
    P: "penalties",
    FT: "finished",
    AET: "finished",
    PEN: "finished",
    BT: "finished",
    SUSP: "postponed",
    INT: "postponed",
    PST: "postponed",
    CANC: "cancelled",
    ABD: "cancelled",
    AWD: "finished",
    WO: "finished",
    LIVE: "live",
  };
  return (map[short] as ReturnType<typeof mapStatus>) ?? "scheduled";
}

/**
 * Extract the matchweek number from the API-Football round string.
 * "Regular Season - 23" -> 23
 * "Regular Season - 1" -> 1
 */
function extractMatchweek(round: string | null | undefined): number | null {
  if (!round) return null;
  const match = round.match(/(\d+)\s*$/);
  return match ? parseInt(match[1], 10) : null;
}

// ---------------------------------------------------------------------------
// Event type mapping
// ---------------------------------------------------------------------------

/**
 * Map API-Football event type + detail to our event_type enum.
 */
function mapEventType(
  type: string | null | undefined,
  detail: string | null | undefined,
): "goal" | "own_goal" | "penalty_scored" | "penalty_missed" | "yellow_card" | "red_card" | "substitution" | "var" | null {
  if (!type) return null;

  const typeLower = type.toLowerCase();
  const detailLower = (detail ?? "").toLowerCase();

  if (typeLower === "goal") {
    if (detailLower.includes("own goal")) return "own_goal";
    if (detailLower.includes("penalty")) return "penalty_scored";
    return "goal";
  }
  if (typeLower === "card") {
    if (detailLower.includes("red")) return "red_card";
    return "yellow_card";
  }
  if (typeLower === "subst") return "substitution";
  if (typeLower === "var") return "var";

  // Missed penalty (from events, not goals)
  if (
    typeLower === "penalty" ||
    (typeLower === "goal" && detailLower.includes("missed"))
  ) {
    return "penalty_missed";
  }

  return null; // Unknown event type, skip
}

// ---------------------------------------------------------------------------
// Stat mapping
// ---------------------------------------------------------------------------

/**
 * Map API-Football statistics array to our typed stat columns.
 * API returns: [{ type: "Ball Possession", value: "67%" }, ...]
 */
function mapStatistics(
  stats: Array<{ type?: string | null; value?: string | number | null }>,
): {
  possession: number | null;
  shots: number | null;
  shotsOnTarget: number | null;
  corners: number | null;
  fouls: number | null;
  offsides: number | null;
  yellowCards: number | null;
  redCards: number | null;
  xg: number | null;
} {
  const result = {
    possession: null as number | null,
    shots: null as number | null,
    shotsOnTarget: null as number | null,
    corners: null as number | null,
    fouls: null as number | null,
    offsides: null as number | null,
    yellowCards: null as number | null,
    redCards: null as number | null,
    xg: null as number | null,
  };

  for (const stat of stats) {
    if (!stat.type || stat.value === null || stat.value === undefined) continue;

    const val = stat.value;
    const typeLower = stat.type.toLowerCase();

    if (typeLower === "ball possession") {
      // "67%" -> 67.0
      const str = String(val).replace("%", "");
      const parsed = parseFloat(str);
      if (!isNaN(parsed)) result.possession = parsed;
    } else if (typeLower === "total shots") {
      result.shots = toInt(val);
    } else if (typeLower === "shots on goal") {
      result.shotsOnTarget = toInt(val);
    } else if (typeLower === "corner kicks") {
      result.corners = toInt(val);
    } else if (typeLower === "fouls") {
      result.fouls = toInt(val);
    } else if (typeLower === "offsides") {
      result.offsides = toInt(val);
    } else if (typeLower === "yellow cards") {
      result.yellowCards = toInt(val);
    } else if (typeLower === "red cards") {
      result.redCards = toInt(val);
    } else if (typeLower === "expected_goals") {
      const parsed = parseFloat(String(val));
      if (!isNaN(parsed)) result.xg = parsed;
    }
  }

  return result;
}

function toInt(val: string | number): number | null {
  if (typeof val === "number") return Math.round(val);
  const parsed = parseInt(val, 10);
  return isNaN(parsed) ? null : parsed;
}

// ---------------------------------------------------------------------------
// Phase A: Basic fixtures
// ---------------------------------------------------------------------------

/**
 * Seed all fixtures for a league-season. Two-phase: basic data then batched details.
 *
 * @returns Object with counts of fixtures, events, and stats seeded
 */
export async function seedFixtures(
  db: NeonHttpDatabase<Record<string, unknown>>,
  client: ApiFootballClient,
  leagueDbId: number,
  leagueApiId: number,
  season: number,
  teamApiIdToDbId: Map<number, number>,
): Promise<{ fixtures: number; events: number; stats: number }> {
  const counts = { fixtures: 0, events: 0, stats: 0 };

  // -----------------------------------------------------------------------
  // Phase A: Fetch all fixtures (1 API call)
  // -----------------------------------------------------------------------
  console.log(chalk.blue(`  Phase A: Fetching all fixtures...`));

  const basicResponse = await client.get(
    ENDPOINTS.fixtures,
    { league: String(leagueApiId), season: String(season) },
    fixtureBasicResponseSchema,
  );

  const fixtureItems = basicResponse.response;
  const fixtureApiIdToDbId = new Map<number, number>();
  const finishedFixtureApiIds: number[] = [];

  for (const item of fixtureItems) {
    const fixtureApiId = item.fixture.id;
    const status = mapStatus(item.fixture.status.short);
    const homeTeamDbId = teamApiIdToDbId.get(item.teams.home.id);
    const awayTeamDbId = teamApiIdToDbId.get(item.teams.away.id);

    if (!homeTeamDbId || !awayTeamDbId) {
      console.warn(
        chalk.yellow(
          `  Skipping fixture ${fixtureApiId}: missing team mapping (home=${item.teams.home.id}, away=${item.teams.away.id})`,
        ),
      );
      continue;
    }

    const [upserted] = await db
      .insert(fixtures)
      .values({
        apiId: fixtureApiId,
        leagueId: leagueDbId,
        season: String(season),
        matchweek: extractMatchweek(item.league.round),
        homeTeamId: homeTeamDbId,
        awayTeamId: awayTeamDbId,
        kickoff: new Date(item.fixture.date),
        status,
        homeScore: item.goals?.home ?? null,
        awayScore: item.goals?.away ?? null,
        referee: item.fixture.referee ?? null,
        venue: item.fixture.venue?.name ?? null,
      })
      .onConflictDoUpdate({
        target: fixtures.apiId,
        set: buildConflictUpdateColumns(fixtures, [
          "matchweek",
          "kickoff",
          "status",
          "homeScore",
          "awayScore",
          "referee",
          "venue",
        ]),
      })
      .returning({ id: fixtures.id });

    fixtureApiIdToDbId.set(fixtureApiId, upserted.id);
    counts.fixtures++;

    if (status === "finished") {
      finishedFixtureApiIds.push(fixtureApiId);
    }
  }

  console.log(
    chalk.green(
      `  Phase A complete: ${counts.fixtures} fixtures, ${finishedFixtureApiIds.length} finished`,
    ),
  );

  // -----------------------------------------------------------------------
  // Phase B: Batch-fetch details for finished fixtures
  // -----------------------------------------------------------------------
  if (finishedFixtureApiIds.length === 0) {
    console.log(chalk.gray(`  Phase B: No finished fixtures, skipping details`));
    return counts;
  }

  // Build a player API ID -> DB ID lookup for events
  const playerRows = await db
    .select({ id: players.id, apiId: players.apiId })
    .from(players);
  const playerApiIdToDbId = new Map<number, number>();
  for (const row of playerRows) {
    playerApiIdToDbId.set(row.apiId, row.id);
  }

  const batches = chunk(finishedFixtureApiIds, 20);
  console.log(
    chalk.blue(
      `  Phase B: Fetching details in ${batches.length} batch(es)...`,
    ),
  );

  for (let b = 0; b < batches.length; b++) {
    const batch = batches[b];
    console.log(
      chalk.gray(
        formatProgress(
          b + 1,
          batches.length,
          `Fetching detailed fixtures batch...`,
        ),
      ),
    );

    const detailResponse = await client.get(
      ENDPOINTS.fixtures,
      { ids: batch.join("-") },
      fixtureDetailedResponseSchema,
    );

    for (const detail of detailResponse.response) {
      const fixtureDbId = fixtureApiIdToDbId.get(detail.fixture.id);
      if (!fixtureDbId) continue;

      // Seed events
      if (detail.events && detail.events.length > 0) {
        counts.events += await seedFixtureEvents(
          db,
          fixtureDbId,
          detail.events,
          teamApiIdToDbId,
          playerApiIdToDbId,
        );
      }

      // Seed stats
      if (detail.statistics && detail.statistics.length > 0) {
        counts.stats += await seedFixtureStatistics(
          db,
          fixtureDbId,
          detail.statistics,
          teamApiIdToDbId,
        );
      }
    }
  }

  console.log(
    chalk.green(
      `  Phase B complete: ${counts.events} events, ${counts.stats} stat rows`,
    ),
  );

  return counts;
}

// ---------------------------------------------------------------------------
// Event seeding
// ---------------------------------------------------------------------------

async function seedFixtureEvents(
  db: NeonHttpDatabase<Record<string, unknown>>,
  fixtureDbId: number,
  events: FixtureEvent[],
  teamApiIdToDbId: Map<number, number>,
  playerApiIdToDbId: Map<number, number>,
): Promise<number> {
  // Delete existing events for this fixture to handle re-runs cleanly
  await db
    .delete(fixtureEvents)
    .where(eq(fixtureEvents.fixtureId, fixtureDbId));

  let count = 0;

  for (const event of events) {
    const eventType = mapEventType(event.type, event.detail);
    if (!eventType) continue; // Skip unknown event types

    const teamDbId = event.team?.id
      ? teamApiIdToDbId.get(event.team.id)
      : undefined;
    if (!teamDbId) continue; // Need a team for the event

    const playerDbId = event.player?.id
      ? playerApiIdToDbId.get(event.player.id) ?? null
      : null;
    const assistPlayerDbId = event.assist?.id
      ? playerApiIdToDbId.get(event.assist.id) ?? null
      : null;

    await db.insert(fixtureEvents).values({
      fixtureId: fixtureDbId,
      type: eventType,
      minute: event.time?.elapsed ?? 0,
      extraMinute: event.time?.extra ?? null,
      teamId: teamDbId,
      playerId: playerDbId,
      assistPlayerId: assistPlayerDbId,
      detail: event.detail ?? null,
    });

    count++;
  }

  return count;
}

// ---------------------------------------------------------------------------
// Stat seeding
// ---------------------------------------------------------------------------

async function seedFixtureStatistics(
  db: NeonHttpDatabase<Record<string, unknown>>,
  fixtureDbId: number,
  statistics: NonNullable<FixtureDetailedResponseItem["statistics"]>,
  teamApiIdToDbId: Map<number, number>,
): Promise<number> {
  let count = 0;

  for (const teamStat of statistics) {
    const teamApiId = teamStat.team?.id;
    if (!teamApiId) continue;

    const teamDbId = teamApiIdToDbId.get(teamApiId);
    if (!teamDbId) continue;

    if (!teamStat.statistics || teamStat.statistics.length === 0) continue;

    const mapped = mapStatistics(teamStat.statistics);

    await db
      .insert(fixtureStats)
      .values({
        fixtureId: fixtureDbId,
        teamId: teamDbId,
        ...mapped,
      })
      .onConflictDoUpdate({
        target: [fixtureStats.fixtureId, fixtureStats.teamId],
        set: buildConflictUpdateColumns(fixtureStats, [
          "possession",
          "shots",
          "shotsOnTarget",
          "corners",
          "fouls",
          "offsides",
          "yellowCards",
          "redCards",
          "xg",
        ]),
      });

    count++;
  }

  return count;
}
