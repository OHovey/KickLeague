/**
 * Affiliate program configuration map.
 *
 * Maps bookmaker keys (from The Odds API) to affiliate program metadata.
 * Affiliate IDs are read from environment variables at runtime -- never
 * stored in code or the database.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AffiliateProgram {
  /** Human-readable program name for analytics (e.g. 'entain', 'paddy_power') */
  programName: string;
  /** The query parameter name this program uses for tracking */
  trackingParam: string;
  /** Environment variable name holding the affiliate ID */
  envVar: string;
  /** Bookmaker homepage URL (last-resort fallback) */
  homepage: string;
  /**
   * Optional template for constructing deep links from sid.
   * Use {sid} as placeholder.
   * Not configured initially -- added after affiliate program approval
   * provides bookmaker-specific documentation.
   */
  sidTemplate?: string;
}

// ---------------------------------------------------------------------------
// Config Map
// ---------------------------------------------------------------------------

/**
 * Map from The Odds API bookmaker_key to affiliate program config.
 *
 * Not every bookmaker has an affiliate program. Bookmakers not in this
 * map will use API-provided links (if any) without affiliate tracking,
 * or no link at all.
 *
 * Programs mapped:
 * - Flutter Group: Paddy Power
 * - Entain Partners: Coral, Ladbrokes (shared program)
 * - Kindred Group: Unibet UK
 * - 888: 888sport
 * - William Hill
 */
export const AFFILIATE_CONFIG: Record<string, AffiliateProgram> = {
  // Flutter Group
  paddypower: {
    programName: 'paddy_power',
    trackingParam: 'AFF_ID',
    envVar: 'PADDY_POWER_AFF_ID',
    homepage: 'https://www.paddypower.com/football',
  },

  // Entain Partners (shared program for Coral + Ladbrokes)
  coral: {
    programName: 'entain',
    trackingParam: 'btag',
    envVar: 'ENTAIN_BTAG',
    homepage: 'https://www.coral.co.uk/football',
  },
  ladbrokes_uk: {
    programName: 'entain',
    trackingParam: 'btag',
    envVar: 'ENTAIN_BTAG',
    homepage: 'https://www.ladbrokes.com/football',
  },

  // Kindred Group
  unibet_uk: {
    programName: 'kindred',
    trackingParam: 'utm_source',
    envVar: 'KINDRED_AFF_ID',
    homepage: 'https://www.unibet.co.uk/football',
  },

  // 888
  sport888: {
    programName: '888',
    trackingParam: 'a_aid',
    envVar: '888_AFF_ID',
    homepage: 'https://www.888sport.com/football',
  },

  // William Hill
  williamhill: {
    programName: 'william_hill',
    trackingParam: 'btag',
    envVar: 'WILLIAM_HILL_BTAG',
    homepage: 'https://sports.williamhill.com/betting/en-gb/football',
  },
};

// ---------------------------------------------------------------------------
// Accessors
// ---------------------------------------------------------------------------

/** Get affiliate config for a bookmaker, or undefined if not mapped */
export function getAffiliateConfig(
  bookmakerKey: string,
): AffiliateProgram | undefined {
  return AFFILIATE_CONFIG[bookmakerKey];
}

/** Get the affiliate ID from env vars, or undefined if not set */
export function getAffiliateId(config: AffiliateProgram): string | undefined {
  return process.env[config.envVar] || undefined;
}
