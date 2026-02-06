'use server';

import {
  getRecentMatches,
  getUpcomingFixtures,
  getKeyEventsForMatches,
  getTeamForm,
  type MatchWithTeams,
  type MatchEvent,
} from '@/lib/matches/queries';
import { getH2HSummary, type H2HSummary } from '@/lib/matches/h2h';
import { getLeagueBySlug } from '@/lib/standings/queries';
import { isDatabaseConfigured } from '@/db/connection';
import { headers } from 'next/headers';
import { isCountryMapped } from '@/lib/geo/bookmaker-availability';

export interface RecentMatchesResult {
  matches: MatchWithTeams[];
  events: Record<number, MatchEvent[]>;
  teamForms: Record<number, string>;
  error?: 'database_not_configured' | 'league_not_found';
}

export interface UpcomingFixturesResult {
  matches: MatchWithTeams[];
  teamForms: Record<number, string>;
  error?: 'database_not_configured' | 'league_not_found';
}

/**
 * Fetch recent finished matches with key events and team forms.
 * Maps are serialized to plain objects for server action serialization.
 */
export async function fetchRecentMatches(
  league: string,
  limit: number = 10
): Promise<RecentMatchesResult> {
  if (!isDatabaseConfigured()) {
    return { matches: [], events: {}, teamForms: {}, error: 'database_not_configured' };
  }

  const leagueRow = await getLeagueBySlug(league);
  if (!leagueRow) {
    return { matches: [], events: {}, teamForms: {}, error: 'league_not_found' };
  }

  const matches = await getRecentMatches(league, limit);

  // Batch fetch key events for all returned fixtures
  const fixtureIds = matches.map((m) => m.id);
  const eventsMap = await getKeyEventsForMatches(fixtureIds);

  // Batch fetch form for all team IDs
  const teamIds = [...new Set(matches.flatMap((m) => [m.homeTeam.id, m.awayTeam.id]))];
  const formMap = await getTeamForm(teamIds, leagueRow.id, leagueRow.currentSeason);

  // Serialize Maps to plain objects
  const events: Record<number, MatchEvent[]> = {};
  for (const [k, v] of eventsMap) {
    events[k] = v;
  }

  const teamForms: Record<number, string> = {};
  for (const [k, v] of formMap) {
    teamForms[k] = v;
  }

  return { matches, events, teamForms };
}

/**
 * Fetch upcoming scheduled fixtures with team forms.
 */
export async function fetchUpcomingFixtures(
  league: string,
  limit: number = 10
): Promise<UpcomingFixturesResult> {
  if (!isDatabaseConfigured()) {
    return { matches: [], teamForms: {}, error: 'database_not_configured' };
  }

  const leagueRow = await getLeagueBySlug(league);
  if (!leagueRow) {
    return { matches: [], teamForms: {}, error: 'league_not_found' };
  }

  const matches = await getUpcomingFixtures(league, limit);

  // Batch fetch form for all team IDs
  const teamIds = [...new Set(matches.flatMap((m) => [m.homeTeam.id, m.awayTeam.id]))];
  const formMap = await getTeamForm(teamIds, leagueRow.id, leagueRow.currentSeason);

  const teamForms: Record<number, string> = {};
  for (const [k, v] of formMap) {
    teamForms[k] = v;
  }

  return { matches, teamForms };
}

/**
 * Fetch H2H summary for two teams (used by expanded card).
 */
export async function fetchH2HSummary(
  team1Id: number,
  team2Id: number
): Promise<H2HSummary> {
  return getH2HSummary(team1Id, team2Id);
}

/**
 * Read geo context from proxy response headers.
 * Returns showBetting flag, country code, and whether the country has a
 * dedicated bookmaker availability entry (vs GB fallback).
 */
export async function getGeoContext(): Promise<{
  showBetting: boolean;
  countryCode: string | null;
  isMapped: boolean;
}> {
  const headerStore = await headers();
  const countryCode = headerStore.get('x-user-country') ?? null;
  const showBetting = headerStore.get('x-show-betting') === '1';
  return {
    showBetting,
    countryCode: countryCode?.toUpperCase() ?? null,
    isMapped: isCountryMapped(countryCode),
  };
}
