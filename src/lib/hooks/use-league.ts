'use client';

import { parseAsStringEnum, useQueryState } from 'nuqs';
import { LEAGUES } from '@/lib/themes/league-themes';

export function useLeague() {
  const [league, setLeague] = useQueryState(
    'league',
    parseAsStringEnum([...LEAGUES]).withDefault('premier-league')
  );
  return { league, setLeague, leagues: LEAGUES };
}
