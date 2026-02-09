/**
 * Google AdSense configuration.
 *
 * All values are read from environment variables so the app works
 * without any AdSense credentials (components render nothing when
 * the publisher ID is missing).
 */

export const ADSENSE_PUBLISHER_ID =
  process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID ?? "";

export interface AdSlotConfig {
  slotId: string;
  format: string;
}

/**
 * Named ad-slot definitions.
 * Each slot reads its ID from a dedicated env var and falls back
 * to an empty string (the AdUnit component skips rendering when
 * the slot ID is empty).
 */
export const AD_SLOTS = {
  HOMEPAGE_TOP: {
    slotId: process.env.NEXT_PUBLIC_AD_SLOT_HOMEPAGE_TOP ?? "",
    format: "auto",
  },
  HOMEPAGE_BOTTOM: {
    slotId: process.env.NEXT_PUBLIC_AD_SLOT_HOMEPAGE_BOTTOM ?? "",
    format: "auto",
  },
  MATCHES_TOP: {
    slotId: process.env.NEXT_PUBLIC_AD_SLOT_MATCHES_TOP ?? "",
    format: "auto",
  },
  MATCHES_BOTTOM: {
    slotId: process.env.NEXT_PUBLIC_AD_SLOT_MATCHES_BOTTOM ?? "",
    format: "auto",
  },
  MATCH_DETAIL_1: {
    slotId: process.env.NEXT_PUBLIC_AD_SLOT_MATCH_DETAIL_1 ?? "",
    format: "auto",
  },
  MATCH_DETAIL_2: {
    slotId: process.env.NEXT_PUBLIC_AD_SLOT_MATCH_DETAIL_2 ?? "",
    format: "auto",
  },
  TEAM_DETAIL_1: {
    slotId: process.env.NEXT_PUBLIC_AD_SLOT_TEAM_DETAIL_1 ?? "",
    format: "auto",
  },
  TEAM_DETAIL_2: {
    slotId: process.env.NEXT_PUBLIC_AD_SLOT_TEAM_DETAIL_2 ?? "",
    format: "auto",
  },
} as const satisfies Record<string, AdSlotConfig>;
