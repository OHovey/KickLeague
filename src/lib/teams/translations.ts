// Team name localisation helpers.
// Resolves locale-specific team names from the team_translations table,
// falling back to the English name when no translation exists.

import { eq, and, inArray } from 'drizzle-orm';
import { getDb, isDatabaseConfigured } from '@/db/connection';
import { teamTranslations } from '@/db/schema';

/**
 * Fetch translated team names for a batch of team IDs in a given locale.
 * Returns a Map of teamId -> translatedName.
 * Teams without a translation row simply won't appear in the map.
 */
export async function getTeamTranslations(
  teamIds: number[],
  locale: string
): Promise<Map<number, string>> {
  const map = new Map<number, string>();

  if (!isDatabaseConfigured() || teamIds.length === 0) {
    return map;
  }

  const rows = await getDb()
    .select({
      teamId: teamTranslations.teamId,
      name: teamTranslations.name,
    })
    .from(teamTranslations)
    .where(
      and(
        inArray(teamTranslations.teamId, teamIds),
        eq(teamTranslations.locale, locale)
      )
    );

  for (const row of rows) {
    map.set(row.teamId, row.name);
  }

  return map;
}

/**
 * Pure function: resolve a single team's display name.
 * Returns the translated name if available, otherwise the English name.
 */
export function getTeamName(
  teamId: number,
  englishName: string,
  translationsMap: Map<number, string>
): string {
  return translationsMap.get(teamId) ?? englishName;
}

/**
 * Convenience function: fetch translations and merge with English fallbacks.
 * If locale is 'en', skips the database query entirely and returns englishNames directly.
 */
export async function getLocalizedTeamNames(
  teamIds: number[],
  locale: string,
  englishNames: Map<number, string>
): Promise<Map<number, string>> {
  // English is the default stored in the teams table -- no translation needed
  if (locale === 'en') {
    return new Map(englishNames);
  }

  const translations = await getTeamTranslations(teamIds, locale);

  // Merge: use translation where available, English fallback otherwise
  const merged = new Map<number, string>();
  for (const [teamId, englishName] of englishNames) {
    merged.set(teamId, translations.get(teamId) ?? englishName);
  }

  return merged;
}
