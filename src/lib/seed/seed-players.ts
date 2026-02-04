/**
 * Seed players via /players/squads endpoint.
 *
 * For each team, fetches the squad and upserts players.
 * Uses the team API ID -> DB ID map from seedTeams.
 */

import chalk from "chalk";
import { ENDPOINTS } from "../api-football/endpoints.js";
import { playerSquadResponseSchema } from "../api-football/types.js";
import type { ApiFootballClient } from "../api-football/client.js";
import { players } from "../../db/schema/players.js";
import { buildConflictUpdateColumns, formatProgress } from "./utils.js";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";

/**
 * Map API-Football position string to our short code.
 * API returns: "Goalkeeper", "Defender", "Midfielder", "Attacker"
 */
function mapPosition(
  apiPosition: string | null | undefined,
): string | null {
  if (!apiPosition) return null;
  const map: Record<string, string> = {
    Goalkeeper: "GK",
    Defender: "DEF",
    Midfielder: "MID",
    Attacker: "FWD",
  };
  return map[apiPosition] ?? apiPosition.slice(0, 3).toUpperCase();
}

/**
 * Split a full name into first and last name.
 * "Harry Kane" -> { first: "Harry", last: "Kane" }
 * "Neymar" -> { first: null, last: "Neymar" }
 */
function splitName(name: string): { first: string | null; last: string } {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return { first: null, last: parts[0] };
  }
  return {
    first: parts[0],
    last: parts.slice(1).join(" "),
  };
}

/**
 * Seed players for all teams in a league-season.
 *
 * @param teamApiIdToDbId - Map from team API ID to database ID (from seedTeams)
 * @returns Total number of players seeded
 */
export async function seedPlayers(
  db: NeonHttpDatabase<Record<string, unknown>>,
  client: ApiFootballClient,
  teamApiIdToDbId: Map<number, number>,
  leagueApiId: number,
  season: number,
): Promise<number> {
  const teamApiIds = Array.from(teamApiIdToDbId.keys());
  let totalPlayers = 0;

  for (let i = 0; i < teamApiIds.length; i++) {
    const teamApiId = teamApiIds[i];
    const teamDbId = teamApiIdToDbId.get(teamApiId)!;

    console.log(
      chalk.gray(
        formatProgress(
          i + 1,
          teamApiIds.length,
          `Seeding players for team ${teamApiId}...`,
        ),
      ),
    );

    const response = await client.get(
      ENDPOINTS.playerSquads,
      { team: String(teamApiId) },
      playerSquadResponseSchema,
    );

    const squadData = response.response[0];
    if (!squadData || !squadData.players) {
      console.warn(
        chalk.yellow(
          `  No squad data for team ${teamApiId}, skipping players`,
        ),
      );
      continue;
    }

    for (const player of squadData.players) {
      const { first, last } = splitName(player.name);

      await db
        .insert(players)
        .values({
          apiId: player.id,
          teamId: teamDbId,
          name: player.name,
          firstName: first,
          lastName: last,
          position: mapPosition(player.position),
          number: player.number ?? null,
          nationality: null, // Squad endpoint doesn't include nationality
          photoUrl: player.photo ?? null,
          age: player.age ?? null,
        })
        .onConflictDoUpdate({
          target: players.apiId,
          set: buildConflictUpdateColumns(players, [
            "teamId",
            "name",
            "firstName",
            "lastName",
            "position",
            "number",
            "photoUrl",
            "age",
          ]),
        });
    }

    totalPlayers += squadData.players.length;
  }

  console.log(
    chalk.green(
      `Seeded ${totalPlayers} players across ${teamApiIds.length} teams for league ${leagueApiId}`,
    ),
  );

  return totalPlayers;
}
