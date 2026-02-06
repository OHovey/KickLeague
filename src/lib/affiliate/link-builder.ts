/**
 * Affiliate link builder -- pure function implementing the priority chain.
 *
 * Priority chain (LINK-01):
 * 1. API-provided deep link (e.g. Sky Bet betslip links)
 * 2. Sid-constructed deep link using bookmaker's URL template (when configured)
 * 3. Bookmaker homepage fallback
 *
 * After determining the base URL, appends the affiliate tracking parameter
 * if an affiliate ID is configured via environment variable (AFCFG-03).
 *
 * This function is called at data ingestion time (seed script, odds cron)
 * to pre-compute enriched links before storing in the database.
 */

import { getAffiliateConfig, getAffiliateId } from './config';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BuildLinkInput {
  /** Bookmaker key from The Odds API (e.g. 'paddypower', 'coral') */
  bookmakerKey: string;
  /** API-provided deep link, or null if not available */
  apiLink: string | null;
  /** Sid from The Odds API, or null if not available */
  sid: string | null;
}

export interface BuildLinkResult {
  /** The best available URL for this bookmaker, or null if none possible */
  url: string | null;
  /** Affiliate program name for analytics, or null if unknown bookmaker */
  affiliateProgram: string | null;
}

// ---------------------------------------------------------------------------
// Link Builder
// ---------------------------------------------------------------------------

/**
 * Build the best available affiliate-enriched link for a bookmaker outcome.
 *
 * If no affiliate config exists for this bookmaker, returns the API link as-is.
 * If affiliate config exists but ID is not set, returns the link without
 * tracking parameter (graceful degradation per AFCFG-03).
 */
export function buildAffiliateLink(input: BuildLinkInput): BuildLinkResult {
  const config = getAffiliateConfig(input.bookmakerKey);

  // Step 1: Determine base URL via priority chain
  let baseUrl: string | null = null;

  if (input.apiLink) {
    // Priority 1: API-provided deep link
    baseUrl = input.apiLink;
  } else if (input.sid && config?.sidTemplate) {
    // Priority 2: Construct from sid template
    baseUrl = config.sidTemplate.replace('{sid}', input.sid);
  } else if (config?.homepage) {
    // Priority 3: Homepage fallback
    baseUrl = config.homepage;
  }

  // No config AND no API link = no link possible
  if (!baseUrl) {
    return { url: null, affiliateProgram: null };
  }

  // Step 2: Append affiliate tracking param if configured
  if (config) {
    const affiliateId = getAffiliateId(config);
    if (affiliateId) {
      baseUrl = appendTrackingParam(baseUrl, config.trackingParam, affiliateId);
    }
    return { url: baseUrl, affiliateProgram: config.programName };
  }

  // Bookmaker not in affiliate config -- return API link as-is
  return { url: baseUrl, affiliateProgram: null };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Append a tracking query parameter to a URL.
 * Handles both URLs with existing query strings and those without.
 */
function appendTrackingParam(
  url: string,
  param: string,
  value: string,
): string {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}${param}=${encodeURIComponent(value)}`;
}
