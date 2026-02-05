/**
 * Vercel cron route handler for daily resync.
 *
 * Triggered at 04:00 UTC by Vercel's native cron scheduler.
 * Protected by CRON_SECRET to prevent unauthorized access.
 *
 * This refreshes fixture data for all 5 leagues, detects standings
 * drift, and auto-corrects any discrepancies.
 */

import type { NextRequest } from 'next/server';
import { dailyResync } from '@/lib/pipeline/daily-resync';

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const result = await dailyResync();
    return Response.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error);
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
