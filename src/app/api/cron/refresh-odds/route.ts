import { refreshOdds } from '@/lib/pipeline/refresh-odds';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { Receiver } = await import('@upstash/qstash');

    const signingKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
    const nextSigningKey = process.env.QSTASH_NEXT_SIGNING_KEY;

    if (!signingKey || !nextSigningKey) {
      console.error(
        '[refresh-odds] Missing QSTASH_CURRENT_SIGNING_KEY or QSTASH_NEXT_SIGNING_KEY',
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
    console.error('[refresh-odds] Signature verification failed:', error);
    return new Response('Unauthorized', { status: 401 });
  }

  const result = await refreshOdds();
  return Response.json(result);
}

export async function GET(_req: Request) {
  if (process.env.NODE_ENV !== 'development') {
    return new Response('Not allowed', { status: 403 });
  }
  const result = await refreshOdds();
  return Response.json(result);
}
