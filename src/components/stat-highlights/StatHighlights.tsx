'use client';

import { useEffect, useState, useTransition } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useLeague } from '@/lib/hooks/use-league';
import { fetchStatHighlights, type StatHighlightsResult } from './actions';
import { StatCard } from './StatCard';
import { LEAGUE_THEMES } from '@/lib/themes/league-themes';
import type { League } from '@/lib/themes/league-themes';
import { getLocalizedOrdinal } from '@/lib/i18n/ordinals';

// ─── Inline SVG Icons ───────────────────────────────────────────────────────

function TrophyIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M4 2h8v5a4 4 0 0 1-8 0V2Z"
        fill="currentColor"
        opacity="0.3"
      />
      <path
        d="M4 2h8v5a4 4 0 0 1-8 0V2ZM4 4H2a2 2 0 0 0 2 2V4ZM12 4h2a2 2 0 0 1-2 2V4ZM6 12h4M8 10v2M5 14h6"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LightningIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M9 1 3 9h4l-1 6 7-8H9l1-6Z"
        fill="currentColor"
        opacity="0.3"
      />
      <path
        d="M9 1 3 9h4l-1 6 7-8H9l1-6Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FlameIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M8 1c0 3-4 5-4 9a4 4 0 0 0 8 0c0-4-4-6-4-9Z"
        fill="currentColor"
        opacity="0.3"
      />
      <path
        d="M8 1c0 3-4 5-4 9a4 4 0 0 0 8 0c0-4-4-6-4-9Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 8c0 1.5-1.5 2.5-1.5 4a1.5 1.5 0 0 0 3 0c0-1.5-1.5-2.5-1.5-4Z"
        fill="currentColor"
        opacity="0.5"
      />
    </svg>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
      {/* Label row */}
      <div className="mb-3 flex items-center gap-2">
        <div className="h-4 w-4 animate-pulse rounded bg-white/10" />
        <div className="h-3 w-20 animate-pulse rounded bg-white/10" />
      </div>
      {/* Primary stat */}
      <div className="h-8 w-28 animate-pulse rounded bg-white/10" />
      {/* Subject */}
      <div className="mt-2 flex items-center gap-2">
        <div className="h-7 w-7 animate-pulse rounded-full bg-white/10" />
        <div className="h-5 w-32 animate-pulse rounded bg-white/10" />
      </div>
      {/* Context */}
      <div className="mt-1 h-4 w-24 animate-pulse rounded bg-white/10" />
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function StatHighlights() {
  const { league } = useLeague();
  const t = useTranslations('StatHighlights');
  const locale = useLocale();
  const [data, setData] = useState<StatHighlightsResult | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const result = await fetchStatHighlights(league);
      setData(result);
    });
  }, [league]);

  const accentColor =
    LEAGUE_THEMES[league as League]?.colors.accent ?? '#00ff87';

  // Loading state: show skeletons
  if (isPending && !data) {
    return (
      <section aria-label={t('leagueHighlights')}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
      </section>
    );
  }

  // Determine winning team logo for biggest upset
  const upset = data?.biggestUpset;
  const upsetWinnerLogo = upset
    ? upset.homeScore > upset.awayScore
      ? upset.homeTeamLogoUrl
      : upset.awayTeamLogoUrl
    : null;

  return (
    <section
      aria-label={t('leagueHighlights')}
      className={isPending ? 'opacity-60 transition-opacity' : ''}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Top Scorer */}
        <StatCard
          label={t('topScorer')}
          icon={<TrophyIcon />}
          primaryStat={
            data?.topScorer ? t('nGoals', { count: data.topScorer.goalCount }) : ''
          }
          subject={data?.topScorer?.playerName ?? ''}
          context={data?.topScorer?.teamName}
          teamLogoUrl={data?.topScorer?.teamLogoUrl}
          accentColor={accentColor}
          isEmpty={!data?.topScorer}
        />

        {/* Biggest Upset */}
        <StatCard
          label={t('biggestUpset')}
          icon={<LightningIcon />}
          primaryStat={
            upset?.matchweek != null ? t('matchweekN', { week: upset.matchweek }) : ''
          }
          subject={
            upset
              ? `${upset.homeTeamName} ${upset.homeScore}-${upset.awayScore} ${upset.awayTeamName}`
              : ''
          }
          context={
            upset
              ? t('positionGapContext', { gap: upset.positionGap })
              : undefined
          }
          teamLogoUrl={upsetWinnerLogo}
          accentColor={accentColor}
          isEmpty={!upset}
        />

        {/* Best Form */}
        <StatCard
          label={t('bestForm')}
          icon={<FlameIcon />}
          primaryStat={data?.formTeam?.form ?? ''}
          subject={data?.formTeam?.teamName ?? ''}
          context={
            data?.formTeam
              ? `${getLocalizedOrdinal(data.formTeam.position, locale)} \u2022 ${t('nPts', { count: data.formTeam.points })}`
              : undefined
          }
          teamLogoUrl={data?.formTeam?.teamLogoUrl}
          accentColor={accentColor}
          isEmpty={!data?.formTeam}
        />
      </div>
    </section>
  );
}
