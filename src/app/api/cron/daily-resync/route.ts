/**
 * QStash-triggered cron route for daily resync.
 *
 * POST: Called by QStash once daily at 04:00 UTC.
 *       Verifies QStash signature via Receiver.
 *
 * GET:  Dev-only manual trigger for local testing (403 in production).
 *
 * This refreshes fixture data for all 5 leagues, detects standings
 * drift, and auto-corrects any discrepancies.
 */

import * as Sentry from '@sentry/nextjs';
import { Receiver } from '@upstash/qstash';
import { dailyResync } from '@/lib/pipeline/daily-resync';
import { checkBudgetThresholds, logCronInvocation } from '@/lib/pipeline/api-budget';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const ENDPOINT = '/cron/daily-resync';

export async function POST(req: Request) {
  // --- QStash signature verification ---
  const signature = req.headers.get('upstash-signature');
  if (!signature) {
    await logCronInvocation({ endpoint: ENDPOINT, success: false, httpStatus: 401, error: 'missing_signature' });
    return new Response('`Upstash-Signature` header is missing', { status: 401 });
  }

  try {
    const receiver = new Receiver({
      currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
      nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
    });
    const body = await req.text();
    await receiver.verify({ signature, body });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[daily-resync] QStash signature verification failed:', message);
    await logCronInvocation({ endpoint: ENDPOINT, success: false, httpStatus: 401, error: `sig_failed: ${message}` });
    return Response.json({ error: `Signature verification failed: ${message}` }, { status: 401 });
  }

  // --- Business logic ---
  try {
    const result = await dailyResync();

    try { await checkBudgetThresholds(); } catch { /* budget check is best-effort */ }

    await logCronInvocation({ endpoint: ENDPOINT, success: true, httpStatus: 200, result: JSON.stringify(result) });
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
    await logCronInvocation({ endpoint: ENDPOINT, success: false, httpStatus: 500, error: message });
    return Response.json(
      { error: message },
      { status: 500 },
    );
  }
}

// Dev-only GET handler for manual testing
export async function GET(_req: Request) {
  if (process.env.NODE_ENV !== 'development') {
    return new Response('Not allowed', { status: 403 });
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
    console.error('[daily-resync] Error:', message);
    return Response.json({ error: message }, { status: 500 });
  }
}
