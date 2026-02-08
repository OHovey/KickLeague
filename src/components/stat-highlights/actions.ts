'use server';

import { isDatabaseConfigured } from '@/db/connection';
import { getLeagueBySlug } from '@/lib/standings/queries';
import {
  getTopScorer,
  getBiggestUpset,
  getFormTeam,
  type TopScorerResult,
  type BiggestUpsetResult,
  type FormTeamResult,
} from '@/lib/stats/queries';
import { getLocale } from 'next-intl/server';
import { getLocalizedTeamNames } from '@/lib/teams/translations';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface StatHighlightsResult {
  topScorer: TopScorerResult | null;
  biggestUpset: BiggestUpsetResult | null;
  formTeam: FormTeamResult | null;
  error?: 'database_not_configured' | 'league_not_found';
}

// ─── Server Action ──────────────────────────────────────────────────────────

/**
 * Fetch all three stat highlights for a league.
 * Resolves the league by slug, then calls all three queries in parallel.
 * Individual query failures are gracefully handled (set to null).
 */
export async function fetchStatHighlights(
  leagueSlug: string
): Promise<StatHighlightsResult> {
  if (!isDatabaseConfigured()) {
    return {
      topScorer: null,
      biggestUpset: null,
      formTeam: null,
      error: 'database_not_configured',
    };
  }

  const league = await getLeagueBySlug(leagueSlug);
  if (!league) {
    return {
      topScorer: null,
      biggestUpset: null,
      formTeam: null,
      error: 'league_not_found',
    };
  }

  const [topScorerResult, biggestUpsetResult, formTeamResult] =
    await Promise.allSettled([
      getTopScorer(league.id, league.currentSeason),
      getBiggestUpset(league.id, league.currentSeason),
      getFormTeam(league.id, league.currentSeason),
    ]);

  const topScorer =
    topScorerResult.status === 'fulfilled' ? topScorerResult.value : null;
  const biggestUpset =
    biggestUpsetResult.status === 'fulfilled'
      ? biggestUpsetResult.value
      : null;
  const formTeam =
    formTeamResult.status === 'fulfilled' ? formTeamResult.value : null;

  // Localize team names across all stat highlights
  const locale = await getLocale();
  const teamIds: number[] = [];
  const englishNames = new Map<number, string>();

  if (topScorer) {
    teamIds.push(topScorer.teamId);
    englishNames.set(topScorer.teamId, topScorer.teamName);
  }
  if (biggestUpset) {
    teamIds.push(biggestUpset.homeTeamId, biggestUpset.awayTeamId);
    englishNames.set(biggestUpset.homeTeamId, biggestUpset.homeTeamName);
    englishNames.set(biggestUpset.awayTeamId, biggestUpset.awayTeamName);
  }
  if (formTeam) {
    teamIds.push(formTeam.teamId);
    englishNames.set(formTeam.teamId, formTeam.teamName);
  }

  const localizedNames = await getLocalizedTeamNames(teamIds, locale, englishNames);

  return {
    topScorer: topScorer
      ? { ...topScorer, teamName: localizedNames.get(topScorer.teamId) ?? topScorer.teamName }
      : null,
    biggestUpset: biggestUpset
      ? {
          ...biggestUpset,
          homeTeamName: localizedNames.get(biggestUpset.homeTeamId) ?? biggestUpset.homeTeamName,
          awayTeamName: localizedNames.get(biggestUpset.awayTeamId) ?? biggestUpset.awayTeamName,
        }
      : null,
    formTeam: formTeam
      ? { ...formTeam, teamName: localizedNames.get(formTeam.teamId) ?? formTeam.teamName }
      : null,
  };
}
