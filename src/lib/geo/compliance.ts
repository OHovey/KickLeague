import type { GeoContext } from './types';

/**
 * Tier 1 countries — show betting content (no affiliate license needed).
 *
 * ISO 3166-1 alpha-2 codes:
 *   GB — United Kingdom
 *   DK — Denmark
 *   SE — Sweden
 *   FR — France
 *   PT — Portugal
 *   AT — Austria
 *   CH — Switzerland
 *   DE — Germany
 *
 * All other countries are Tier 2 (betting content blocked).
 * This is the SINGLE source of truth for geo-compliance classification.
 */
export const TIER_1_COUNTRIES = new Set<string>([
  'GB', // United Kingdom
  'DK', // Denmark
  'SE', // Sweden
  'FR', // France
  'PT', // Portugal
  'AT', // Austria
  'CH', // Switzerland
  'DE', // Germany
]);

/**
 * Determine whether betting content should be shown for a given country.
 * Returns true only for Tier 1 countries; all others (including null) return false.
 */
export function shouldShowBetting(countryCode: string | null): boolean {
  if (!countryCode) return false;
  return TIER_1_COUNTRIES.has(countryCode.toUpperCase());
}

/**
 * Build a full GeoContext from a raw country code.
 * Normalises the code to uppercase and derives the showBetting flag.
 */
export function getComplianceContext(countryCode: string | null): GeoContext {
  return {
    countryCode: countryCode?.toUpperCase() ?? null,
    showBetting: shouldShowBetting(countryCode),
  };
}
