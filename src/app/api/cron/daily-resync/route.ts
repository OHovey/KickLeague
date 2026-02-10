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
import { dailyResync } from '@/lib/pipeline/daily-resync';
import { checkBudgetThresholds } from '@/lib/pipeline/api-budget';

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const result = await dailyResync();

    try { await checkBudgetThresholds(); } catch { /* budget check is best-effort */ }

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
    return Response.json(
      { error: message },
      { status: 500 },
    );
  }
}
