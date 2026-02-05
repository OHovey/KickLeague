// Head-to-head query and summary calculation

import { eq, and, or, desc } from 'drizzle-orm';
import { getDb, isDatabaseConfigured } from '@/db/connection';
import { fixtures } from '@/db/schema';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface H2HMeeting {
  id: number;
  kickoff: Date;
  homeTeamId: number;
  awayTeamId: number;
  homeScore: number | null;
  awayScore: number | null;
}

export interface H2HSummary {
  team1Wins: number;
  team2Wins: number;
  draws: number;
  meetings: H2HMeeting[];
}

// ─── Queries ────────────────────────────────────────────────────────────────

/**
 * Fetch the last N head-to-head meetings between two teams.
 * Only includes finished matches, ordered by most recent first.
 */
export async function getH2HMeetings(
  team1Id: number,
  team2Id: number,
  limit: number = 5
): Promise<H2HMeeting[]> {
  if (!isDatabaseConfigured()) return [];

  const rows = await getDb()
    .select({
      id: fixtures.id,
      kickoff: fixtures.kickoff,
      homeTeamId: fixtures.homeTeamId,
      awayTeamId: fixtures.awayTeamId,
      homeScore: fixtures.homeScore,
      awayScore: fixtures.awayScore,
    })
    .from(fixtures)
    .where(
      and(
        eq(fixtures.status, 'finished'),
        or(
          and(
            eq(fixtures.homeTeamId, team1Id),
            eq(fixtures.awayTeamId, team2Id)
          ),
          and(
            eq(fixtures.homeTeamId, team2Id),
            eq(fixtures.awayTeamId, team1Id)
          )
        )
      )
    )
    .orderBy(desc(fixtures.kickoff))
    .limit(limit);

  return rows;
}

/**
 * Get H2H summary stats from the last 10 meetings between two teams.
 * Computes wins for each team and draws.
 */
export async function getH2HSummary(
  team1Id: number,
  team2Id: number
): Promise<H2HSummary> {
  const meetings = await getH2HMeetings(team1Id, team2Id, 10);

  let team1Wins = 0;
  let team2Wins = 0;
  let draws = 0;

  for (const meeting of meetings) {
    if (meeting.homeScore === null || meeting.awayScore === null) continue;

    // Determine the winner relative to team1/team2
    const team1IsHome = meeting.homeTeamId === team1Id;
    const team1Score = team1IsHome ? meeting.homeScore : meeting.awayScore;
    const team2Score = team1IsHome ? meeting.awayScore : meeting.homeScore;

    if (team1Score > team2Score) {
      team1Wins++;
    } else if (team2Score > team1Score) {
      team2Wins++;
    } else {
      draws++;
    }
  }

  return { team1Wins, team2Wins, draws, meetings };
}
