/**
 * Mapping from internal league slugs to The Odds API sport keys.
 *
 * The Odds API uses sport keys like 'soccer_epl' to identify leagues.
 * Our internal system uses URL-friendly slugs like 'premier-league'.
 *
 * These keys are confirmed from The Odds API documentation.
 * Use fetchSportsKeys() in client.ts to discover all available keys at runtime.
 */

export const SPORT_KEY_MAP: Record<string, string> = {
  'premier-league': 'soccer_epl',
  'la-liga': 'soccer_spain_la_liga',
  'bundesliga': 'soccer_germany_bundesliga',
  'serie-a': 'soccer_italy_serie_a',
  'ligue-1': 'soccer_france_ligue_one',
};

/**
 * Get the Odds API sport key for a given internal league slug.
 * Returns undefined if the league is not mapped.
 */
export function getSportKey(leagueSlug: string): string | undefined {
  return SPORT_KEY_MAP[leagueSlug];
}
