/**
 * Compute historical standings from fixture results.
 *
 * This module calculates standings for each matchweek based on finished fixtures,
 * enabling sparkline trends and position change tracking.
 */

import chalk from 'chalk';
import { eq, and, asc, lte } from 'drizzle-orm';
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { fixtures } from '../../db/schema/fixtures.js';
import { standings } from '../../db/schema/standings.js';
import { teams } from '../../db/schema/teams.js';
import { leagueConfig } from '../../db/schema/leagues.js';
import { buildConflictUpdateColumns } from './utils.js';

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

/**
 * Compute and store historical standings for a league-season from fixture results.
 */
export async function computeHistoricalStandings(
  db: NeonHttpDatabase<Record<string, unknown>>,
  leagueDbId: number,
  season: string,
): Promise<number> {
  // 1. Get all finished fixtures for the league-season
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
        eq(fixtures.status, 'finished')
      )
    )
    .orderBy(asc(fixtures.matchweek));

  if (fixtureResults.length === 0) {
    console.log(chalk.yellow(`  No finished fixtures found for league ${leagueDbId} ${season}`));
    return 0;
  }

  // Filter out fixtures without matchweek or scores
  const validFixtures: FixtureResult[] = fixtureResults.filter(
    (f): f is FixtureResult =>
      f.matchweek !== null && f.homeScore !== null && f.awayScore !== null
  );

  if (validFixtures.length === 0) {
    console.log(chalk.yellow(`  No valid fixtures with matchweek and scores`));
    return 0;
  }

  // 2. Get all teams for this league from the fixtures
  const teamIds = new Set<number>();
  for (const f of validFixtures) {
    teamIds.add(f.homeTeamId);
    teamIds.add(f.awayTeamId);
  }

  // 3. Determine matchweek range
  const matchweeks = [...new Set(validFixtures.map((f) => f.matchweek))].sort((a, b) => a - b);
  console.log(
    chalk.blue(`  Computing standings for matchweeks ${matchweeks[0]} to ${matchweeks[matchweeks.length - 1]}`)
  );

  // 4. Initialize team stats
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

  // 5. Process fixtures matchweek by matchweek
  let totalInserted = 0;
  let currentMatchweekIndex = 0;

  for (const matchweek of matchweeks) {
    // Get all fixtures for this matchweek
    const matchweekFixtures = validFixtures.filter((f) => f.matchweek === matchweek);

    // Process each fixture
    for (const fixture of matchweekFixtures) {
      const homeStats = teamStats.get(fixture.homeTeamId)!;
      const awayStats = teamStats.get(fixture.awayTeamId)!;

      // Update played
      homeStats.played++;
      awayStats.played++;

      // Update goals
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

      // Determine result
      if (fixture.homeScore > fixture.awayScore) {
        // Home win
        homeStats.won++;
        homeStats.homeWon++;
        homeStats.points += 3;
        awayStats.lost++;
        awayStats.awayLost++;
        homeStats.form.push('W');
        awayStats.form.push('L');
      } else if (fixture.homeScore < fixture.awayScore) {
        // Away win
        awayStats.won++;
        awayStats.awayWon++;
        awayStats.points += 3;
        homeStats.lost++;
        homeStats.homeLost++;
        homeStats.form.push('L');
        awayStats.form.push('W');
      } else {
        // Draw
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

    // 6. Rank teams for this matchweek
    const rankedTeams = [...teamStats.values()]
      .filter((t) => t.played > 0) // Only include teams that have played
      .sort((a, b) => {
        // Sort by points (desc), then goal difference (desc), then goals for (desc)
        if (b.points !== a.points) return b.points - a.points;
        if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
        return b.goalsFor - a.goalsFor;
      });

    // 7. Insert standings for this matchweek
    for (let i = 0; i < rankedTeams.length; i++) {
      const team = rankedTeams[i];
      const position = i + 1;

      await db
        .insert(standings)
        .values({
          leagueId: leagueDbId,
          season,
          matchweek,
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
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [standings.leagueId, standings.season, standings.matchweek, standings.teamId],
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

      totalInserted++;
    }

    currentMatchweekIndex++;
    if (currentMatchweekIndex % 5 === 0) {
      console.log(chalk.gray(`    Processed matchweek ${matchweek}...`));
    }
  }

  console.log(
    chalk.green(`  Computed ${totalInserted} historical standings rows across ${matchweeks.length} matchweeks`)
  );

  return totalInserted;
}
