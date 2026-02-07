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

  return {
    topScorer:
      topScorerResult.status === 'fulfilled' ? topScorerResult.value : null,
    biggestUpset:
      biggestUpsetResult.status === 'fulfilled'
        ? biggestUpsetResult.value
        : null,
    formTeam:
      formTeamResult.status === 'fulfilled' ? formTeamResult.value : null,
  };
}
