'use client';

import { useLeague } from '@/lib/hooks/use-league';
import { LeagueTableClient } from './LeagueTableClient';

export function LeagueTableWrapper() {
  const { league } = useLeague();
  return <LeagueTableClient league={league} />;
}
