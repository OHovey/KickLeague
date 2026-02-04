#!/usr/bin/env node
/**
 * Seed CLI entrypoint.
 *
 * Usage:
 *   npm run seed -- --all                 Seed all 5 leagues (current + previous season)
 *   npm run seed -- --league premier-league   Seed a single league
 *   npm run seed -- --refresh             Lightweight incremental update
 *   npm run seed -- --season 2024         Specific season only
 *   npm run seed -- --no-cache            Bypass file cache
 *
 * The seed pipeline runs in dependency order per league per season:
 * leagues -> teams -> players -> fixtures (basic + detail batches) -> standings
 *
 * All writes are upsert-based (onConflictDoUpdate) so re-runs are safe.
 * The file cache makes second runs zero-API-call.
 */

import "dotenv/config";
import { program } from "commander";
import chalk from "chalk";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../../db/schema/index.js";
import { ApiFootballClient } from "../api-football/client.js";
import {
  LEAGUE_IDS,
  SEASONS,
  type LeagueSlug,
} from "../api-football/endpoints.js";
import { seedLeagues } from "./seed-leagues.js";
import { seedTeams } from "./seed-teams.js";
import { seedPlayers } from "./seed-players.js";
import { seedFixtures } from "./seed-fixtures.js";
import { seedStandings } from "./seed-standings.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SeedResult {
  league: string;
  season: number;
  teams: number;
  players: number;
  fixtures: number;
  events: number;
  stats: number;
  standings: number;
}

// ---------------------------------------------------------------------------
// CLI definition
// ---------------------------------------------------------------------------

program
  .name("seed")
  .description("Seed KickData database from API-Football")
  .option(
    "--league <slug>",
    "Seed specific league: premier-league, la-liga, bundesliga, serie-a, ligue-1",
  )
  .option("--all", "Seed all 5 leagues")
  .option("--refresh", "Only fetch data newer than last seed")
  .option("--season <year>", "Specific season year")
  .option("--no-cache", "Bypass file cache (consumes API quota)")
  .action(async (opts) => {
    const startTime = Date.now();

    // -------------------------------------------------------------------
    // Validate environment
    // -------------------------------------------------------------------
    if (!process.env.DATABASE_URL) {
      console.error(
        chalk.red(
          "Missing DATABASE_URL environment variable.\n" +
            "Set it in .env or export it before running seed.\n" +
            "Example: DATABASE_URL=postgres://user:pass@host/db",
        ),
      );
      process.exit(1);
    }

    if (!process.env.API_FOOTBALL_KEY) {
      console.error(
        chalk.red(
          "Missing API_FOOTBALL_KEY environment variable.\n" +
            "Set it in .env or export it before running seed.\n" +
            "Get your key at: https://www.api-football.com/",
        ),
      );
      process.exit(1);
    }

    // -------------------------------------------------------------------
    // Validate flags
    // -------------------------------------------------------------------
    if (!opts.all && !opts.league) {
      console.error(
        chalk.red("Specify --all or --league <slug>. Run with --help for usage."),
      );
      process.exit(1);
    }

    if (opts.league && !Object.keys(LEAGUE_IDS).includes(opts.league)) {
      console.error(
        chalk.red(
          `Unknown league: "${opts.league}". Valid: ${Object.keys(LEAGUE_IDS).join(", ")}`,
        ),
      );
      process.exit(1);
    }

    // -------------------------------------------------------------------
    // Initialize clients
    // -------------------------------------------------------------------
    const useCache = opts.cache !== false;
    const client = new ApiFootballClient(process.env.API_FOOTBALL_KEY, {
      useCache,
    });

    const db = drizzle(process.env.DATABASE_URL, { schema });

    // Determine leagues and seasons to seed
    const leagueSlugs: LeagueSlug[] = opts.all
      ? (Object.keys(LEAGUE_IDS) as LeagueSlug[])
      : [opts.league as LeagueSlug];

    const seasons: number[] = opts.season
      ? [parseInt(opts.season, 10)]
      : [...SEASONS];

    const isRefresh = !!opts.refresh;

    console.log(chalk.bold.cyan("\n--- KickData Seed ---"));
    console.log(
      chalk.cyan(
        `Leagues: ${leagueSlugs.join(", ")}\n` +
          `Seasons: ${seasons.join(", ")}\n` +
          `Mode: ${isRefresh ? "refresh (incremental)" : "full seed"}\n` +
          `Cache: ${useCache ? "enabled" : "disabled"}`,
      ),
    );
    console.log();

    // -------------------------------------------------------------------
    // Step 1: Seed leagues (runs once for all seasons)
    // -------------------------------------------------------------------
    console.log(chalk.bold("Step 1: Seeding leagues, config, and zones..."));
    let leagueApiIdToDbId: Map<number, number>;
    try {
      leagueApiIdToDbId = await seedLeagues(db, client, seasons);
    } catch (error) {
      console.error(chalk.red("Fatal: Failed to seed leagues"), error);
      process.exit(1);
    }
    console.log();

    // -------------------------------------------------------------------
    // Step 2-5: Per league, per season
    // -------------------------------------------------------------------
    const results: SeedResult[] = [];

    for (const slug of leagueSlugs) {
      const leagueApiId = LEAGUE_IDS[slug];
      const leagueDbId = leagueApiIdToDbId.get(leagueApiId);

      if (!leagueDbId) {
        console.error(
          chalk.red(
            `League ${slug} not found in database after seeding. Skipping.`,
          ),
        );
        continue;
      }

      for (const season of seasons) {
        console.log(
          chalk.bold.blue(`\n=== ${slug} ${season} ===`),
        );

        const result: SeedResult = {
          league: slug,
          season,
          teams: 0,
          players: 0,
          fixtures: 0,
          events: 0,
          stats: 0,
          standings: 0,
        };

        try {
          // Step 2: Teams
          if (!isRefresh) {
            console.log(chalk.bold("Step 2: Seeding teams..."));
            const teamMap = await seedTeams(
              db,
              client,
              leagueDbId,
              leagueApiId,
              season,
            );
            result.teams = teamMap.size;

            // Step 3: Players
            console.log(chalk.bold("Step 3: Seeding players..."));
            result.players = await seedPlayers(
              db,
              client,
              teamMap,
              leagueApiId,
              season,
            );

            // Step 4: Fixtures (basic + details)
            console.log(chalk.bold("Step 4: Seeding fixtures..."));
            const fixtureCounts = await seedFixtures(
              db,
              client,
              leagueDbId,
              leagueApiId,
              season,
              teamMap,
            );
            result.fixtures = fixtureCounts.fixtures;
            result.events = fixtureCounts.events;
            result.stats = fixtureCounts.stats;

            // Step 5: Standings
            console.log(chalk.bold("Step 5: Seeding standings..."));
            result.standings = await seedStandings(
              db,
              client,
              leagueDbId,
              leagueApiId,
              season,
              teamMap,
            );
          } else {
            // Refresh mode: re-fetch teams to get the map, then only fixtures + standings
            console.log(chalk.bold("Refresh: Re-seeding teams (for ID map)..."));
            const teamMap = await seedTeams(
              db,
              client,
              leagueDbId,
              leagueApiId,
              season,
            );
            result.teams = teamMap.size;

            console.log(chalk.bold("Refresh: Re-seeding fixtures..."));
            const fixtureCounts = await seedFixtures(
              db,
              client,
              leagueDbId,
              leagueApiId,
              season,
              teamMap,
            );
            result.fixtures = fixtureCounts.fixtures;
            result.events = fixtureCounts.events;
            result.stats = fixtureCounts.stats;

            console.log(chalk.bold("Refresh: Re-seeding standings..."));
            result.standings = await seedStandings(
              db,
              client,
              leagueDbId,
              leagueApiId,
              season,
              teamMap,
            );
          }

          results.push(result);

          // Per-league-season summary
          console.log(chalk.green(`\n  ${slug} ${season} complete:`));
          console.log(
            chalk.green(
              `    Teams: ${result.teams}, Players: ${result.players}, Fixtures: ${result.fixtures}`,
            ),
          );
          console.log(
            chalk.green(
              `    Events: ${result.events}, Stats: ${result.stats}, Standings: ${result.standings}`,
            ),
          );
          console.log(
            chalk.gray(`    Quota: ${client.getDailyQuotaStatus()}`),
          );
        } catch (error) {
          if (
            error instanceof Error &&
            error.message.includes("Daily quota exhausted")
          ) {
            console.error(
              chalk.red(
                "\nDaily API quota exhausted. Re-run tomorrow -- cached data will be reused automatically.",
              ),
            );
            printSummary(results, startTime);
            process.exit(1);
          }

          console.error(
            chalk.red(`\nError seeding ${slug} ${season}:`),
            error,
          );
          console.log(
            chalk.yellow("Continuing with next league-season..."),
          );
        }
      }
    }

    // -------------------------------------------------------------------
    // Final summary
    // -------------------------------------------------------------------
    printSummary(results, startTime);
  });

// ---------------------------------------------------------------------------
// Summary printer
// ---------------------------------------------------------------------------

function printSummary(results: SeedResult[], startTime: number): void {
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(chalk.bold.cyan("\n\n--- Seed Summary ---"));
  console.log(chalk.cyan(`Duration: ${elapsed}s\n`));

  if (results.length === 0) {
    console.log(chalk.yellow("No league-seasons completed."));
    return;
  }

  // Totals
  const totals = results.reduce(
    (acc, r) => ({
      teams: acc.teams + r.teams,
      players: acc.players + r.players,
      fixtures: acc.fixtures + r.fixtures,
      events: acc.events + r.events,
      stats: acc.stats + r.stats,
      standings: acc.standings + r.standings,
    }),
    { teams: 0, players: 0, fixtures: 0, events: 0, stats: 0, standings: 0 },
  );

  console.log(
    chalk.green(
      `Totals: ${totals.teams} teams, ${totals.players} players, ${totals.fixtures} fixtures`,
    ),
  );
  console.log(
    chalk.green(
      `        ${totals.events} events, ${totals.stats} stat rows, ${totals.standings} standings`,
    ),
  );

  // Per league-season breakdown
  console.log(chalk.gray("\nPer league-season:"));
  for (const r of results) {
    console.log(
      chalk.gray(
        `  ${r.league} ${r.season}: ${r.teams}T ${r.players}P ${r.fixtures}F ${r.events}E ${r.stats}S ${r.standings}St`,
      ),
    );
  }
  console.log();
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

program.parse();
