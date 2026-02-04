import type { Zone } from '@/lib/zones';
import { ZONE_LABELS } from '@/lib/zones';

interface ZoneLegendProps {
  zones: Zone[];
}

export function ZoneLegend({ zones }: ZoneLegendProps) {
  if (zones.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 flex flex-wrap gap-4 text-sm">
      {zones.map((zone) => {
        const label = ZONE_LABELS[zone.zoneType];
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
