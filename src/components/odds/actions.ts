'use server';

import { eq, inArray } from 'drizzle-orm';
import { getDb, isDatabaseConfigured } from '@/db/connection';
import { fixtureOdds } from '@/db/schema';
import { getAffiliateConfig } from '@/lib/affiliate/config';

// ── Types ──────────────────────────────────────────────────────────────────

export interface OddsRow {
  bookmakerKey: string;
  bookmakerTitle: string;
  homeOdds: number;
  drawOdds: number;
  awayOdds: number;
  homeLink: string | null;
  drawLink: string | null;
  awayLink: string | null;
  prevHomeOdds: number | null;
  prevDrawOdds: number | null;
  prevAwayOdds: number | null;
  affiliateProgram: string | null;
  lastUpdated: string;
}

export interface FixtureOddsResult {
  odds: OddsRow[];
  fetchedAt: string;
}

export interface CompactOddsData {
  bestHome: number;
  bestDraw: number;
  bestAway: number;
  bookmakerCount: number;
}

// ── Server Actions ─────────────────────────────────────────────────────────

/**
 * Fetch all bookmaker odds for a given fixture.
 * Returns rows sorted by best home odds descending (best odds first).
 */
export async function fetchOddsForFixture(
  fixtureId: number
): Promise<FixtureOddsResult | null> {
  if (!isDatabaseConfigured()) return null;

  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(fixtureOdds)
      .where(eq(fixtureOdds.fixtureId, fixtureId))
      .orderBy(fixtureOdds.homeOdds);

    if (rows.length === 0) return null;

    // Sort by best home odds descending (highest = best for bettors)
    const sorted = rows.sort((a, b) => b.homeOdds - a.homeOdds);

    const oddsRows: OddsRow[] = sorted.map((r) => {
      const affiliateCfg = getAffiliateConfig(r.bookmakerKey);
      return {
        bookmakerKey: r.bookmakerKey,
        bookmakerTitle: r.bookmakerTitle,
        homeOdds: r.homeOdds,
        drawOdds: r.drawOdds,
        awayOdds: r.awayOdds,
        homeLink: r.homeLink,
        drawLink: r.drawLink,
        awayLink: r.awayLink,
        prevHomeOdds: r.prevHomeOdds,
        prevDrawOdds: r.prevDrawOdds,
        prevAwayOdds: r.prevAwayOdds,
        affiliateProgram: affiliateCfg?.programName ?? null,
        lastUpdated: r.lastUpdated.toISOString(),
      };
    });

    // Use the most recent fetchedAt across all rows
    const latestFetchedAt = rows.reduce(
      (latest, r) => (r.fetchedAt > latest ? r.fetchedAt : latest),
      rows[0].fetchedAt
    );

    return {
      odds: oddsRows,
      fetchedAt: latestFetchedAt.toISOString(),
    };
  } catch (error) {
    console.error('[odds/actions] Error fetching odds for fixture:', error);
    return null;
  }
}

/**
 * Fetch compact odds (best per outcome) for a batch of fixtures.
 * Returns a record mapping fixtureId to the best odds across all bookmakers.
 */
export async function fetchCompactOdds(
  fixtureIds: number[]
): Promise<Record<number, CompactOddsData>> {
  if (!isDatabaseConfigured() || fixtureIds.length === 0) return {};

  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(fixtureOdds)
      .where(inArray(fixtureOdds.fixtureId, fixtureIds));

    // Group by fixtureId and find best odds per outcome
    const grouped = new Map<number, typeof rows>();
    for (const row of rows) {
      const existing = grouped.get(row.fixtureId);
      if (existing) {
        existing.push(row);
      } else {
        grouped.set(row.fixtureId, [row]);
      }
    }

    const result: Record<number, CompactOddsData> = {};
    for (const [fId, fRows] of grouped) {
      result[fId] = {
        bestHome: Math.max(...fRows.map((r) => r.homeOdds)),
        bestDraw: Math.max(...fRows.map((r) => r.drawOdds)),
        bestAway: Math.max(...fRows.map((r) => r.awayOdds)),
        bookmakerCount: fRows.length,
      };
    }

    return result;
  } catch (error) {
    console.error('[odds/actions] Error fetching compact odds:', error);
    return {};
  }
}
