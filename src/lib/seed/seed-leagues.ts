/**
 * Seed leagues, league_config, and league_zones tables.
 *
 * For each of the 5 Big European leagues:
 * - Upserts the league row
 * - Upserts league_config per season (team count, tiebreaker, coverage)
 * - Upserts league_zones per season (zone definitions from spec)
 */

import chalk from "chalk";
import { eq, and } from "drizzle-orm";
import type { ApiFootballClient } from "../api-football/client.js";
import {
  LEAGUE_IDS,
  ENDPOINTS,
  type LeagueSlug,
} from "../api-football/endpoints.js";
import { leagueResponseSchema } from "../api-football/types.js";
import {
  leagues,
  leagueConfig,
  leagueZones,
} from "../../db/schema/leagues.js";
import { buildConflictUpdateColumns, formatProgress } from "./utils.js";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";

// ---------------------------------------------------------------------------
// League metadata
// ---------------------------------------------------------------------------

interface LeagueSpec {
  slug: LeagueSlug;
  apiId: number;
  teamCount: number;
  tiebreakerOrder: string;
  zones: ZoneDef[];
}

interface ZoneDef {
  type:
    | "champions_league"
    | "champions_league_qualifying"
    | "europa_league"
    | "conference_league"
    | "relegation_playoff"
    | "relegation";
  start: number;
  end: number;
  color: string;
}

const LEAGUE_SPECS: LeagueSpec[] = [
  {
    slug: "premier-league",
    apiId: LEAGUE_IDS["premier-league"],
    teamCount: 20,
    tiebreakerOrder: "goal_difference,goals_for,head_to_head",
    zones: [
      { type: "champions_league", start: 1, end: 4, color: "#22c55e" },
      { type: "europa_league", start: 5, end: 5, color: "#3b82f6" },
      { type: "conference_league", start: 6, end: 6, color: "#93c5fd" },
      { type: "relegation", start: 18, end: 20, color: "#ef4444" },
    ],
  },
  {
    slug: "la-liga",
    apiId: LEAGUE_IDS["la-liga"],
    teamCount: 20,
    tiebreakerOrder: "head_to_head,goal_difference,goals_for",
    zones: [
      { type: "champions_league", start: 1, end: 4, color: "#22c55e" },
      { type: "europa_league", start: 5, end: 5, color: "#3b82f6" },
      { type: "conference_league", start: 6, end: 6, color: "#93c5fd" },
      { type: "relegation", start: 18, end: 20, color: "#ef4444" },
    ],
  },
  {
    slug: "bundesliga",
    apiId: LEAGUE_IDS["bundesliga"],
    teamCount: 18,
    tiebreakerOrder: "goal_difference,goals_for,head_to_head",
    zones: [
      { type: "champions_league", start: 1, end: 4, color: "#22c55e" },
      { type: "europa_league", start: 5, end: 5, color: "#3b82f6" },
      { type: "conference_league", start: 6, end: 6, color: "#93c5fd" },
      { type: "relegation_playoff", start: 16, end: 16, color: "#f59e0b" },
      { type: "relegation", start: 17, end: 18, color: "#ef4444" },
    ],
  },
  {
    slug: "serie-a",
    apiId: LEAGUE_IDS["serie-a"],
    teamCount: 20,
    tiebreakerOrder: "head_to_head,goal_difference,goals_for",
    zones: [
      { type: "champions_league", start: 1, end: 4, color: "#22c55e" },
      { type: "europa_league", start: 5, end: 5, color: "#3b82f6" },
      { type: "conference_league", start: 6, end: 6, color: "#93c5fd" },
      { type: "relegation", start: 18, end: 20, color: "#ef4444" },
    ],
  },
  {
    slug: "ligue-1",
    apiId: LEAGUE_IDS["ligue-1"],
    teamCount: 18,
    tiebreakerOrder: "goal_difference,goals_for,head_to_head",
    zones: [
      { type: "champions_league", start: 1, end: 3, color: "#22c55e" },
      {
        type: "champions_league_qualifying",
        start: 4,
        end: 4,
        color: "#86efac",
      },
      { type: "europa_league", start: 5, end: 5, color: "#3b82f6" },
      { type: "relegation_playoff", start: 16, end: 16, color: "#f59e0b" },
      { type: "relegation", start: 17, end: 18, color: "#ef4444" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Seed function
// ---------------------------------------------------------------------------

/**
 * Seed leagues, league_config, and league_zones for the given seasons.
 *
 * Returns a map of `apiId -> dbId` for use by downstream seeders.
 */
export async function seedLeagues(
  db: NeonHttpDatabase<Record<string, unknown>>,
  client: ApiFootballClient,
  seasons: number[],
): Promise<Map<number, number>> {
  const apiIdToDbId = new Map<number, number>();
  const slugs = Object.keys(LEAGUE_IDS) as LeagueSlug[];

  for (let i = 0; i < slugs.length; i++) {
    const slug = slugs[i];
    const apiId = LEAGUE_IDS[slug];
    const spec = LEAGUE_SPECS.find((s) => s.slug === slug)!;

    console.log(
      chalk.blue(
        formatProgress(i + 1, slugs.length, `Seeding league: ${slug}`),
      ),
    );

    // Fetch league info from API (or cache)
    const response = await client.get(
      ENDPOINTS.leagues,
      { id: String(apiId) },
      leagueResponseSchema,
    );

    const leagueData = response.response[0];
    if (!leagueData) {
      console.warn(chalk.yellow(`  No data returned for league ${slug}`));
      continue;
    }

    // Determine the current season from API response
    const currentSeason =
      leagueData.seasons?.find((s) => s.current)?.year ?? seasons[0];

    // Upsert league
    const [upsertedLeague] = await db
      .insert(leagues)
      .values({
        apiId,
        slug,
        name: leagueData.league.name,
        country: leagueData.country?.name ?? "Unknown",
        logoUrl: leagueData.league.logo ?? null,
        currentSeason: String(currentSeason),
      })
      .onConflictDoUpdate({
        target: leagues.apiId,
        set: buildConflictUpdateColumns(leagues, [
          "name",
          "country",
          "logoUrl",
          "currentSeason",
        ]),
      })
      .returning({ id: leagues.id });

    const leagueDbId = upsertedLeague.id;
    apiIdToDbId.set(apiId, leagueDbId);

    // For each season, upsert league_config and league_zones
    for (const season of seasons) {
      const seasonStr = String(season);

      // Find coverage data for this season from API response
      const seasonData = leagueData.seasons?.find((s) => s.year === season);
      const coverage = seasonData?.coverage;

      // Derive matchweeks from team count: (teamCount - 1) * 2
      const matchweeksTotal = (spec.teamCount - 1) * 2;

      // Upsert league_config
      await db
        .insert(leagueConfig)
        .values({
          leagueId: leagueDbId,
          season: seasonStr,
          teamCount: spec.teamCount,
          tiebreakerOrder: spec.tiebreakerOrder,
          matchweeksTotal,
          hasXg: coverage?.fixtures?.statistics_fixtures ?? false,
          hasDetailedStats: coverage?.fixtures?.statistics_fixtures ?? true,
          hasPlayerStats: coverage?.players ?? true,
        })
        .onConflictDoUpdate({
          target: [leagueConfig.leagueId, leagueConfig.season],
          set: buildConflictUpdateColumns(leagueConfig, [
            "teamCount",
            "tiebreakerOrder",
            "matchweeksTotal",
            "hasXg",
            "hasDetailedStats",
            "hasPlayerStats",
          ]),
        });

      // Upsert league_zones: delete existing and re-insert for this league+season
      // (simpler than upserting each zone individually since there's no unique constraint on individual zones)
      await db
        .delete(leagueZones)
        .where(
          and(
            eq(leagueZones.leagueId, leagueDbId),
            eq(leagueZones.season, seasonStr),
          ),
        );

      if (spec.zones.length > 0) {
        await db.insert(leagueZones).values(
          spec.zones.map((z) => ({
            leagueId: leagueDbId,
            season: seasonStr,
            zoneType: z.type,
            startPosition: z.start,
            endPosition: z.end,
            color: z.color,
          })),
        );
      }

      console.log(
        chalk.gray(`  Config + zones for ${slug} ${seasonStr} upserted`),
      );
    }
  }

  console.log(
    chalk.green(`Leagues seeded: ${apiIdToDbId.size} leagues processed`),
  );
  return apiIdToDbId;
}

/**
 * Get the league spec for a given slug. Exported for use in refresh mode.
 */
export function getLeagueSpec(slug: LeagueSlug): LeagueSpec | undefined {
  return LEAGUE_SPECS.find((s) => s.slug === slug);
}
