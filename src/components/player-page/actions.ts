'use server';

import { isDatabaseConfigured } from '@/db/connection';
import {
  getPlayerBySlug,
  getPlayerSeasonStats,
  getPlayerRecentMatches,
  type PlayerProfile,
  type PlayerSeasonStats,
  type PlayerMatchInvolvement,
} from '@/lib/players/queries';
import { getLocale } from 'next-intl/server';
import { getLocalizedTeamNames } from '@/lib/teams/translations';

// -- Types -------------------------------------------------------------------

export interface PlayerPageData {
  player: PlayerProfile;
  seasonStats: PlayerSeasonStats;
  recentMatches: PlayerMatchInvolvement[];
}

// Re-export types for consumer convenience
export type { PlayerProfile, PlayerSeasonStats, PlayerMatchInvolvement };

// -- Server Action -----------------------------------------------------------

/**
 * Fetch all data needed for a player profile page.
 * Returns null if database is unavailable, player not found, or player
 * has fewer than 5 appearances (thin content guard).
 */
export async function fetchPlayerPageData(
  slug: string
): Promise<PlayerPageData | null> {
  if (!isDatabaseConfigured()) {
    return null;
  }

  const player = await getPlayerBySlug(slug);
  if (!player) {
    return null;
  }

  const [seasonStats, recentMatches] = await Promise.all([
    getPlayerSeasonStats(player.id, player.leagueId, player.currentSeason),
    getPlayerRecentMatches(player.id, player.leagueId, player.currentSeason),
  ]);

  // Localize team names in recent matches
  const locale = await getLocale();
  if (locale !== 'en' && recentMatches.length > 0) {
    const teamNames = new Map<number, string>();
    // We don't have team IDs in match data directly, so we localize the
    // player's own team name at minimum
    teamNames.set(player.teamId, player.teamName);
    const localizedNames = await getLocalizedTeamNames(
      [player.teamId],
      locale,
      teamNames
    );
    const localizedTeamName =
      localizedNames.get(player.teamId) ?? player.teamName;

    return {
      player: { ...player, teamName: localizedTeamName },
      seasonStats,
      recentMatches,
    };
  }

  return { player, seasonStats, recentMatches };
}
