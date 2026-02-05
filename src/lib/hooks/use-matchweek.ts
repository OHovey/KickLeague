'use client';

import { parseAsInteger, useQueryState } from 'nuqs';

/**
 * Hook for managing the ?week= URL parameter.
 * Returns null when no week is selected (meaning "show current/latest").
 * Returns a number when a specific historical matchweek is selected.
 */
export function useMatchweek() {
  const [week, setWeek] = useQueryState('week', parseAsInteger);

  return { week, setWeek };
}
