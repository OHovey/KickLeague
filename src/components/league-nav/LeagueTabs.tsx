'use client';

import * as Tabs from '@radix-ui/react-tabs';
import { clsx } from 'clsx';
import { useLeague } from '@/lib/hooks/use-league';
import { LEAGUE_THEMES, type League } from '@/lib/themes/league-themes';

export function LeagueTabs() {
  const { league, setLeague, leagues } = useLeague();

  return (
    <Tabs.Root
      value={league}
      onValueChange={(value) => setLeague(value as League)}
      className="w-full"
    >
      <Tabs.List className="flex gap-1 rounded-lg bg-white/10 p-1 backdrop-blur-sm">
        {leagues.map((leagueSlug) => {
          const theme = LEAGUE_THEMES[leagueSlug];
          const isSelected = league === leagueSlug;

          return (
            <Tabs.Trigger
              key={leagueSlug}
              value={leagueSlug}
              className={clsx(
                'flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-white/20',
                isSelected
                  ? 'bg-white/20 text-white shadow-sm'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              )}
            >
              {theme.name}
            </Tabs.Trigger>
          );
        })}
      </Tabs.List>
    </Tabs.Root>
  );
}
