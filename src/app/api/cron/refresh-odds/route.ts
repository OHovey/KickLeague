/**
 * QStash-triggered cron route for refreshing betting odds.
 *
 * POST: Called by QStash every 6 hours.
 *       Verifies QStash signature via Receiver (manual verification
 *       to avoid unhandled SignatureError from verifySignatureAppRouter).
 *
 * GET:  Dev-only manual trigger for local testing (403 in production).
 */

import * as Sentry from '@sentry/nextjs';
import { Receiver } from '@upstash/qstash';
import { refreshOdds } from '@/lib/pipeline/refresh-odds';
import { checkBudgetThresholds } from '@/lib/pipeline/api-budget';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: Request) {
  // --- QStash signature verification ---
  const signature = req.headers.get('upstash-signature');
  if (!signature) {
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
    console.error('[refresh-odds] QStash signature verification failed:', message);
    return Response.json({ error: `Signature verification failed: ${message}` }, { status: 401 });
  }

  // --- Business logic ---
  try {
    const result = await refreshOdds();

    try { await checkBudgetThresholds(); } catch { /* budget check is best-effort */ }

    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    Sentry.captureException(error, {
      tags: { cron: 'refresh-odds' },
      extra: { route: '/api/cron/refresh-odds' },
    });
    console.error('[refresh-odds] Error:', message);
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function GET(_req: Request) {
  if (process.env.NODE_ENV !== 'development') {
    return new Response('Not allowed', { status: 403 });
  }

  try {
    const result = await refreshOdds();

    try { await checkBudgetThresholds(); } catch { /* budget check is best-effort */ }

    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    Sentry.captureException(error, {
      tags: { cron: 'refresh-odds' },
      extra: { route: '/api/cron/refresh-odds' },
    });
    console.error('[refresh-odds] Error:', message);
    return Response.json({ error: message }, { status: 500 });
  }
}
