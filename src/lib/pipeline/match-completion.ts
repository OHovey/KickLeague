/**
 * Match completion chain: standings recalculation + ISR revalidation.
 *
 * When a match transitions to "finished", this module:
 * 1. Recomputes standings for the affected matchweek from all fixtures
 * 2. Upserts standings rows with fresh updatedAt timestamps
 * 3. Revalidates ISR pages so the next visit gets fresh data
 *
 * The standings algorithm is inlined (not shared with seed code) to keep
 * the live pipeline and seed code independently evolvable.
 */

import { getDb } from '@/db/connection';
import { fixtures, standings, leagues } from '@/db/schema';
import { eq, and, asc, lte } from 'drizzle-orm';
import { buildConflictUpdateColumns } from '@/lib/seed/utils';
import { revalidatePath } from 'next/cache';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CompletionResult {
  fixtureApiId: number;
  leagueSlug: string;
  matchweek: number;
  standingsUpdated: boolean;
  pagesRevalidated: string[];
}

interface TeamStats {
  teamId: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  homeWon: number;
  homeDrawn: number;
  homeLost: number;
  homeGoalsFor: number;
  homeGoalsAgainst: number;
  awayWon: number;
  awayDrawn: number;
  awayLost: number;
  awayGoalsFor: number;
  awayGoalsAgainst: number;
  form: string[];
}

interface FixtureResult {
  matchweek: number;
  homeTeamId: number;
  awayTeamId: number;
  homeScore: number;
  awayScore: number;
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

/**
 * Handle a match completing: recompute standings for the affected matchweek
 * and revalidate ISR pages.
 *
 * @param fixtureDbId - DB primary key of the completed fixture
 * @param leagueDbId - DB primary key of the league
 * @param season - Season string (e.g. "2025")
 * @param matchweek - Matchweek number of the completed fixture
 */
export async function handleMatchCompletion(
  fixtureDbId: number,
  leagueDbId: number,
  season: string,
  matchweek: number,
): Promise<CompletionResult> {
  const db = getDb();

  // Look up fixture API ID and league slug for the result
  const [fixtureRow] = await db
    .select({ apiId: fixtures.apiId })
    .from(fixtures)
    .where(eq(fixtures.id, fixtureDbId));

  const [leagueRow] = await db
    .select({ slug: leagues.slug })
    .from(leagues)
    .where(eq(leagues.id, leagueDbId));

  const fixtureApiId = fixtureRow?.apiId ?? 0;
  const leagueSlug = leagueRow?.slug ?? 'unknown';

  // 1. Recompute standings for the affected matchweek
  const standingsUpdated = await recomputeMatchweekStandings(
    db,
    leagueDbId,
    season,
    matchweek,
  );

  // 2. Revalidate ISR pages
  const pagesRevalidated: string[] = [];
  try {
    revalidatePath('/');
    pagesRevalidated.push('/');
  } catch {
    // revalidatePath may throw outside of a request context (e.g. in tests)
  }
  try {
    revalidatePath('/matches');
    pagesRevalidated.push('/matches');
  } catch {
    // same as above
  }

  // 3. Log the completion
  console.log(
    JSON.stringify({
      event: 'match_completed',
      fixtureId: fixtureApiId,
      league: leagueSlug,
      matchweek,
      standingsUpdated: true,
    }),
  );

  return {
    fixtureApiId,
    leagueSlug,
    matchweek,
    standingsUpdated,
    pagesRevalidated,
  };
}

// ---------------------------------------------------------------------------
// Standings recomputation (inlined from seed pattern)
// ---------------------------------------------------------------------------

/**
 * Recompute standings for a single matchweek by accumulating all finished
 * fixtures up to and including that matchweek.
 *
 * This is the same algorithm as computeHistoricalStandings but scoped to
 * a single matchweek output (not all matchweeks in bulk).
 */
async function recomputeMatchweekStandings(
  db: ReturnType<typeof getDb>,
  leagueDbId: number,
  season: string,
  targetMatchweek: number,
): Promise<boolean> {
  // Query ALL finished fixtures for this league+season up to targetMatchweek
  const fixtureResults = await db
    .select({
      matchweek: fixtures.matchweek,
      homeTeamId: fixtures.homeTeamId,
      awayTeamId: fixtures.awayTeamId,
      homeScore: fixtures.homeScore,
      awayScore: fixtures.awayScore,
    })
    .from(fixtures)
    .where(
      and(
        eq(fixtures.leagueId, leagueDbId),
        eq(fixtures.season, season),
        eq(fixtures.status, 'finished'),
        lte(fixtures.matchweek, targetMatchweek),
      ),
    )
    .orderBy(asc(fixtures.matchweek));

  // Filter out fixtures without matchweek or scores
  const validFixtures: FixtureResult[] = fixtureResults.filter(
    (f): f is FixtureResult =>
      f.matchweek !== null && f.homeScore !== null && f.awayScore !== null,
  );

  if (validFixtures.length === 0) return false;

  // Collect all team IDs
  const teamIds = new Set<number>();
  for (const f of validFixtures) {
    teamIds.add(f.homeTeamId);
    teamIds.add(f.awayTeamId);
  }

  // Initialize team stats
  const teamStats = new Map<number, TeamStats>();
  for (const teamId of teamIds) {
    teamStats.set(teamId, {
      teamId,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
      homeWon: 0,
      homeDrawn: 0,
      homeLost: 0,
      homeGoalsFor: 0,
      homeGoalsAgainst: 0,
      awayWon: 0,
      awayDrawn: 0,
      awayLost: 0,
      awayGoalsFor: 0,
      awayGoalsAgainst: 0,
      form: [],
    });
  }

  // Accumulate stats from all fixtures up to targetMatchweek
  for (const fixture of validFixtures) {
    const homeStats = teamStats.get(fixture.homeTeamId)!;
    const awayStats = teamStats.get(fixture.awayTeamId)!;

    homeStats.played++;
    awayStats.played++;

    // Goals
    homeStats.goalsFor += fixture.homeScore;
    homeStats.goalsAgainst += fixture.awayScore;
    homeStats.goalDifference = homeStats.goalsFor - homeStats.goalsAgainst;
    homeStats.homeGoalsFor += fixture.homeScore;
    homeStats.homeGoalsAgainst += fixture.awayScore;

    awayStats.goalsFor += fixture.awayScore;
    awayStats.goalsAgainst += fixture.homeScore;
    awayStats.goalDifference = awayStats.goalsFor - awayStats.goalsAgainst;
    awayStats.awayGoalsFor += fixture.awayScore;
    awayStats.awayGoalsAgainst += fixture.homeScore;

    // Result determination
    if (fixture.homeScore > fixture.awayScore) {
      homeStats.won++;
      homeStats.homeWon++;
      homeStats.points += 3;
      awayStats.lost++;
      awayStats.awayLost++;
      homeStats.form.push('W');
      awayStats.form.push('L');
    } else if (fixture.homeScore < fixture.awayScore) {
      awayStats.won++;
      awayStats.awayWon++;
      awayStats.points += 3;
      homeStats.lost++;
      homeStats.homeLost++;
      homeStats.form.push('L');
      awayStats.form.push('W');
    } else {
      homeStats.drawn++;
      homeStats.homeDrawn++;
      homeStats.points += 1;
      awayStats.drawn++;
      awayStats.awayDrawn++;
      awayStats.points += 1;
      homeStats.form.push('D');
      awayStats.form.push('D');
    }

    // Keep only last 5 results for form
    if (homeStats.form.length > 5) homeStats.form.shift();
    if (awayStats.form.length > 5) awayStats.form.shift();
  }

  // Rank teams by points (desc), goal difference (desc), goals for (desc)
  const rankedTeams = [...teamStats.values()]
    .filter((t) => t.played > 0)
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference)
        return b.goalDifference - a.goalDifference;
      return b.goalsFor - a.goalsFor;
    });

  // Upsert standings rows for the target matchweek
  const now = new Date();
  for (let i = 0; i < rankedTeams.length; i++) {
    const team = rankedTeams[i];
    const position = i + 1;

    await db
      .insert(standings)
      .values({
        leagueId: leagueDbId,
        season,
        matchweek: targetMatchweek,
        teamId: team.teamId,
        position,
        played: team.played,
        won: team.won,
        drawn: team.drawn,
        lost: team.lost,
        goalsFor: team.goalsFor,
        goalsAgainst: team.goalsAgainst,
        goalDifference: team.goalDifference,
        points: team.points,
        form: team.form.join(''),
        homeWon: team.homeWon,
        homeDrawn: team.homeDrawn,
        homeLost: team.homeLost,
        homeGoalsFor: team.homeGoalsFor,
        homeGoalsAgainst: team.homeGoalsAgainst,
        awayWon: team.awayWon,
        awayDrawn: team.awayDrawn,
        awayLost: team.awayLost,
        awayGoalsFor: team.awayGoalsFor,
        awayGoalsAgainst: team.awayGoalsAgainst,
        pointsDeduction: 0,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [
          standings.leagueId,
          standings.season,
          standings.matchweek,
          standings.teamId,
        ],
        set: buildConflictUpdateColumns(standings, [
          'position',
          'played',
          'won',
          'drawn',
          'lost',
          'goalsFor',
          'goalsAgainst',
          'goalDifference',
          'points',
          'form',
          'homeWon',
          'homeDrawn',
          'homeLost',
          'homeGoalsFor',
          'homeGoalsAgainst',
          'awayWon',
          'awayDrawn',
          'awayLost',
          'awayGoalsFor',
          'awayGoalsAgainst',
          'updatedAt',
        ]),
      });
  }

  return rankedTeams.length > 0;
}
