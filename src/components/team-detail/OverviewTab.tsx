'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { fetchOverviewData, type OverviewData } from './actions';
import { BumpChart } from './charts/BumpChart';
import { CumulativePointsChart } from './charts/CumulativePointsChart';
import { FormBadges } from '@/components/league-table/FormBadges';

// ── Types ──────────────────────────────────────────────────────────────────

interface OverviewTabProps {
  teamId: number;
  leagueId: number;
  season: string;
  teamName: string;
}

// ── Stat Card ──────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color?: 'green' | 'red' | 'amber' | 'neutral';
}) {
  const colorClasses = {
    green: 'text-emerald-400',
    red: 'text-red-400',
    amber: 'text-amber-400',
    neutral: 'text-white',
  };
  const borderClasses = {
    green: 'border-emerald-500/20',
    red: 'border-red-500/20',
    amber: 'border-amber-500/20',
    neutral: 'border-white/5',
  };
  const c = color ?? 'neutral';

  return (
    <div className={`rounded-lg border bg-white/5 px-3 py-2.5 ${borderClasses[c]}`}>
      <p className="text-xs text-white/40">{label}</p>
      <p className={`text-xl font-bold tabular-nums ${colorClasses[c]}`}>{value}</p>
    </div>
  );
}

// ── Skeleton ───────────────────────────────────────────────────────────────

function OverviewSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Summary grid skeleton */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-9">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="h-16 rounded-lg bg-white/5" />
        ))}
      </div>
      {/* Chart skeletons */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-[340px] rounded-xl bg-white/5" />
        <div className="h-[290px] rounded-xl bg-white/5" />
      </div>
      <div className="h-12 rounded-lg bg-white/5" />
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────

export function OverviewTab({
  teamId,
  leagueId,
  season,
  teamName,
}: OverviewTabProps) {
  const t = useTranslations('TeamOverview');
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetchOverviewData(teamId, leagueId, season, teamName).then((result) => {
      if (!cancelled) {
        setData(result);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [teamId, leagueId, season, teamName]);

  if (loading || !data) {
    return <OverviewSkeleton />;
  }

  const { seasonSummary, positionHistory, cumulativePoints, focusTeamName, rivalTeamNames } =
    data;

  return (
    <div className="space-y-6">
      {/* Season Summary */}
      {seasonSummary && (
        <section>
          <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-white/40">
            {t('seasonSummary')}
          </h3>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-9">
            <StatCard label={t('pos')} value={seasonSummary.position} color={seasonSummary.position <= 4 ? 'green' : seasonSummary.position >= 18 ? 'red' : 'neutral'} />
            <StatCard label={t('pts')} value={seasonSummary.points} color="green" />
            <StatCard label={t('p')} value={seasonSummary.played} />
            <StatCard label={t('w')} value={seasonSummary.won} color="green" />
            <StatCard label={t('d')} value={seasonSummary.drawn} color="amber" />
            <StatCard label={t('l')} value={seasonSummary.lost} color="red" />
            <StatCard label={t('gf')} value={seasonSummary.goalsFor} color="green" />
            <StatCard label={t('ga')} value={seasonSummary.goalsAgainst} color="red" />
            <StatCard
              label={t('gd')}
              value={
                seasonSummary.goalDifference > 0
                  ? `+${seasonSummary.goalDifference}`
                  : String(seasonSummary.goalDifference)
              }
              color={seasonSummary.goalDifference > 0 ? 'green' : seasonSummary.goalDifference < 0 ? 'red' : 'amber'}
            />
          </div>
        </section>
      )}

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Position Over Time (Bump Chart) */}
        <section className="rounded-xl bg-white/5 p-4">
          <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-white/40">
            {t('positionOverTime')}
          </h3>
          <BumpChart
            data={positionHistory}
            focusTeam={focusTeamName}
            rivalTeams={rivalTeamNames}
          />
        </section>

        {/* Cumulative Points */}
        <section className="rounded-xl bg-white/5 p-4">
          <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-white/40">
            {t('cumulativePoints')}
          </h3>
          <CumulativePointsChart data={cumulativePoints} />
        </section>
      </div>

      {/* Current Form */}
      {seasonSummary?.form && (
        <section className="rounded-xl bg-white/5 p-4">
          <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-white/40">
            {t('currentForm')}
          </h3>
          <div className="flex items-center gap-3">
            <FormBadges form={seasonSummary.form} />
            <span className="text-xs text-white/30">{t('lastNMatches', { count: seasonSummary.form.length })}</span>
          </div>
        </section>
      )}
    </div>
  );
}
