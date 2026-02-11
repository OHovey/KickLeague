'use client';

import { Suspense } from 'react';
import { LeagueTabs } from '@/components/league-nav/LeagueTabs';
import { ThemeBackground } from '@/components/ThemeBackground';
import { LeagueTableWrapper } from '@/components/league-table/LeagueTableWrapper';

import { MatchPreviewSection } from '@/components/matches/MatchPreviewSection';
import { StatHighlights } from '@/components/stat-highlights/StatHighlights';
import { AdUnit } from '@/components/ads/AdUnit';
import { AD_SLOTS } from '@/components/ads/ad-config';
import { useLeague } from '@/lib/hooks/use-league';
import { LEAGUE_THEMES } from '@/lib/themes/league-themes';

function TableSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg bg-white/5 backdrop-blur-sm">
      <div className="border-b border-white/10 px-4 py-3">
        <div className="shimmer-loading h-4 w-24 rounded" />
      </div>
      <div className="p-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-3">
            <div className="shimmer-loading h-4 w-8 rounded" />
            <div className="shimmer-loading h-4 flex-1 rounded" />
            <div className="shimmer-loading h-4 w-16 rounded" />
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
        <div className="mx-auto max-w-7xl px-4 pt-6">
          <AdUnit slotId={AD_SLOTS.HOMEPAGE_TOP.slotId} className="my-4" />
          <StatHighlights />
        </div>
        <div className="sticky top-0 z-10 border-b border-white/10 bg-black/20 backdrop-blur-md">
          <div className="mx-auto max-w-7xl px-4 py-4">
            <LeagueTabs />
          </div>
        </div>
        <main className="mx-auto max-w-7xl px-4 py-8 space-y-8">
          <Suspense fallback={<TableSkeleton />}>
            <LeagueTableWrapper />
          </Suspense>
          <AdUnit slotId={AD_SLOTS.HOMEPAGE_BOTTOM.slotId} />
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
                className="shimmer-loading h-9 flex-1 rounded-md"
              />
            ))}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="shimmer-loading h-36 rounded-xl border border-white/10" />
          ))}
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
