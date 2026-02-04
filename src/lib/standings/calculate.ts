// Standings calculation with configurable tiebreakers
// This is a stub - will be implemented in GREEN phase

export type TiebreakerMethod = 'goal_difference' | 'goals_for' | 'head_to_head';

export interface StandingsRow {
  teamId: number;
  teamName: string;
  position: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: string | null;
}

export interface H2HRecord {
  points: number;
  goalDifference: number;
  goalsFor: number;
}

export interface H2HMatrix {
  [teamId: number]: {
    [opponentId: number]: H2HRecord;
  };
}

export interface LeagueConfig {
  tiebreakerOrder: string; // comma-separated: "head_to_head,goal_difference,goals_for"
}

/**
 * Sorts standings rows using a tiebreaker chain.
 * Does not assign positions - just sorts.
 */
export function applyTiebreakers(
  rows: StandingsRow[],
  chain: TiebreakerMethod[],
  h2hMatrix?: H2HMatrix
): StandingsRow[] {
  // TODO: Implement in GREEN phase
  throw new Error('Not implemented');
}

/**
 * Calculates and sorts standings, assigning positions.
 */
export function calculateStandings(
  rows: StandingsRow[],
  config: LeagueConfig,
  h2hMatrix?: H2HMatrix
): StandingsRow[] {
  // TODO: Implement in GREEN phase
  throw new Error('Not implemented');
}
