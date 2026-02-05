'use client';

import { Suspense } from 'react';
import { LeagueTabs } from '@/components/league-nav/LeagueTabs';
import { ThemeBackground } from '@/components/ThemeBackground';
import { LeagueTableWrapper } from '@/components/league-table/LeagueTableWrapper';
import { Header } from '@/components/header/Header';
import { MatchPreviewSection } from '@/components/matches/MatchPreviewSection';
import { useLeague } from '@/lib/hooks/use-league';
import { LEAGUE_THEMES } from '@/lib/themes/league-themes';

function TableSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg bg-white/5 backdrop-blur-sm">
      <div className="border-b border-white/10 px-4 py-3">
        <div className="h-4 w-24 animate-pulse rounded bg-white/10" />
      </div>
      <div className="p-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-3">
            <div className="h-4 w-8 animate-pulse rounded bg-white/10" />
            <div className="h-4 flex-1 animate-pulse rounded bg-white/10" />
            <div className="h-4 w-16 animate-pulse rounded bg-white/10" />
          </div>
        ))}
      </div>
    </div>
  );
}

function HomeContent() {
  const { league } = useLeague();
  const currentTheme = LEAGUE_THEMES[league];

  return (
    <>
      <ThemeBackground theme={league} />
      <div className="min-h-screen">
        <Header />
        <div className="sticky top-[49px] z-10 border-b border-white/10 bg-black/20 backdrop-blur-md">
          <div className="mx-auto max-w-7xl px-4 py-4">
            <LeagueTabs />
          </div>
        </div>
        <main className="mx-auto max-w-7xl px-4 py-8 space-y-8">
          <Suspense fallback={<TableSkeleton />}>
            <LeagueTableWrapper />
          </Suspense>
          <MatchPreviewSection league={league} />
        </main>
      </div>
    </>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#3d195b] to-[#1a0a2e]">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-black/20 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex gap-1 rounded-lg bg-white/10 p-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-9 flex-1 animate-pulse rounded-md bg-white/10"
              />
            ))}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-12">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="h-10 w-48 animate-pulse rounded bg-white/20" />
          <div className="h-6 w-64 animate-pulse rounded bg-white/10" />
        </div>
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <HomeContent />
    </Suspense>
  );
}
