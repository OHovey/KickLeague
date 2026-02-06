import { NextRequest, NextResponse } from 'next/server';
import { getDb, isDatabaseConfigured } from '@/db/connection';
import { affiliateClicks } from '@/db/schema';

const VALID_OUTCOMES = new Set(['home', 'draw', 'away']);

/**
 * POST /api/clicks
 *
 * Records an affiliate click event for analytics and reconciliation.
 * Fire-and-forget from the client -- must never block the user's navigation.
 *
 * Body: { fixtureId: number, bookmakerKey: string, outcome: string, odds: number }
 */
export async function POST(request: NextRequest) {
  try {
    if (!isDatabaseConfigured()) {
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    const body = await request.json();

    const { fixtureId, bookmakerKey, outcome, odds } = body;

    // Validate outcome
    if (!VALID_OUTCOMES.has(outcome)) {
      return NextResponse.json(
        { error: 'Invalid outcome. Must be home, draw, or away.' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (typeof fixtureId !== 'number' || typeof odds !== 'number' || !bookmakerKey) {
      return NextResponse.json(
        { error: 'Missing required fields.' },
        { status: 400 }
      );
    }

    // Read country from Vercel geo header or dev override
    const country =
      process.env.OVERRIDE_COUNTRY ??
      request.headers.get('x-vercel-ip-country') ??
      null;

    const db = getDb();
    await db.insert(affiliateClicks).values({
      fixtureId,
      bookmakerKey,
      outcome,
      odds,
      country: country?.toUpperCase() ?? null,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[api/clicks] Error recording click:', error);
    // Return 500 but never block the user
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
