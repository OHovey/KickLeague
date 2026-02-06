/**
 * Core odds refresh pipeline logic.
 *
 * Polls The Odds API for all 5 leagues, matches events to existing fixtures
 * in the database, runs each outcome through the affiliate link builder,
 * and upserts enriched odds into fixture_odds.
 *
 * Called by the QStash cron route (/api/cron/refresh-odds) on a schedule.
 * This automates what scripts/seed-odds.ts does manually.
 */

import { getDb } from '@/db/connection';
import { fixtures, fixtureOdds, teams, leagues } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { fetchOddsForSport, type OddsQuota } from '@/lib/odds-api/client';
import type { OddsEvent } from '@/lib/odds-api/types';
import { SPORT_KEY_MAP } from '@/lib/odds-api/sport-keys';
import { buildAffiliateLink } from '@/lib/affiliate/link-builder';

// ---------------------------------------------------------------------------
// Team name mapping: The Odds API names -> DB names (API-Football convention)
// ---------------------------------------------------------------------------

const ODDS_TO_DB_NAME: Record<string, string> = {
  // Premier League
  'Brighton and Hove Albion': 'Brighton',
  'Newcastle United': 'Newcastle',
  'Tottenham Hotspur': 'Tottenham',
  'West Ham United': 'West Ham',
  'Wolverhampton Wanderers': 'Wolves',
  // La Liga
  'Atletico Madrid': 'Atletico Madrid',
  'Athletic Bilbao': 'Athletic Club',
  'Real Betis': 'Real Betis',
  'Celta Vigo': 'Celta Vigo',
  // Bundesliga
  'Borussia Dortmund': 'Borussia Dortmund',
  'Borussia Monchengladbach': "Borussia Monchengladbach",
  'Bayer Leverkusen': 'Bayer Leverkusen',
  'Bayern Munich': 'Bayern Munich',
  'RB Leipzig': 'RB Leipzig',
  'VfB Stuttgart': 'VFB Stuttgart',
  'FC Augsburg': 'Augsburg',
  'FC Heidenheim': 'Heidenheim',
  'SC Freiburg': 'SC Freiburg',
  'TSG Hoffenheim': '1899 Hoffenheim',
  'VfL Bochum': 'VFL Bochum',
  'VfL Wolfsburg': 'VFL Wolfsburg',
  // Serie A
  'AC Milan': 'AC Milan',
  'Inter Milan': 'Inter',
  'AS Roma': 'AS Roma',
  // Ligue 1
  'Paris Saint Germain': 'Paris Saint Germain',
};

// ---------------------------------------------------------------------------
// Result type
// ---------------------------------------------------------------------------

export interface RefreshOddsResult {
  leaguesPolled: number;
  eventsProcessed: number;
  oddsUpserted: number;
  affiliateEnriched: number;
  skippedUnmapped: number;
  quotaRemaining: number | null;
  errors: string[];
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

/**
 * Refresh odds for all 5 leagues by polling The Odds API,
 * matching to existing fixtures, enriching with affiliate links,
 * and upserting into fixture_odds.
 */
export async function refreshOdds(): Promise<RefreshOddsResult> {
  const timestamp = new Date().toISOString();
  const db = getDb();

  let leaguesPolled = 0;
  let eventsProcessed = 0;
  let oddsUpserted = 0;
  let affiliateEnriched = 0;
  let skippedUnmapped = 0;
  let quotaRemaining: number | null = null;
  const errors: string[] = [];

  // Step 1: Build a global team name -> DB id map
  const allTeams = await db
    .select({ id: teams.id, name: teams.name })
    .from(teams);
  const teamNameToId = new Map<string, number>();
  for (const t of allTeams) {
    teamNameToId.set(t.name, t.id);
  }

  function resolveTeamId(oddsName: string): number | null {
    const dbName = ODDS_TO_DB_NAME[oddsName] ?? oddsName;
    return teamNameToId.get(dbName) ?? null;
  }

  // Step 2: Build league slug -> DB id map
  const allLeagues = await db
    .select({ id: leagues.id, slug: leagues.slug })
    .from(leagues);
  const leagueSlugToId = new Map<string, number>();
  for (const l of allLeagues) {
    leagueSlugToId.set(l.slug, l.id);
  }

  // Step 3: Poll each league in SPORT_KEY_MAP
  for (const [leagueSlug, sportKey] of Object.entries(SPORT_KEY_MAP)) {
    // Budget check: stop if quota is dangerously low
    if (quotaRemaining !== null && quotaRemaining < 50) {
      console.warn(
        `[refresh-odds] Quota remaining (${quotaRemaining}) below 50. Stopping further league fetches.`,
      );
      errors.push(
        `Stopped early: quota remaining ${quotaRemaining} < 50 threshold`,
      );
      break;
    }

    try {
      const result = await fetchAndProcessLeague(
        db,
        leagueSlug,
        sportKey,
        resolveTeamId,
        leagueSlugToId,
      );

      leaguesPolled++;
      eventsProcessed += result.eventsProcessed;
      oddsUpserted += result.oddsUpserted;
      affiliateEnriched += result.affiliateEnriched;
      skippedUnmapped += result.skippedUnmapped;
      quotaRemaining = result.quotaRemaining;

      console.log(
        `[refresh-odds] ${leagueSlug}: ${result.eventsProcessed} events, ` +
          `${result.oddsUpserted} odds upserted, ` +
          `${result.affiliateEnriched} links enriched. ` +
          `Quota remaining: ${result.quotaRemaining}`,
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`[refresh-odds] Failed to poll ${leagueSlug}: ${msg}`);
      errors.push(`${leagueSlug}: ${msg}`);
    }
  }

  console.log(
    `[refresh-odds] Complete: ${leaguesPolled} leagues, ${eventsProcessed} events, ` +
      `${oddsUpserted} odds upserted, ${affiliateEnriched} enriched. ` +
      `Quota remaining: ${quotaRemaining}`,
  );

  return {
    leaguesPolled,
    eventsProcessed,
    oddsUpserted,
    affiliateEnriched,
    skippedUnmapped,
    quotaRemaining,
    errors: errors.length > 0 ? errors : [],
    timestamp,
  };
}

// ---------------------------------------------------------------------------
// Internal: Fetch and process a single league
// ---------------------------------------------------------------------------

interface LeagueResult {
  eventsProcessed: number;
  oddsUpserted: number;
  affiliateEnriched: number;
  skippedUnmapped: number;
  quotaRemaining: number;
}

async function fetchAndProcessLeague(
  db: ReturnType<typeof getDb>,
  leagueSlug: string,
  sportKey: string,
  resolveTeamId: (name: string) => number | null,
  leagueSlugToId: Map<string, number>,
): Promise<LeagueResult> {
  // Fetch odds from The Odds API
  const { data: events, quota } = await fetchOddsForSport(sportKey);

  let eventsProcessed = 0;
  let oddsUpserted = 0;
  let affiliateEnriched = 0;
  let skippedUnmapped = 0;

  const leagueDbId = leagueSlugToId.get(leagueSlug);

  for (const event of events) {
    const homeTeamId = resolveTeamId(event.home_team);
    const awayTeamId = resolveTeamId(event.away_team);

    if (!homeTeamId || !awayTeamId) {
      console.warn(
        `[refresh-odds] Skipping unmapped: ${event.home_team} vs ${event.away_team}`,
      );
      skippedUnmapped++;
      continue;
    }

    // Find the existing fixture in the DB by team IDs and scheduled status
    // Only update odds for fixtures already created by API-Football polling or seed
    const matchingFixtures = await db
      .select({ id: fixtures.id })
      .from(fixtures)
      .where(
        and(
          eq(fixtures.homeTeamId, homeTeamId),
          eq(fixtures.awayTeamId, awayTeamId),
          eq(fixtures.status, 'scheduled'),
          ...(leagueDbId ? [eq(fixtures.leagueId, leagueDbId)] : []),
        ),
      )
      .limit(1);

    if (matchingFixtures.length === 0) {
      // No matching fixture -- skip this event (fixture not in DB yet)
      continue;
    }

    const fixtureId = matchingFixtures[0].id;
    eventsProcessed++;

    // Process each bookmaker's odds
    for (const bookmaker of event.bookmakers) {
      const market = bookmaker.markets.find((m) => m.key === 'h2h');
      if (!market) continue;

      const homeOutcome = market.outcomes.find(
        (o) => o.name === event.home_team,
      );
      const drawOutcome = market.outcomes.find((o) => o.name === 'Draw');
      const awayOutcome = market.outcomes.find(
        (o) => o.name === event.away_team,
      );

      if (!homeOutcome || !drawOutcome || !awayOutcome) continue;

      // Build affiliate-enriched links for each outcome
      const homeLink = buildAffiliateLink({
        bookmakerKey: bookmaker.key,
        apiLink: homeOutcome.link ?? null,
        sid: homeOutcome.sid ?? null,
      });
      const drawLink = buildAffiliateLink({
        bookmakerKey: bookmaker.key,
        apiLink: drawOutcome.link ?? null,
        sid: drawOutcome.sid ?? null,
      });
      const awayLink = buildAffiliateLink({
        bookmakerKey: bookmaker.key,
        apiLink: awayOutcome.link ?? null,
        sid: awayOutcome.sid ?? null,
      });

      // Track enrichment count
      if (homeLink.url || drawLink.url || awayLink.url) {
        affiliateEnriched++;
      }

      // Upsert odds with enriched links
      await db
        .insert(fixtureOdds)
        .values({
          fixtureId,
          bookmakerKey: bookmaker.key,
          bookmakerTitle: bookmaker.title,
          market: 'h2h',
          homeOdds: homeOutcome.price,
          drawOdds: drawOutcome.price,
          awayOdds: awayOutcome.price,
          homeLink: homeLink.url,
          drawLink: drawLink.url,
          awayLink: awayLink.url,
          prevHomeOdds: null,
          prevDrawOdds: null,
          prevAwayOdds: null,
          lastUpdated: new Date(bookmaker.last_update),
        })
        .onConflictDoUpdate({
          target: [
            fixtureOdds.fixtureId,
            fixtureOdds.bookmakerKey,
            fixtureOdds.market,
          ],
          set: {
            homeOdds: homeOutcome.price,
            drawOdds: drawOutcome.price,
            awayOdds: awayOutcome.price,
            homeLink: homeLink.url,
            drawLink: drawLink.url,
            awayLink: awayLink.url,
            lastUpdated: new Date(bookmaker.last_update),
            fetchedAt: new Date(),
          },
        });

      oddsUpserted++;
    }
  }

  return {
    eventsProcessed,
    oddsUpserted,
    affiliateEnriched,
    skippedUnmapped,
    quotaRemaining: quota.remaining,
  };
}
