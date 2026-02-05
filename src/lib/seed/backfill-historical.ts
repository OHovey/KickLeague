#!/usr/bin/env node
/**
 * Backfill historical standings from fixture data.
 *
 * Usage: npx tsx src/lib/seed/backfill-historical.ts
 *
 * This computes standings for each matchweek based on fixture results,
 * enabling sparkline trends and position change tracking.
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import chalk from 'chalk';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import * as schema from '../../db/schema/index.js';
import { leagues } from '../../db/schema/leagues.js';
import { computeHistoricalStandings } from './compute-historical-standings.js';

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error(chalk.red('Missing DATABASE_URL in .env.local'));
    process.exit(1);
  }

  const db = drizzle(process.env.DATABASE_URL, { schema });

  console.log(chalk.bold.cyan('\n--- Backfill Historical Standings ---\n'));

  // Get all leagues
  const allLeagues = await db.select().from(leagues);

  if (allLeagues.length === 0) {
    console.log(chalk.yellow('No leagues found in database. Run the full seed first.'));
    process.exit(1);
  }

  let totalRows = 0;

  for (const league of allLeagues) {
    console.log(chalk.blue(`\nProcessing ${league.name} (${league.currentSeason})...`));

    const rows = await computeHistoricalStandings(
      db,
      league.id,
      league.currentSeason,
    );

    totalRows += rows;
  }

  console.log(chalk.bold.green(`\n✓ Backfilled ${totalRows} total historical standings rows\n`));
}

main().catch((error) => {
  console.error(chalk.red('Error:'), error);
  process.exit(1);
});
