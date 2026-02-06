/**
 * Seed upcoming Premier League fixtures and odds from The Odds API.
 *
 * This script:
 * 1. Fetches upcoming PL odds from The Odds API
 * 2. Creates any missing teams in the database
 * 3. Creates "scheduled" fixture rows for upcoming matches
 * 4. Inserts all bookmaker odds into fixture_odds
 *
 * Usage:
 *   DOTENV_CONFIG_PATH=.env.local npx tsx scripts/seed-odds.ts
 */

import "dotenv/config";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import { teams } from "../src/db/schema/teams.js";
import { fixtures } from "../src/db/schema/fixtures.js";
import { fixtureOdds } from "../src/db/schema/odds.js";
import { fetchOddsForSport } from "../src/lib/odds-api/client.js";
import { buildAffiliateLink } from "../src/lib/affiliate/link-builder.js";
import type { OddsEvent } from "../src/lib/odds-api/types.js";

// ---------------------------------------------------------------------------
// Name mapping: The Odds API team names → API-Football team names in our DB
// ---------------------------------------------------------------------------

const ODDS_TO_DB_NAME: Record<string, string> = {
  "Brighton and Hove Albion": "Brighton",
  "Newcastle United": "Newcastle",
  "Tottenham Hotspur": "Tottenham",
  "West Ham United": "West Ham",
  "Wolverhampton Wanderers": "Wolves",
  // These should match directly:
  // Arsenal, Aston Villa, Bournemouth, Brentford, Chelsea,
  // Crystal Palace, Everton, Fulham, Liverpool,
  // Manchester City, Manchester United, Nottingham Forest
};

// Teams that need to be created (promoted to PL for 2025-26)
const NEW_TEAMS: Array<{
  name: string;
  slug: string;
  abbreviation: string;
  country: string;
}> = [
  {
    name: "Leeds United",
    slug: "leeds-united",
    abbreviation: "LEE",
    country: "England",
  },
  {
    name: "Sunderland",
    slug: "sunderland",
    abbreviation: "SUN",
    country: "England",
  },
  {
    name: "Burnley",
    slug: "burnley",
    abbreviation: "BUR",
    country: "England",
  },
];

const PL_LEAGUE_ID = 1; // Premier League DB id

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("Missing DATABASE_URL");
    process.exit(1);
  }
  if (!process.env.ODDS_API_KEY) {
    console.error("Missing ODDS_API_KEY");
    process.exit(1);
  }

  const db = drizzle(process.env.DATABASE_URL);

  // ── Step 1: Fetch odds from The Odds API ──────────────────────────────
  console.log("Fetching PL odds from The Odds API...");
  const { data: events, quota } = await fetchOddsForSport("soccer_epl");
  console.log(
    `  Got ${events.length} events. Quota: ${quota.remaining} remaining.`
  );

  if (events.length === 0) {
    console.log("No upcoming events found. Exiting.");
    return;
  }

  // ── Step 2: Build team name → DB id mapping ───────────────────────────
  console.log("Building team mapping...");

  // Get existing teams
  const existingTeams = await db
    .select({ id: teams.id, name: teams.name })
    .from(teams);
  const teamNameToId = new Map<string, number>();
  for (const t of existingTeams) {
    teamNameToId.set(t.name, t.id);
  }

  // Create missing teams
  for (const newTeam of NEW_TEAMS) {
    if (!teamNameToId.has(newTeam.name)) {
      console.log(`  Creating team: ${newTeam.name}`);
      const [created] = await db
        .insert(teams)
        .values({
          apiId: 99000 + NEW_TEAMS.indexOf(newTeam), // Placeholder API ID
          leagueId: PL_LEAGUE_ID,
          slug: newTeam.slug,
          name: newTeam.name,
          shortName: newTeam.abbreviation,
          abbreviation: newTeam.abbreviation,
          country: newTeam.country,
        })
        .onConflictDoUpdate({
          target: teams.slug,
          set: { name: newTeam.name },
        })
        .returning({ id: teams.id });
      teamNameToId.set(newTeam.name, created.id);
    }
  }

  // Resolve Odds API names to DB ids
  function resolveTeamId(oddsName: string): number | null {
    const dbName = ODDS_TO_DB_NAME[oddsName] ?? oddsName;
    return teamNameToId.get(dbName) ?? null;
  }

  // ── Step 3: Create fixtures and insert odds ───────────────────────────
  console.log("Creating fixtures and inserting odds...");

  let fixturesCreated = 0;
  let oddsInserted = 0;
  let affiliateEnriched = 0;
  let skipped = 0;

  for (const event of events) {
    const homeId = resolveTeamId(event.home_team);
    const awayId = resolveTeamId(event.away_team);

    if (!homeId || !awayId) {
      console.warn(
        `  Skipping: ${event.home_team} vs ${event.away_team} (unmapped team)`
      );
      skipped++;
      continue;
    }

    // Create or find fixture
    // Use a deterministic "fake" API ID based on the Odds API event id
    const fakeApiId = hashToInt(event.id);

    const [fixture] = await db
      .insert(fixtures)
      .values({
        apiId: fakeApiId,
        leagueId: PL_LEAGUE_ID,
        season: "2025",
        matchweek: null,
        homeTeamId: homeId,
        awayTeamId: awayId,
        kickoff: new Date(event.commence_time),
        status: "scheduled",
        homeScore: null,
        awayScore: null,
      })
      .onConflictDoUpdate({
        target: fixtures.apiId,
        set: {
          kickoff: new Date(event.commence_time),
          status: "scheduled" as const,
        },
      })
      .returning({ id: fixtures.id });

    fixturesCreated++;

    // Insert odds for each bookmaker
    for (const bookmaker of event.bookmakers) {
      const market = bookmaker.markets.find((m) => m.key === "h2h");
      if (!market) continue;

      const homeOutcome = market.outcomes.find(
        (o) => o.name === event.home_team
      );
      const drawOutcome = market.outcomes.find((o) => o.name === "Draw");
      const awayOutcome = market.outcomes.find(
        (o) => o.name === event.away_team
      );

      if (!homeOutcome || !drawOutcome || !awayOutcome) continue;

      // Build affiliate-enriched links for each outcome
      const homeResult = buildAffiliateLink({
        bookmakerKey: bookmaker.key,
        apiLink: homeOutcome.link ?? null,
        sid: homeOutcome.sid ?? null,
      });
      const drawResult = buildAffiliateLink({
        bookmakerKey: bookmaker.key,
        apiLink: drawOutcome.link ?? null,
        sid: drawOutcome.sid ?? null,
      });
      const awayResult = buildAffiliateLink({
        bookmakerKey: bookmaker.key,
        apiLink: awayOutcome.link ?? null,
        sid: awayOutcome.sid ?? null,
      });

      if (homeResult.affiliateProgram !== null) {
        affiliateEnriched++;
      }

      await db
        .insert(fixtureOdds)
        .values({
          fixtureId: fixture.id,
          bookmakerKey: bookmaker.key,
          bookmakerTitle: bookmaker.title,
          market: "h2h",
          homeOdds: homeOutcome.price,
          drawOdds: drawOutcome.price,
          awayOdds: awayOutcome.price,
          homeLink: homeResult.url,
          drawLink: drawResult.url,
          awayLink: awayResult.url,
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
            homeLink: homeResult.url,
            drawLink: drawResult.url,
            awayLink: awayResult.url,
            lastUpdated: new Date(bookmaker.last_update),
            fetchedAt: new Date(),
          },
        });

      oddsInserted++;
    }
  }

  console.log(`\nDone!`);
  console.log(`  Fixtures created: ${fixturesCreated}`);
  console.log(`  Odds rows inserted: ${oddsInserted}`);
  console.log(`  Affiliate-enriched: ${affiliateEnriched}`);
  console.log(`  Skipped (unmapped teams): ${skipped}`);
  console.log(`  Odds API quota remaining: ${quota.remaining}`);
}

/**
 * Convert a string ID to a deterministic positive integer.
 * Used to create fake API IDs for fixtures not from API-Football.
 */
function hashToInt(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  // Ensure positive and in a range that won't conflict with real API IDs
  return Math.abs(hash % 900000) + 9000000;
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
