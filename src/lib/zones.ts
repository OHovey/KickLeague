// Zone color utilities for league table visualization

export type ZoneType =
  | 'champions_league'
  | 'champions_league_qualifying'
  | 'europa_league'
  | 'conference_league'
  | 'relegation_playoff'
  | 'relegation';

export interface Zone {
  zoneType: ZoneType;
  startPosition: number;
  endPosition: number;
  color: string;
}

// Consistent colors for all zone types
export const ZONE_COLORS: Record<ZoneType, string> = {
  champions_league: '#22c55e', // green-500
  champions_league_qualifying: '#86efac', // green-300
  europa_league: '#f97316', // orange-500
  conference_league: '#a855f7', // purple-500
  relegation_playoff: '#fbbf24', // amber-400
  relegation: '#ef4444', // red-500
};

// Human-readable zone labels
export const ZONE_LABELS: Record<ZoneType, string> = {
  champions_league: 'Champions League',
  champions_league_qualifying: 'Champions League Qualifying',
  europa_league: 'Europa League',
  conference_league: 'Conference League',
  relegation_playoff: 'Relegation Playoff',
  relegation: 'Relegation',
};

/**
 * Get the zone for a given position, if any.
 * Returns the zone object if position falls within a zone's range, null otherwise.
 */
export function getZoneForPosition(
  zones: Zone[],
  position: number
): Zone | null {
  for (const zone of zones) {
    if (position >= zone.startPosition && position <= zone.endPosition) {
      return zone;
    }
  }
  return null;
}

/**
 * Get the zone color for a given position.
 * Returns the hex color string if position is in a zone, null otherwise.
 */
export function getZoneColor(zones: Zone[], position: number): string | null {
  const zone = getZoneForPosition(zones, position);
  if (!zone) return null;
  // Use the color stored in zone row, or fall back to ZONE_COLORS constant
  return zone.color || ZONE_COLORS[zone.zoneType] || null;
}
