'use client';

import { useTranslations } from 'next-intl';

interface RegionNoteProps {
  filteredCount: number;
  totalCount: number;
  isFallback: boolean;
}

/**
 * Subtle region indicator shown below the odds table when the user sees
 * a subset of bookmakers due to geo-filtering.
 *
 * - filteredCount === totalCount AND not fallback: render null (no note needed)
 * - isFallback: show "Showing bookmakers for your region" (unmapped country, GB default)
 * - Otherwise: show "{filteredCount} of {totalCount} bookmakers shown for your region"
 */
export function RegionNote({
  filteredCount,
  totalCount,
  isFallback,
}: RegionNoteProps) {
  const t = useTranslations('Odds');

  // No note needed when user sees all bookmakers and country is mapped
  if (filteredCount === totalCount && !isFallback) return null;

  // Unmapped country: show generic fallback message
  if (isFallback) {
    return (
      <p className="text-center text-[11px] text-white/30">
        {t('fallbackRegion')}
      </p>
    );
  }

  // Mapped country: show filtered/total count
  return (
    <p className="text-center text-[11px] text-white/30">
      {t('regionBookmakers', {
        shown: filteredCount,
        total: totalCount,
      })}
    </p>
  );
}
