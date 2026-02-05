'use client';

import * as Tabs from '@radix-ui/react-tabs';
import { parseAsStringEnum, useQueryState } from 'nuqs';
import { clsx } from 'clsx';
import { MatchListClient } from './MatchListClient';

const TAB_VALUES = ['results', 'fixtures'] as const;
type TabValue = (typeof TAB_VALUES)[number];

interface ResultsFixturesTabsProps {
  league: string;
}

export function ResultsFixturesTabs({ league }: ResultsFixturesTabsProps) {
  const [tab, setTab] = useQueryState(
    'tab',
    parseAsStringEnum([...TAB_VALUES]).withDefault('results')
  );

  return (
    <div className="space-y-6">
      <Tabs.Root
        value={tab}
        onValueChange={(value) => setTab(value as TabValue)}
        className="w-full"
      >
        <Tabs.List className="flex gap-1 rounded-lg bg-white/10 p-1 backdrop-blur-sm">
          <Tabs.Trigger
            value="results"
            className={clsx(
              'flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-white/20',
              tab === 'results'
                ? 'bg-white/20 text-white shadow-sm'
                : 'text-white/70 hover:bg-white/10 hover:text-white'
            )}
          >
            Results
          </Tabs.Trigger>
          <Tabs.Trigger
            value="fixtures"
            className={clsx(
              'flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-white/20',
              tab === 'fixtures'
                ? 'bg-white/20 text-white shadow-sm'
                : 'text-white/70 hover:bg-white/10 hover:text-white'
            )}
          >
            Fixtures
          </Tabs.Trigger>
        </Tabs.List>
      </Tabs.Root>

      <MatchListClient league={league} tab={tab} />
    </div>
  );
}
