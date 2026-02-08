'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { fetchPerformanceData, type PerformanceData } from './actions';
import { GoalsByPeriodChart } from './charts/GoalsByPeriodChart';
import { CumulativeXgChart } from './charts/CumulativeXgChart';
import { HomeAwayBars } from './charts/HomeAwayBars';

// ── Types ──────────────────────────────────────────────────────────────────

interface PerformanceTabProps {
  teamId: number;
  leagueId: number;
  season: string;
  hasXg: boolean;
}

// ── Stat Card ──────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  subtext,
}: {
  label: string;
  value: string | number;
  subtext?: string;
}) {
  return (
    <div className="rounded-lg bg-white/5 px-3 py-2.5">
      <p className="text-xs text-white/40">{label}</p>
      <p className="text-xl font-bold tabular-nums text-white">{value}</p>
      {subtext && <p className="text-xs text-white/30">{subtext}</p>}
    </div>
  );
}

// ── Skeleton ───────────────────────────────────────────────────────────────

function PerformanceSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-[280px] rounded-xl bg-white/5" />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-[290px] rounded-xl bg-white/5" />
        <div className="h-[290px] rounded-xl bg-white/5" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="h-24 rounded-lg bg-white/5" />
        <div className="h-24 rounded-lg bg-white/5" />
      </div>
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────

export function PerformanceTab({
  teamId,
  leagueId,
  season,
  hasXg,
}: PerformanceTabProps) {
  const t = useTranslations('TeamPerformance');
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetchPerformanceData(teamId, leagueId, season).then((result) => {
      if (!cancelled) {
        setData(result);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [teamId, leagueId, season]);

  if (loading || !data) {
    return <PerformanceSkeleton />;
  }

  const {
    homeSplit,
    awaySplit,
    goalsByPeriod,
    cumulativeXg,
    cleanSheets,
    scoringFirstRecord,
    totalXg,
    totalGoals,
  } = data;

  // Check if event-based data is available (requires detailed fixture data)
  const hasGoalsByPeriod = goalsByPeriod.some((p) => p.scored > 0 || p.conceded > 0);
  const hasXgData = cumulativeXg.length > 0 && cumulativeXg.some((d) => d.cumulativeXg > 0);
  const hasScoringFirst =
    scoringFirstRecord.scoredFirst.total > 0 || scoringFirstRecord.concededFirst.total > 0;

  // Build home/away comparison stats
  const homeAwayStats = [
    { label: t('won'), home: homeSplit.won, away: awaySplit.won },
    { label: t('drawn'), home: homeSplit.drawn, away: awaySplit.drawn },
    { label: t('lost'), home: homeSplit.lost, away: awaySplit.lost },
    { label: t('goalsFor'), home: homeSplit.goalsFor, away: awaySplit.goalsFor },
    {
      label: t('goalsAgainst'),
      home: homeSplit.goalsAgainst,
      away: awaySplit.goalsAgainst,
    },
    {
      label: t('goalDiff'),
      home: homeSplit.goalDifference,
      away: awaySplit.goalDifference,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Home/Away Splits */}
      <section className="rounded-xl bg-white/5 p-4">
        <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-white/40">
          {t('homeAwaySplits')}
        </h3>
        <HomeAwayBars stats={homeAwayStats} />
      </section>

      {/* Charts — only show if detailed fixture data is available */}
      {(hasGoalsByPeriod || (hasXg && hasXgData)) && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Goals by Period */}
          {hasGoalsByPeriod && (
            <section className="rounded-xl bg-white/5 p-4">
              <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-white/40">
                {t('goalsByPeriod')}
              </h3>
              <GoalsByPeriodChart data={goalsByPeriod} />
            </section>
          )}

          {/* xG Analysis -- conditional on hasXg AND data existing */}
          {hasXg && hasXgData && (
            <section className="rounded-xl bg-white/5 p-4">
              <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-white/40">
                {t('xgAnalysis')}
              </h3>
              <div className="mb-3 flex gap-3">
                <div className="flex-1 rounded-lg bg-white/5 px-3 py-2">
                  <p className="text-xs text-amber-400/70">{t('expectedXg')}</p>
                  <p className="text-lg font-bold tabular-nums text-amber-400">
                    {totalXg.toFixed(2)}
                  </p>
                </div>
                <div className="flex-1 rounded-lg bg-white/5 px-3 py-2">
                  <p className="text-xs text-green-400/70">{t('actualGoals')}</p>
                  <p className="text-lg font-bold tabular-nums text-green-400">
                    {totalGoals}
                  </p>
                </div>
                <div className="flex-1 rounded-lg bg-white/5 px-3 py-2">
                  <p className="text-xs text-white/40">{t('difference')}</p>
                  <p
                    className={`text-lg font-bold tabular-nums ${
                      totalGoals - totalXg > 0 ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {totalGoals - totalXg > 0 ? '+' : ''}
                    {(totalGoals - totalXg).toFixed(2)}
                  </p>
                </div>
              </div>
              <CumulativeXgChart data={cumulativeXg} />
            </section>
          )}
        </div>
      )}

      {/* Derived Stats */}
      <div className="grid gap-3 sm:grid-cols-2">
        {/* Clean Sheets */}
        <section className="rounded-xl bg-white/5 p-4">
          <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-white/40">
            {t('cleanSheets')}
          </h3>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold tabular-nums text-white">
              {cleanSheets.cleanSheets}
            </span>
            <span className="text-lg text-white/30">
              / {cleanSheets.totalMatches}
            </span>
          </div>
          <p className="mt-1 text-xs text-white/30">
            {cleanSheets.totalMatches > 0
              ? t('percentOfMatches', {
                  percent: Math.round(
                    (cleanSheets.cleanSheets / cleanSheets.totalMatches) * 100
                  ),
                })
              : t('noMatchesPlayed')}
          </p>
        </section>

        {/* Scoring First Record — only show if event data exists */}
        {hasScoringFirst && (
          <section className="rounded-xl bg-white/5 p-4">
            <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-white/40">
              {t('scoringFirstRecord')}
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">{t('scoredFirst')}</span>
                <span className="tabular-nums text-white">
                  <span className="text-green-400">
                    {scoringFirstRecord.scoredFirst.wins}W
                  </span>
                  {' '}
                  <span className="text-gray-400">
                    {scoringFirstRecord.scoredFirst.draws}D
                  </span>
                  {' '}
                  <span className="text-red-400">
                    {scoringFirstRecord.scoredFirst.losses}L
                  </span>
                  <span className="ml-2 text-white/30">
                    ({scoringFirstRecord.scoredFirst.total})
                  </span>
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">{t('concededFirst')}</span>
                <span className="tabular-nums text-white">
                  <span className="text-green-400">
                    {scoringFirstRecord.concededFirst.wins}W
                  </span>
                  {' '}
                  <span className="text-gray-400">
                    {scoringFirstRecord.concededFirst.draws}D
                  </span>
                  {' '}
                  <span className="text-red-400">
                    {scoringFirstRecord.concededFirst.losses}L
                  </span>
                  <span className="ml-2 text-white/30">
                    ({scoringFirstRecord.concededFirst.total})
                  </span>
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">{t('zeroDrews')}</span>
                <span className="tabular-nums text-white/70">
                  {scoringFirstRecord.noGoals}
                </span>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
