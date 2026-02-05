import { describe, it, expect } from 'vitest';
import {
  calculateStandings,
  applyTiebreakers,
  type StandingsRow,
  type TiebreakerMethod,
  type H2HMatrix,
} from './calculate';

// Helper to create a standings row with required fields
function createRow(overrides: Partial<StandingsRow>): StandingsRow {
  return {
    teamId: 1,
    teamName: 'Team A',
    teamSlug: 'team-a',
    position: 1,
    played: 20,
    won: 10,
    drawn: 5,
    lost: 5,
    goalsFor: 30,
    goalsAgainst: 20,
    goalDifference: 10,
    points: 35,
    form: 'WWDLW',
    ...overrides,
  };
}

describe('applyTiebreakers', () => {
  describe('goal difference tiebreaker', () => {
    it('ranks team with higher GD above team with lower GD when points are equal', () => {
      const rows: StandingsRow[] = [
        createRow({ teamId: 1, teamName: 'Team A', points: 40, goalDifference: 10 }),
        createRow({ teamId: 2, teamName: 'Team B', points: 40, goalDifference: 15 }),
      ];

      const chain: TiebreakerMethod[] = ['goal_difference', 'goals_for', 'head_to_head'];
      const sorted = applyTiebreakers(rows, chain);

      expect(sorted[0].teamName).toBe('Team B');
      expect(sorted[1].teamName).toBe('Team A');
    });
  });

  describe('goals for tiebreaker', () => {
    it('ranks team with more goals scored higher when GD is equal', () => {
      const rows: StandingsRow[] = [
        createRow({ teamId: 1, teamName: 'Team A', points: 40, goalDifference: 10, goalsFor: 45 }),
        createRow({ teamId: 2, teamName: 'Team B', points: 40, goalDifference: 10, goalsFor: 50 }),
      ];

      const chain: TiebreakerMethod[] = ['goal_difference', 'goals_for', 'head_to_head'];
      const sorted = applyTiebreakers(rows, chain);

      expect(sorted[0].teamName).toBe('Team B');
      expect(sorted[1].teamName).toBe('Team A');
    });
  });

  describe('head-to-head tiebreaker', () => {
    it('ranks team that won H2H matches higher when tied on points', () => {
      const rows: StandingsRow[] = [
        createRow({ teamId: 1, teamName: 'Team A', points: 40, goalDifference: 10 }),
        createRow({ teamId: 2, teamName: 'Team B', points: 40, goalDifference: 10 }),
      ];

      // Team A beat Team B: 2-1, 1-0 (6 points for A, 0 for B)
      const h2hMatrix: H2HMatrix = {
        1: { 2: { points: 6, goalDifference: 2, goalsFor: 3 } },
        2: { 1: { points: 0, goalDifference: -2, goalsFor: 1 } },
      };

      const chain: TiebreakerMethod[] = ['head_to_head', 'goal_difference', 'goals_for'];
      const sorted = applyTiebreakers(rows, chain, h2hMatrix);

      expect(sorted[0].teamName).toBe('Team A');
      expect(sorted[1].teamName).toBe('Team B');
    });
  });

  describe('multi-way tie resolution', () => {
    it('resolves 3-way tie using H2H among tied teams, then falls through to GD', () => {
      const rows: StandingsRow[] = [
        createRow({ teamId: 1, teamName: 'Team A', points: 40, goalDifference: 5, goalsFor: 30 }),
        createRow({ teamId: 2, teamName: 'Team B', points: 40, goalDifference: 8, goalsFor: 35 }),
        createRow({ teamId: 3, teamName: 'Team C', points: 40, goalDifference: 3, goalsFor: 28 }),
      ];

      // H2H results among the three teams:
      // A vs B: A won 1, drew 1 (4 pts for A, 1 for B)
      // A vs C: A won 2 (6 pts for A, 0 for C)
      // B vs C: C won 1, drew 1 (4 pts for C, 1 for B)
      // H2H totals: A=10, B=2, C=4
      const h2hMatrix: H2HMatrix = {
        1: {
          2: { points: 4, goalDifference: 1, goalsFor: 3 },
          3: { points: 6, goalDifference: 3, goalsFor: 4 },
        },
        2: {
          1: { points: 1, goalDifference: -1, goalsFor: 2 },
          3: { points: 1, goalDifference: -1, goalsFor: 1 },
        },
        3: {
          1: { points: 0, goalDifference: -3, goalsFor: 1 },
          2: { points: 4, goalDifference: 1, goalsFor: 2 },
        },
      };

      const chain: TiebreakerMethod[] = ['head_to_head', 'goal_difference', 'goals_for'];
      const sorted = applyTiebreakers(rows, chain, h2hMatrix);

      // H2H: A (10 pts) > C (4 pts) > B (2 pts)
      expect(sorted[0].teamName).toBe('Team A');
      expect(sorted[1].teamName).toBe('Team C');
      expect(sorted[2].teamName).toBe('Team B');
    });
  });

  describe('chain exhaustion', () => {
    it('sorts alphabetically by team name when all tiebreakers are equal', () => {
      const rows: StandingsRow[] = [
        createRow({ teamId: 1, teamName: 'Zebra FC', points: 40, goalDifference: 10, goalsFor: 40 }),
        createRow({ teamId: 2, teamName: 'Arsenal', points: 40, goalDifference: 10, goalsFor: 40 }),
        createRow({ teamId: 3, teamName: 'Manchester', points: 40, goalDifference: 10, goalsFor: 40 }),
      ];

      // H2H is equal (all drew with each other)
      const h2hMatrix: H2HMatrix = {
        1: {
          2: { points: 2, goalDifference: 0, goalsFor: 2 },
          3: { points: 2, goalDifference: 0, goalsFor: 2 },
        },
        2: {
          1: { points: 2, goalDifference: 0, goalsFor: 2 },
          3: { points: 2, goalDifference: 0, goalsFor: 2 },
        },
        3: {
          1: { points: 2, goalDifference: 0, goalsFor: 2 },
          2: { points: 2, goalDifference: 0, goalsFor: 2 },
        },
      };

      const chain: TiebreakerMethod[] = ['head_to_head', 'goal_difference', 'goals_for'];
      const sorted = applyTiebreakers(rows, chain, h2hMatrix);

      // Alphabetical: Arsenal, Manchester, Zebra FC
      expect(sorted[0].teamName).toBe('Arsenal');
      expect(sorted[1].teamName).toBe('Manchester');
      expect(sorted[2].teamName).toBe('Zebra FC');
    });
  });
});

describe('calculateStandings', () => {
  describe('Premier League (GD-first)', () => {
    it('sorts by points first, then goal difference', () => {
      const rows: StandingsRow[] = [
        createRow({ teamId: 3, teamName: 'Liverpool', points: 42, goalDifference: 12 }),
        createRow({ teamId: 1, teamName: 'Arsenal', points: 45, goalDifference: 20 }),
        createRow({ teamId: 2, teamName: 'Chelsea', points: 42, goalDifference: 18 }),
      ];

      const config = {
        tiebreakerOrder: 'goal_difference,goals_for,head_to_head',
      };

      const sorted = calculateStandings(rows, config);

      expect(sorted[0].teamName).toBe('Arsenal');
      expect(sorted[0].position).toBe(1);
      expect(sorted[1].teamName).toBe('Chelsea'); // Higher GD than Liverpool
      expect(sorted[1].position).toBe(2);
      expect(sorted[2].teamName).toBe('Liverpool');
      expect(sorted[2].position).toBe(3);
    });
  });

  describe('La Liga (H2H-first)', () => {
    it('uses head-to-head as primary tiebreaker', () => {
      const rows: StandingsRow[] = [
        createRow({ teamId: 1, teamName: 'Real Madrid', points: 50, goalDifference: 25 }),
        createRow({ teamId: 2, teamName: 'Barcelona', points: 50, goalDifference: 30 }),
      ];

      // Barcelona has higher GD, but Real Madrid beat them H2H
      const h2hMatrix: H2HMatrix = {
        1: { 2: { points: 4, goalDifference: 2, goalsFor: 3 } }, // Real won 1, drew 1
        2: { 1: { points: 1, goalDifference: -2, goalsFor: 1 } },
      };

      const config = {
        tiebreakerOrder: 'head_to_head,goal_difference,goals_for',
      };

      const sorted = calculateStandings(rows, config, h2hMatrix);

      // Real Madrid should be higher due to H2H despite lower GD
      expect(sorted[0].teamName).toBe('Real Madrid');
      expect(sorted[1].teamName).toBe('Barcelona');
    });
  });

  describe('Serie A (H2H-first)', () => {
    it('uses head-to-head as primary tiebreaker', () => {
      const rows: StandingsRow[] = [
        createRow({ teamId: 1, teamName: 'Juventus', points: 60, goalDifference: 30 }),
        createRow({ teamId: 2, teamName: 'Inter', points: 60, goalDifference: 35 }),
      ];

      // Inter has higher GD, but Juventus beat them H2H
      const h2hMatrix: H2HMatrix = {
        1: { 2: { points: 6, goalDifference: 3, goalsFor: 4 } }, // Juve won both
        2: { 1: { points: 0, goalDifference: -3, goalsFor: 1 } },
      };

      const config = {
        tiebreakerOrder: 'head_to_head,goal_difference,goals_for',
      };

      const sorted = calculateStandings(rows, config, h2hMatrix);

      expect(sorted[0].teamName).toBe('Juventus');
      expect(sorted[1].teamName).toBe('Inter');
    });
  });

  describe('Bundesliga (GD-first)', () => {
    it('uses goal difference as primary tiebreaker', () => {
      const rows: StandingsRow[] = [
        createRow({ teamId: 1, teamName: 'Bayern', points: 70, goalDifference: 40 }),
        createRow({ teamId: 2, teamName: 'Dortmund', points: 70, goalDifference: 45 }),
      ];

      const config = {
        tiebreakerOrder: 'goal_difference,goals_for,head_to_head',
      };

      const sorted = calculateStandings(rows, config);

      // Dortmund has higher GD
      expect(sorted[0].teamName).toBe('Dortmund');
      expect(sorted[1].teamName).toBe('Bayern');
    });
  });

  describe('Ligue 1 (GD-first)', () => {
    it('uses goal difference as primary tiebreaker', () => {
      const rows: StandingsRow[] = [
        createRow({ teamId: 1, teamName: 'PSG', points: 75, goalDifference: 50 }),
        createRow({ teamId: 2, teamName: 'Marseille', points: 75, goalDifference: 42 }),
      ];

      const config = {
        tiebreakerOrder: 'goal_difference,goals_for,head_to_head',
      };

      const sorted = calculateStandings(rows, config);

      // PSG has higher GD
      expect(sorted[0].teamName).toBe('PSG');
      expect(sorted[1].teamName).toBe('Marseille');
    });
  });

  describe('edge cases', () => {
    it('handles empty input', () => {
      const config = { tiebreakerOrder: 'goal_difference,goals_for,head_to_head' };
      const sorted = calculateStandings([], config);
      expect(sorted).toEqual([]);
    });

    it('handles single team', () => {
      const rows: StandingsRow[] = [
        createRow({ teamId: 1, teamName: 'Solo FC', points: 50 }),
      ];
      const config = { tiebreakerOrder: 'goal_difference,goals_for,head_to_head' };
      const sorted = calculateStandings(rows, config);

      expect(sorted).toHaveLength(1);
      expect(sorted[0].position).toBe(1);
    });

    it('handles all teams tied on all tiebreakers', () => {
      const rows: StandingsRow[] = [
        createRow({ teamId: 1, teamName: 'Team Z', points: 40, goalDifference: 10, goalsFor: 40 }),
        createRow({ teamId: 2, teamName: 'Team A', points: 40, goalDifference: 10, goalsFor: 40 }),
        createRow({ teamId: 3, teamName: 'Team M', points: 40, goalDifference: 10, goalsFor: 40 }),
      ];

      const config = { tiebreakerOrder: 'goal_difference,goals_for,head_to_head' };
      const sorted = calculateStandings(rows, config);

      // Falls through to alphabetical
      expect(sorted[0].teamName).toBe('Team A');
      expect(sorted[1].teamName).toBe('Team M');
      expect(sorted[2].teamName).toBe('Team Z');
    });

    it('assigns correct positions after sorting', () => {
      const rows: StandingsRow[] = [
        createRow({ teamId: 1, teamName: 'Third', points: 30 }),
        createRow({ teamId: 2, teamName: 'First', points: 50 }),
        createRow({ teamId: 3, teamName: 'Second', points: 40 }),
      ];

      const config = { tiebreakerOrder: 'goal_difference,goals_for,head_to_head' };
      const sorted = calculateStandings(rows, config);

      expect(sorted[0].teamName).toBe('First');
      expect(sorted[0].position).toBe(1);
      expect(sorted[1].teamName).toBe('Second');
      expect(sorted[1].position).toBe(2);
      expect(sorted[2].teamName).toBe('Third');
      expect(sorted[2].position).toBe(3);
    });
  });
});
