'use server';

import { isDatabaseConfigured } from '@/db/connection';
import {
  getLeagueBySlug,
  getStandingsWithZones,
  type StandingsWithZones,
} from '@/lib/standings/queries';
import {
  getTopScorersForLeague,
  getLeagueDescription,
  type TopScorerRow,
  type LeagueDescriptionData,
} from '@/lib/leagues/queries';
import {
  getFormTeam,
  type FormTeamResult,
} from '@/lib/stats/queries';
import {
  getRecentMatches,
  getUpcomingFixtures,
  type MatchWithTeams,
} from '@/lib/matches/queries';
import { getLocale } from 'next-intl/server';
import { getLocalizedTeamNames } from '@/lib/teams/translations';

// ── Types ──────────────────────────────────────────────────────────────────

export interface LeaguePageData {
  league: {
    id: number;
    name: string;
    slug: string;
    currentSeason: string;
    logoUrl: string | null;
    country: string;
  };
  description: LeagueDescriptionData;
  standings: StandingsWithZones;
  topScorers: TopScorerRow[];
  formTeam: FormTeamResult | null;
  recentMatches: MatchWithTeams[];
  upcomingMatches: MatchWithTeams[];
  error?: 'database_not_configured' | 'league_not_found';
}

// ── Server Action ──────────────────────────────────────────────────────────

/**
 * Fetch all data needed for a league landing page.
 * Combines standings, top scorers, form team, recent matches, and upcoming fixtures.
 */
export async function fetchLeaguePageData(
  leagueSlug: string
): Promise<LeaguePageData | null> {
  if (!isDatabaseConfigured()) {
    return {
      league: { id: 0, name: '', slug: leagueSlug, currentSeason: '', logoUrl: null, country: '' },
      description: { description: '', country: '', teamCount: 0, founded: '' },
      standings: { standings: [], zones: [], config: null, league: null, matchweek: null, error: 'database_not_configured' },
      topScorers: [],
      formTeam: null,
      recentMatches: [],
      upcomingMatches: [],
      error: 'database_not_configured',
    };
  }

  const league = await getLeagueBySlug(leagueSlug);
  if (!league) {
    return null;
  }

  const description = getLeagueDescription(leagueSlug);
  if (!description) {
    return null;
  }

  // Fetch all data in parallel
  const [standingsResult, topScorersResult, formTeamResult, recentResult, upcomingResult] =
    await Promise.allSettled([
      getStandingsWithZones(leagueSlug),
      getTopScorersForLeague(league.id, league.currentSeason, 5),
      getFormTeam(league.id, league.currentSeason),
      getRecentMatches(leagueSlug, 5),
      getUpcomingFixtures(leagueSlug, 5),
    ]);

  const standings =
    standingsResult.status === 'fulfilled'
      ? standingsResult.value
      : { standings: [], zones: [], config: null, league: null, matchweek: null } as StandingsWithZones;
  const topScorers =
    topScorersResult.status === 'fulfilled' ? topScorersResult.value : [];
  const formTeam =
    formTeamResult.status === 'fulfilled' ? formTeamResult.value : null;
  const recentMatches =
    recentResult.status === 'fulfilled' ? recentResult.value : [];
  const upcomingMatches =
    upcomingResult.status === 'fulfilled' ? upcomingResult.value : [];

  // Localize team names across all data
  const locale = await getLocale();
  const teamIds: number[] = [];
  const englishNames = new Map<number, string>();

  // Collect from standings
  for (const row of standings.standings) {
    teamIds.push(row.teamId);
    englishNames.set(row.teamId, row.teamName);
  }

  // Collect from top scorers
  for (const scorer of topScorers) {
    teamIds.push(scorer.teamId);
    englishNames.set(scorer.teamId, scorer.teamName);
  }

  // Collect from form team
  if (formTeam) {
    teamIds.push(formTeam.teamId);
    englishNames.set(formTeam.teamId, formTeam.teamName);
  }

  // Collect from matches
  for (const m of recentMatches) {
    teamIds.push(m.homeTeam.id, m.awayTeam.id);
    englishNames.set(m.homeTeam.id, m.homeTeam.name);
    englishNames.set(m.awayTeam.id, m.awayTeam.name);
  }
  for (const m of upcomingMatches) {
    teamIds.push(m.homeTeam.id, m.awayTeam.id);
    englishNames.set(m.homeTeam.id, m.homeTeam.name);
    englishNames.set(m.awayTeam.id, m.awayTeam.name);
  }

  const localizedNames = await getLocalizedTeamNames(
    [...new Set(teamIds)],
    locale,
    englishNames
  );

  // Apply localized names
  const localizedStandings: StandingsWithZones = {
    ...standings,
    standings: standings.standings.map((row) => ({
      ...row,
      teamName: localizedNames.get(row.teamId) ?? row.teamName,
    })),
  };

  const localizedTopScorers = topScorers.map((scorer) => ({
    ...scorer,
    teamName: localizedNames.get(scorer.teamId) ?? scorer.teamName,
  }));

  const localizedFormTeam = formTeam
    ? { ...formTeam, teamName: localizedNames.get(formTeam.teamId) ?? formTeam.teamName }
    : null;

  const localizedRecentMatches = recentMatches.map((m) => ({
    ...m,
    homeTeam: { ...m.homeTeam, name: localizedNames.get(m.homeTeam.id) ?? m.homeTeam.name },
    awayTeam: { ...m.awayTeam, name: localizedNames.get(m.awayTeam.id) ?? m.awayTeam.name },
  }));

  const localizedUpcomingMatches = upcomingMatches.map((m) => ({
    ...m,
    homeTeam: { ...m.homeTeam, name: localizedNames.get(m.homeTeam.id) ?? m.homeTeam.name },
    awayTeam: { ...m.awayTeam, name: localizedNames.get(m.awayTeam.id) ?? m.awayTeam.name },
  }));

  return {
    league: {
      id: league.id,
      name: league.name,
      slug: league.slug,
      currentSeason: league.currentSeason,
      logoUrl: league.logoUrl,
      country: league.country,
    },
    description,
    standings: localizedStandings,
    topScorers: localizedTopScorers,
    formTeam: localizedFormTeam,
    recentMatches: localizedRecentMatches,
    upcomingMatches: localizedUpcomingMatches,
  };
}
