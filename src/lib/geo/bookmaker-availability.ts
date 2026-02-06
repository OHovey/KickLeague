/**
 * Country-bookmaker availability config and filtering functions.
 *
 * Maps ISO 3166-1 alpha-2 country codes to the bookmakers licensed to operate
 * in that country, with priority ordering (lower = shown first).
 *
 * Only Tier 1 countries (from compliance.ts) need entries here. All other
 * countries are already blocked by the shouldShowBetting() gate and never
 * reach bookmaker filtering.
 *
 * @see {@link ../geo/compliance.ts} for TIER_1_COUNTRIES
 */

export interface BookmakerEntry {
  bookmakerKey: string;
  priority: number; // lower = shown first (1 = top priority)
}

/**
 * Country -> available bookmakers with priority ordering.
 *
 * Entries are pre-sorted by priority ASC. Ties (same priority) should be
 * sorted alphabetically by bookmakerKey, but all current entries have
 * unique priorities per country.
 *
 * Keys MUST be uppercase ISO 3166-1 alpha-2 codes.
 */
export const BOOKMAKER_AVAILABILITY: Record<string, BookmakerEntry[]> = {
  GB: [
    { bookmakerKey: 'paddypower', priority: 1 },
    { bookmakerKey: 'williamhill', priority: 2 },
    { bookmakerKey: 'coral', priority: 3 },
    { bookmakerKey: 'ladbrokes_uk', priority: 4 },
    { bookmakerKey: 'skybet', priority: 5 },
    { bookmakerKey: 'unibet_uk', priority: 6 },
    { bookmakerKey: 'sport888', priority: 7 },
    { bookmakerKey: 'betfair_sb_uk', priority: 8 },
  ],
  DK: [
    { bookmakerKey: 'betfair_sb_uk', priority: 1 },
    { bookmakerKey: 'unibet_uk', priority: 2 },
  ],
  SE: [
    { bookmakerKey: 'unibet_uk', priority: 1 },
    { bookmakerKey: 'williamhill', priority: 2 },
    { bookmakerKey: 'coral', priority: 3 },
    { bookmakerKey: 'ladbrokes_uk', priority: 4 },
    { bookmakerKey: 'betfair_sb_uk', priority: 5 },
  ],
  FR: [
    { bookmakerKey: 'unibet_uk', priority: 1 },
  ],
  PT: [
    { bookmakerKey: 'betfair_sb_uk', priority: 1 },
  ],
  AT: [
    { bookmakerKey: 'unibet_uk', priority: 1 },
    { bookmakerKey: 'williamhill', priority: 2 },
    { bookmakerKey: 'sport888', priority: 3 },
    { bookmakerKey: 'betfair_sb_uk', priority: 4 },
  ],
  CH: [
    { bookmakerKey: 'unibet_uk', priority: 1 },
    { bookmakerKey: 'williamhill', priority: 2 },
    { bookmakerKey: 'sport888', priority: 3 },
    { bookmakerKey: 'betfair_sb_uk', priority: 4 },
  ],
  DE: [
    { bookmakerKey: 'williamhill', priority: 1 },
    { bookmakerKey: 'betfair_sb_uk', priority: 2 },
  ],
};

/** GB default -- used as fallback for unknown/unmapped countries. */
const GB_DEFAULT = BOOKMAKER_AVAILABILITY['GB'];

/**
 * Get available bookmakers for a country, sorted by priority ASC then
 * alphabetically by key for ties.
 *
 * Falls back to the GB set for null, empty, or unknown country codes.
 */
export function getAvailableBookmakers(
  countryCode: string | null,
): BookmakerEntry[] {
  if (!countryCode) return [...GB_DEFAULT];

  const entries = BOOKMAKER_AVAILABILITY[countryCode.toUpperCase()];
  if (!entries) return [...GB_DEFAULT];

  // Return a sorted copy -- entries are pre-sorted by priority in the config,
  // but we sort at runtime to guarantee correctness if config ordering drifts.
  return [...entries].sort((a, b) =>
    a.priority !== b.priority
      ? a.priority - b.priority
      : a.bookmakerKey.localeCompare(b.bookmakerKey),
  );
}

/**
 * Check whether a country has an explicit entry in the availability config.
 *
 * Returns false for null, empty, or unknown country codes.
 * Used to determine whether to show a "Showing bookmakers for your region"
 * fallback note in the UI.
 */
export function isCountryMapped(countryCode: string | null): boolean {
  if (!countryCode) return false;
  return countryCode.toUpperCase() in BOOKMAKER_AVAILABILITY;
}
