/**
 * Seed standings per matchweek from API-Football.
 *
 * The API returns the current standings snapshot. We store it with the
 * appropriate matchweek number derived from the most-played round.
 */

import chalk from "chalk";
import { ENDPOINTS } from "../api-football/endpoints.js";
import { standingsResponseSchema } from "../api-football/types.js";
import type { ApiFootballClient } from "../api-football/client.js";
import { standings } from "../../db/schema/standings.js";
import { buildConflictUpdateColumns } from "./utils.js";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";

/**
 * Seed standings for a league-season.
 *
 * @param teamApiIdToDbId - Map from team API ID to database ID
 * @returns Number of standing rows seeded
 */
export async function seedStandings(
  db: NeonHttpDatabase<Record<string, unknown>>,
  client: ApiFootballClient,
  leagueDbId: number,
  leagueApiId: number,
  season: number,
  teamApiIdToDbId: Map<number, number>,
): Promise<number> {
  const response = await client.get(
    ENDPOINTS.standings,
    { league: String(leagueApiId), season: String(season) },
    standingsResponseSchema,
  );

  const leagueData = response.response[0]?.league;
  if (!leagueData || !leagueData.standings || leagueData.standings.length === 0) {
    console.warn(
      chalk.yellow(
        `  No standings data returned for league ${leagueApiId} ${season}`,
      ),
    );
    return 0;
  }

  // API-Football returns standings as an array of arrays (groups).
  // For standard leagues, there's a single group at index 0.
  const standingsEntries = leagueData.standings[0];
  if (!standingsEntries || standingsEntries.length === 0) {
    console.warn(chalk.yellow(`  Empty standings array for league ${leagueApiId} ${season}`));
    return 0;
  }

  // Determine the current matchweek from the max "played" value
  const maxPlayed = Math.max(
    ...standingsEntries.map((e) => e.all?.played ?? 0),
  );
  const matchweek = maxPlayed > 0 ? maxPlayed : 1;

  let count = 0;

  for (const entry of standingsEntries) {
    const teamDbId = teamApiIdToDbId.get(entry.team.id);
    if (!teamDbId) {
      console.warn(
        chalk.yellow(
          `  Skipping standing for team ${entry.team.id} (${entry.team.name}): not in team map`,
        ),
      );
      continue;
    }

    // Calculate expected points to detect points deduction:
    // expected = won*3 + drawn*1
    const won = entry.all?.win ?? 0;
    const drawn = entry.all?.draw ?? 0;
    const expectedPoints = won * 3 + drawn;
    const actualPoints = entry.points ?? expectedPoints;
    const pointsDeduction =
      actualPoints < expectedPoints ? expectedPoints - actualPoints : 0;

    await db
      .insert(standings)
      .values({
        leagueId: leagueDbId,
        season: String(season),
        matchweek,
        teamId: teamDbId,
        position: entry.rank,
        played: entry.all?.played ?? 0,
        won,
        drawn,
        lost: entry.all?.lose ?? 0,
        goalsFor: entry.all?.goals?.for ?? 0,
        goalsAgainst: entry.all?.goals?.against ?? 0,
        goalDifference: entry.goalsDiff ?? 0,
        points: actualPoints,
        form: entry.form ?? null,
        homeWon: entry.home?.win ?? 0,
        homeDrawn: entry.home?.draw ?? 0,
        homeLost: entry.home?.lose ?? 0,
        homeGoalsFor: entry.home?.goals?.for ?? 0,
        homeGoalsAgainst: entry.home?.goals?.against ?? 0,
        awayWon: entry.away?.win ?? 0,
        awayDrawn: entry.away?.draw ?? 0,
        awayLost: entry.away?.lose ?? 0,
        awayGoalsFor: entry.away?.goals?.for ?? 0,
        awayGoalsAgainst: entry.away?.goals?.against ?? 0,
        pointsDeduction,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [
          standings.leagueId,
          standings.season,
          standings.matchweek,
          standings.teamId,
        ],
        set: buildConflictUpdateColumns(standings, [
          "position",
          "played",
          "won",
          "drawn",
          "lost",
          "goalsFor",
          "goalsAgainst",
          "goalDifference",
          "points",
          "form",
          "homeWon",
          "homeDrawn",
          "homeLost",
          "homeGoalsFor",
          "homeGoalsAgainst",
          "awayWon",
          "awayDrawn",
          "awayLost",
          "awayGoalsFor",
          "awayGoalsAgainst",
          "pointsDeduction",
          "updatedAt",
        ]),
      });

    count++;
  }

  console.log(
    chalk.green(
      `  Seeded standings for league ${leagueApiId} ${season} (matchweek ${matchweek}, ${count} teams)`,
    ),
  );

  return count;
}
