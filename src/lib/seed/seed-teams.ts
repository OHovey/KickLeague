/**
 * Seed teams for a league-season.
 *
 * Fetches team data from API-Football and upserts into the teams table.
 * Returns a map of apiId -> dbId for use by downstream seeders (players, fixtures).
 */

import chalk from "chalk";
import { ENDPOINTS } from "../api-football/endpoints.js";
import { teamResponseSchema } from "../api-football/types.js";
import type { ApiFootballClient } from "../api-football/client.js";
import { teams } from "../../db/schema/teams.js";
import { buildConflictUpdateColumns, formatProgress } from "./utils.js";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";

/**
 * Generate a URL-safe slug from a team name.
 * "Manchester United" -> "manchester-united"
 */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Seed teams for a single league-season.
 *
 * @returns Map of `teamApiId -> teamDbId`
 */
export async function seedTeams(
  db: NeonHttpDatabase<Record<string, unknown>>,
  client: ApiFootballClient,
  leagueDbId: number,
  leagueApiId: number,
  season: number,
): Promise<Map<number, number>> {
  const teamApiIdToDbId = new Map<number, number>();

  const response = await client.get(
    ENDPOINTS.teams,
    { league: String(leagueApiId), season: String(season) },
    teamResponseSchema,
  );

  const teamItems = response.response;

  for (let i = 0; i < teamItems.length; i++) {
    const item = teamItems[i];
    const teamData = item.team;
    const venueData = item.venue;

    const [upserted] = await db
      .insert(teams)
      .values({
        apiId: teamData.id,
        leagueId: leagueDbId,
        slug: slugify(teamData.name),
        name: teamData.name,
        shortName: teamData.code ?? teamData.name.slice(0, 3).toUpperCase(),
        abbreviation: teamData.code ?? null,
        logoUrl: teamData.logo ?? null,
        stadiumName: venueData?.name ?? null,
        founded: teamData.founded ?? null,
        country: teamData.country ?? null,
      })
      .onConflictDoUpdate({
        target: teams.apiId,
        set: buildConflictUpdateColumns(teams, [
          "slug",
          "name",
          "shortName",
          "logoUrl",
          "stadiumName",
          "leagueId",
        ]),
      })
      .returning({ id: teams.id });

    teamApiIdToDbId.set(teamData.id, upserted.id);
  }

  console.log(
    chalk.green(
      formatProgress(
        teamItems.length,
        teamItems.length,
        `Seeded ${teamItems.length} teams for league ${leagueApiId} ${season}`,
      ),
    ),
  );

  return teamApiIdToDbId;
}
