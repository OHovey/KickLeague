'use client';

import { Suspense } from 'react';
import { LeagueTabs } from '@/components/league-nav/LeagueTabs';
import { ThemeBackground } from '@/components/ThemeBackground';
import { Header } from '@/components/header/Header';
import { ResultsFixturesTabs } from '@/components/matches/ResultsFixturesTabs';
import { useLeague } from '@/lib/hooks/use-league';

function MatchesContent() {
  const { league } = useLeague();

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
        <main className="mx-auto max-w-7xl px-4 py-8">
          <h1 className="mb-6 text-2xl font-bold text-white">Matches</h1>
          <ResultsFixturesTabs league={league} />
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
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="h-8 w-32 animate-pulse rounded bg-white/20 mb-6" />
        <div className="flex gap-1 rounded-lg bg-white/10 p-1 mb-6">
          <div className="h-9 flex-1 animate-pulse rounded-md bg-white/10" />
          <div className="h-9 flex-1 animate-pulse rounded-md bg-white/10" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-white/5" />
          ))}
        </div>
      </main>
    </div>
  );
}

export default function MatchesPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <MatchesContent />
    </Suspense>
  );
}
