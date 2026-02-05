/**
 * QStash-triggered cron route for polling active matches.
 *
 * POST: Called by QStash every 30 minutes (budget tier).
 *       Verifies QStash signature at runtime to prevent unauthorized access.
 *
 * GET:  Dev-only manual trigger for local testing (403 in production).
 *
 * The handler delegates all logic to pollActiveMatches() which handles:
 * - Budget checking (returns early if daily limit exceeded)
 * - Fixture-window detection (returns early if no active matches)
 * - API-Football polling for each active league
 * - Status change detection and fixture upserts
 *
 * Note: QStash signature verification is done inside the POST handler
 * rather than wrapping the export, because verifySignatureAppRouter
 * eagerly validates env vars at import time, which breaks the Next.js
 * build when QSTASH_CURRENT_SIGNING_KEY is not set.
 */

import { pollActiveMatches } from '@/lib/pipeline/poll-active-matches';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: Request) {
  // Verify QStash signature at runtime (lazy import avoids build-time env check)
  try {
    const { Receiver } = await import('@upstash/qstash');

    const signingKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
    const nextSigningKey = process.env.QSTASH_NEXT_SIGNING_KEY;

    if (!signingKey || !nextSigningKey) {
      console.error(
        '[poll-matches] Missing QSTASH_CURRENT_SIGNING_KEY or QSTASH_NEXT_SIGNING_KEY',
      );
      return new Response('Server configuration error', { status: 500 });
    }

    const receiver = new Receiver({
      currentSigningKey: signingKey,
      nextSigningKey: nextSigningKey,
    });

    const signature = req.headers.get('upstash-signature');
    if (!signature) {
      return new Response('Missing signature', { status: 401 });
    }

    const body = await req.text();
    const isValid = await receiver.verify({
      signature,
      body,
    });

    if (!isValid) {
      return new Response('Invalid signature', { status: 401 });
    }
  } catch (error) {
    console.error('[poll-matches] Signature verification failed:', error);
    return new Response('Unauthorized', { status: 401 });
  }

  const result = await pollActiveMatches();
  return Response.json(result);
}

// Dev-only GET handler for manual testing
export async function GET(_req: Request) {
  if (process.env.NODE_ENV !== 'development') {
    return new Response('Not allowed', { status: 403 });
  }
  const result = await pollActiveMatches();
  return Response.json(result);
}
