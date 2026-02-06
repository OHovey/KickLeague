'use server';

import { eq, inArray } from 'drizzle-orm';
import { getDb, isDatabaseConfigured } from '@/db/connection';
import { fixtureOdds } from '@/db/schema';
import { getAffiliateConfig } from '@/lib/affiliate/config';
import { getAvailableBookmakers } from '@/lib/geo/bookmaker-availability';

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
  totalBookmakers: number;
}

export interface CompactOddsData {
  bestHome: number;
  bestDraw: number;
  bestAway: number;
  bookmakerCount: number;
}

// ── Server Actions ─────────────────────────────────────────────────────────

/**
 * Fetch bookmaker odds for a given fixture, filtered by country availability.
 * Returns rows sorted by country priority (lower = shown first), not by odds.
 */
export async function fetchOddsForFixture(
  fixtureId: number,
  countryCode: string | null,
): Promise<FixtureOddsResult | null> {
  if (!isDatabaseConfigured()) return null;

  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(fixtureOdds)
      .where(eq(fixtureOdds.fixtureId, fixtureId));

    if (rows.length === 0) return null;

    // Get allowed bookmakers for this country (sorted by priority)
    const available = getAvailableBookmakers(countryCode);
    const allowedKeys = new Set(available.map((b) => b.bookmakerKey));
    const priorityMap = new Map(available.map((b) => [b.bookmakerKey, b.priority]));

    // Filter to only allowed bookmakers, then map to OddsRow
    const oddsRows: OddsRow[] = rows
      .filter((r) => allowedKeys.has(r.bookmakerKey))
      .map((r) => {
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
      })
      .sort((a, b) => {
        const pA = priorityMap.get(a.bookmakerKey) ?? 999;
        const pB = priorityMap.get(b.bookmakerKey) ?? 999;
        if (pA !== pB) return pA - pB;
        return a.bookmakerKey.localeCompare(b.bookmakerKey);
      });

    // Use the most recent fetchedAt across all rows
    const latestFetchedAt = rows.reduce(
      (latest, r) => (r.fetchedAt > latest ? r.fetchedAt : latest),
      rows[0].fetchedAt,
    );

    return {
      odds: oddsRows,
      fetchedAt: latestFetchedAt.toISOString(),
      totalBookmakers: rows.length,
    };
  } catch (error) {
    console.error('[odds/actions] Error fetching odds for fixture:', error);
    return null;
  }
}

/**
 * Fetch compact odds (best per outcome) for a batch of fixtures.
 * Filters to only country-available bookmakers before computing best odds.
 * Returns a record mapping fixtureId to the best odds across available bookmakers.
 */
export async function fetchCompactOdds(
  fixtureIds: number[],
  countryCode: string | null,
): Promise<Record<number, CompactOddsData>> {
  if (!isDatabaseConfigured() || fixtureIds.length === 0) return {};

  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(fixtureOdds)
      .where(inArray(fixtureOdds.fixtureId, fixtureIds));

    // Get allowed bookmakers for this country
    const available = getAvailableBookmakers(countryCode);
    const allowedKeys = new Set(available.map((b) => b.bookmakerKey));

    // Group by fixtureId, filter to allowed bookmakers, then find best odds
    const grouped = new Map<number, typeof rows>();
    for (const row of rows) {
      if (!allowedKeys.has(row.bookmakerKey)) continue;
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
