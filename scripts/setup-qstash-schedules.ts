/**
 * One-time setup script for QStash scheduled polling.
 *
 * Creates QStash schedules that trigger the cron routes:
 *   - poll-matches: every 3 minutes (Pro tier)
 *   - refresh-odds: every 6 hours
 *
 * Run this once after initial deployment.
 *
 * Usage:
 *   QSTASH_TOKEN=... DEPLOY_URL=https://your-app.vercel.app npm run setup-qstash
 *
 * Environment variables:
 *   QSTASH_TOKEN   - Required. From Upstash Console > QStash > Settings.
 *   DEPLOY_URL     - Optional. Defaults to VERCEL_URL or localhost:3000.
 *
 * Budget analysis (3-minute polling):
 *   - Pro tier = 7,500 req/day
 *   - 3-min intervals = 480 polls/day
 *   - Max 5 leagues active simultaneously: 5 * 480 = 2,400 calls/day
 *   - Plus daily-resync (5) + refresh-odds (20) = 2,425 calls/day (32% utilization)
 *   - Fixture-window detection skips leagues with no active matches
 */

import 'dotenv/config';
import { Client } from '@upstash/qstash';

const token = process.env.QSTASH_TOKEN;
if (!token) {
  console.error('Error: QSTASH_TOKEN environment variable is required.');
  console.error(
    'Get it from: Upstash Console > QStash > Settings > Request Token',
  );
  process.exit(1);
}

const client = new Client({ token });

const baseUrl =
  process.env.DEPLOY_URL ||
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000');

async function main() {
  // 1. Poll-matches schedule (every 3 minutes)
  console.log(`Creating QStash schedules...`);
  console.log(`\n1. Poll Matches`);
  console.log(`  Destination: ${baseUrl}/api/cron/poll-matches`);
  console.log(`  Schedule: every 3 minutes`);

  const pollSchedule = await client.schedules.create({
    destination: `${baseUrl}/api/cron/poll-matches`,
    cron: '*/3 * * * *',
  });

  console.log(`  Schedule ID: ${pollSchedule.scheduleId}`);

  // 2. Refresh-odds schedule (every 6 hours)
  console.log(`\n2. Refresh Odds`);
  console.log(`  Destination: ${baseUrl}/api/cron/refresh-odds`);
  console.log(`  Schedule: every 6 hours`);

  const oddsSchedule = await client.schedules.create({
    destination: `${baseUrl}/api/cron/refresh-odds`,
    cron: '0 */6 * * *',
  });

  console.log(`  Schedule ID: ${oddsSchedule.scheduleId}`);

  console.log(`\nAll QStash schedules created successfully!`);
  console.log(
    `Make sure QSTASH_CURRENT_SIGNING_KEY and QSTASH_NEXT_SIGNING_KEY are set in your deployment environment.`,
  );
}

main().catch((err) => {
  console.error('Failed to create QStash schedule:', err);
  process.exit(1);
});
