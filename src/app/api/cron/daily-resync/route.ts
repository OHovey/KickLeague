/**
 * Vercel cron route handler for daily resync.
 *
 * Triggered at 04:00 UTC by Vercel's native cron scheduler.
 * Protected by CRON_SECRET to prevent unauthorized access.
 *
 * This refreshes fixture data for all 5 leagues, detects standings
 * drift, and auto-corrects any discrepancies.
 */

import * as Sentry from '@sentry/nextjs';
import type { NextRequest } from 'next/server';
import { sql } from 'drizzle-orm';
import { dailyResync } from '@/lib/pipeline/daily-resync';
import { checkBudgetThresholds } from '@/lib/pipeline/api-budget';
import { getDb } from '@/db/connection';

export const maxDuration = 60;

/** Log every cron invocation to the database for diagnostics. */
async function logCronInvocation(
  authPassed: boolean,
  result?: string | null,
  error?: string | null,
) {
  try {
    const db = getDb();
    await db.execute(sql`
      INSERT INTO api_call_log (endpoint, success, http_status, error_message, params)
      VALUES (
        '/cron/daily-resync',
        ${authPassed && !error},
        ${authPassed ? (error ? 500 : 200) : 401},
        ${error ?? null},
        ${result ?? null}
      )
    `);
  } catch {
    /* best-effort logging */
  }
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    await logCronInvocation(false, null, 'auth_failed');
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const result = await dailyResync();

    try { await checkBudgetThresholds(); } catch { /* budget check is best-effort */ }

    await logCronInvocation(true, JSON.stringify(result));
    return Response.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error);
    Sentry.captureException(error, {
      tags: { cron: 'daily-resync' },
      extra: { route: '/api/cron/daily-resync' },
    });
    console.error(
      JSON.stringify({
        event: 'daily_resync_error',
        error: message,
      }),
    );
    await logCronInvocation(true, null, message);
    return Response.json(
      { error: message },
      { status: 500 },
    );
  }
}
