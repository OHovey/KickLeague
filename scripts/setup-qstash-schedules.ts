/**
 * One-time setup script for QStash scheduled polling.
 *
 * Creates a QStash schedule that triggers the poll-matches cron route
 * every 30 minutes (budget tier). Run this once after initial deployment.
 *
 * Usage:
 *   QSTASH_TOKEN=... DEPLOY_URL=https://your-app.vercel.app npm run setup-qstash
 *
 * Environment variables:
 *   QSTASH_TOKEN   - Required. From Upstash Console > QStash > Settings.
 *   DEPLOY_URL     - Optional. Defaults to VERCEL_URL or localhost:3000.
 *
 * TODO: Upgrade cron to "* * * * *" (every 60s) when API-Football budget allows.
 *       See CONTEXT.md "Upgrade Todos" section.
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
  console.log(`Creating QStash schedule...`);
  console.log(`  Destination: ${baseUrl}/api/cron/poll-matches`);
  console.log(`  Schedule: every 30 minutes`);

  const schedule = await client.schedules.create({
    destination: `${baseUrl}/api/cron/poll-matches`,
    // Budget tier: poll every 30 minutes.
    // TODO: Upgrade to "* * * * *" (every 60s) when API-Football budget allows.
    // See CONTEXT.md "Upgrade Todos" section.
    cron: '*/30 * * * *',
  });

  console.log(`\nQStash schedule created successfully!`);
  console.log(`  Schedule ID: ${schedule.scheduleId}`);
  console.log(`\nThe poll-matches route will be triggered every 30 minutes.`);
  console.log(
    `Make sure QSTASH_CURRENT_SIGNING_KEY and QSTASH_NEXT_SIGNING_KEY are set in your deployment environment.`,
  );
}

main().catch((err) => {
  console.error('Failed to create QStash schedule:', err);
  process.exit(1);
});
