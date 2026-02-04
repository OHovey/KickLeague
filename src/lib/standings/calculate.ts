// Standings calculation with configurable tiebreakers

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
 * Calculate H2H totals for a team against a set of opponents.
 * For multi-way ties, we only consider matches between the tied teams.
 */
function getH2HTotals(
  teamId: number,
  tiedTeamIds: number[],
  h2hMatrix: H2HMatrix
): { points: number; goalDifference: number; goalsFor: number } {
  let points = 0;
  let goalDifference = 0;
  let goalsFor = 0;

  const teamRecords = h2hMatrix[teamId];
  if (!teamRecords) {
    return { points, goalDifference, goalsFor };
  }

  for (const opponentId of tiedTeamIds) {
    if (opponentId === teamId) continue;
    const record = teamRecords[opponentId];
    if (record) {
      points += record.points;
      goalDifference += record.goalDifference;
      goalsFor += record.goalsFor;
    }
  }

  return { points, goalDifference, goalsFor };
}

/**
 * Compare two teams using a single tiebreaker method.
 * Returns negative if a < b, positive if a > b, 0 if equal.
 */
function compareTiebreaker(
  a: StandingsRow,
  b: StandingsRow,
  method: TiebreakerMethod,
  tiedTeamIds: number[],
  h2hMatrix?: H2HMatrix
): number {
  switch (method) {
    case 'goal_difference':
      return b.goalDifference - a.goalDifference;
    case 'goals_for':
      return b.goalsFor - a.goalsFor;
    case 'head_to_head':
      if (!h2hMatrix) return 0;
      const aH2H = getH2HTotals(a.teamId, tiedTeamIds, h2hMatrix);
      const bH2H = getH2HTotals(b.teamId, tiedTeamIds, h2hMatrix);
      // Compare H2H points first
      if (bH2H.points !== aH2H.points) {
        return bH2H.points - aH2H.points;
      }
      // Then H2H goal difference
      if (bH2H.goalDifference !== aH2H.goalDifference) {
        return bH2H.goalDifference - aH2H.goalDifference;
      }
      // Then H2H goals for
      return bH2H.goalsFor - aH2H.goalsFor;
    default:
      return 0;
  }
}

/**
 * Groups teams by their points value.
 */
function groupByPoints(rows: StandingsRow[]): Map<number, StandingsRow[]> {
  const groups = new Map<number, StandingsRow[]>();
  for (const row of rows) {
    const existing = groups.get(row.points) || [];
    existing.push(row);
    groups.set(row.points, existing);
  }
  return groups;
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
  if (rows.length <= 1) {
    return [...rows];
  }

  // Group by points to identify tied teams
  const pointsGroups = groupByPoints(rows);
  const result: StandingsRow[] = [];

  // Sort point values descending
  const sortedPoints = Array.from(pointsGroups.keys()).sort((a, b) => b - a);

  for (const pts of sortedPoints) {
    const tiedTeams = pointsGroups.get(pts)!;

    if (tiedTeams.length === 1) {
      result.push(tiedTeams[0]);
      continue;
    }

    // Get IDs of all tied teams for H2H calculation
    const tiedTeamIds = tiedTeams.map((t) => t.teamId);

    // Sort tied teams using tiebreaker chain
    const sortedTiedTeams = [...tiedTeams].sort((a, b) => {
      for (const method of chain) {
        const comparison = compareTiebreaker(a, b, method, tiedTeamIds, h2hMatrix);
        if (comparison !== 0) {
          return comparison;
        }
      }
      // Fallback: alphabetical by team name
      return a.teamName.localeCompare(b.teamName);
    });

    result.push(...sortedTiedTeams);
  }

  return result;
}

/**
 * Calculates and sorts standings, assigning positions.
 */
export function calculateStandings(
  rows: StandingsRow[],
  config: LeagueConfig,
  h2hMatrix?: H2HMatrix
): StandingsRow[] {
  if (rows.length === 0) {
    return [];
  }

  // Parse tiebreaker chain from config
  const chain = config.tiebreakerOrder
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0) as TiebreakerMethod[];

  // First sort by points descending
  const sortedByPoints = [...rows].sort((a, b) => b.points - a.points);

  // Then apply tiebreakers
  const sorted = applyTiebreakers(sortedByPoints, chain, h2hMatrix);

  // Assign positions
  return sorted.map((row, index) => ({
    ...row,
    position: index + 1,
  }));
}
