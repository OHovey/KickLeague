'use client';

import { useTranslations } from 'next-intl';
import type { Zone, ZoneType } from '@/lib/zones';

interface ZoneLegendProps {
  zones: Zone[];
}

const ZONE_TRANSLATION_KEYS: Record<ZoneType, string> = {
  champions_league: 'championLeague',
  champions_league_qualifying: 'championsLeagueQualifying',
  europa_league: 'europaLeague',
  conference_league: 'conferenceLeague',
  relegation_playoff: 'relegationPlayoff',
  relegation: 'relegation',
};

export function ZoneLegend({ zones }: ZoneLegendProps) {
  const t = useTranslations('LeagueTable');

  if (zones.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 flex flex-wrap gap-4 text-sm">
      {zones.map((zone) => {
        const translationKey = ZONE_TRANSLATION_KEYS[zone.zoneType];
        const label = t(translationKey);
        const positionRange =
          zone.startPosition === zone.endPosition
            ? `${zone.startPosition}`
            : `${zone.startPosition}-${zone.endPosition}`;

        return (
          <div key={`${zone.zoneType}-${zone.startPosition}`} className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-sm"
              style={{ backgroundColor: zone.color }}
              aria-hidden="true"
            />
            <span className="text-white/70">
              {label} ({positionRange})
            </span>
          </div>
        );
      })}
    </div>
  );
}
