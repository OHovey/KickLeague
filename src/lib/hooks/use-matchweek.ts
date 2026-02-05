'use client';

import { parseAsInteger, useQueryState } from 'nuqs';

export function useMatchweek(latestMatchweek: number) {
  const [week, setWeek] = useQueryState(
    'week',
    parseAsInteger.withDefault(latestMatchweek)
  );

  const isHistorical = week !== latestMatchweek;

  return { week, setWeek, isHistorical };
}
