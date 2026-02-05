'use client';

import { Suspense } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { parseAsStringEnum, useQueryState } from 'nuqs';
import { clsx } from 'clsx';
import { OverviewTab } from './OverviewTab';
import { SquadTab } from './SquadTab';
import { FixturesTab } from './FixturesTab';

const TAB_VALUES = ['overview', 'performance', 'squad', 'fixtures'] as const;
type TabValue = (typeof TAB_VALUES)[number];

const TAB_LABELS: Record<TabValue, string> = {
  overview: 'Overview',
  performance: 'Performance',
  squad: 'Squad',
  fixtures: 'Fixtures',
};

interface TeamTabsProps {
  teamId: number;
  leagueId: number;
  season: string;
  teamName: string;
  hasXg: boolean;
}

function TeamTabsInner({
  teamId,
  leagueId,
  season,
  teamName,
  hasXg,
}: TeamTabsProps) {
  const [tab, setTab] = useQueryState(
    'tab',
    parseAsStringEnum([...TAB_VALUES]).withDefault('overview')
  );

  return (
    <Tabs.Root
      value={tab}
      onValueChange={(value) => setTab(value as TabValue)}
      className="w-full"
    >
      <Tabs.List className="flex gap-1 overflow-x-auto rounded-lg bg-white/10 p-1 backdrop-blur-sm">
        {TAB_VALUES.map((value) => (
          <Tabs.Trigger
            key={value}
            value={value}
            className={clsx(
              'flex-1 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-white/20',
              tab === value
                ? 'bg-white/20 text-white shadow-sm'
                : 'text-white/70 hover:bg-white/10 hover:text-white'
            )}
          >
            {TAB_LABELS[value]}
          </Tabs.Trigger>
        ))}
      </Tabs.List>

      <Tabs.Content value="overview" className="mt-6">
        <OverviewTab
          teamId={teamId}
          leagueId={leagueId}
          season={season}
          teamName={teamName}
        />
      </Tabs.Content>

      <Tabs.Content value="performance" className="mt-6">
        <div className="rounded-xl bg-white/5 p-6 text-center">
          <p className="text-white/50">Performance analytics coming soon</p>
        </div>
      </Tabs.Content>

      <Tabs.Content value="squad" className="mt-6">
        <SquadTab teamId={teamId} leagueId={leagueId} season={season} />
      </Tabs.Content>

      <Tabs.Content value="fixtures" className="mt-6">
        <FixturesTab teamId={teamId} leagueId={leagueId} season={season} />
      </Tabs.Content>
    </Tabs.Root>
  );
}

export function TeamTabs(props: TeamTabsProps) {
  return (
    <Suspense
      fallback={
        <div className="flex gap-1 rounded-lg bg-white/10 p-1">
          {TAB_VALUES.map((value) => (
            <div
              key={value}
              className="flex-1 rounded-md bg-white/5 px-3 py-2 text-center text-sm text-white/30"
            >
              {TAB_LABELS[value]}
            </div>
          ))}
        </div>
      }
    >
      <TeamTabsInner {...props} />
    </Suspense>
  );
}
