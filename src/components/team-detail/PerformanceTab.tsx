'use client';

import { useEffect, useState } from 'react';
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

  // Build home/away comparison stats
  const homeAwayStats = [
    { label: 'Won', home: homeSplit.won, away: awaySplit.won },
    { label: 'Drawn', home: homeSplit.drawn, away: awaySplit.drawn },
    { label: 'Lost', home: homeSplit.lost, away: awaySplit.lost },
    { label: 'Goals For', home: homeSplit.goalsFor, away: awaySplit.goalsFor },
    {
      label: 'Goals Against',
      home: homeSplit.goalsAgainst,
      away: awaySplit.goalsAgainst,
    },
    {
      label: 'Goal Diff',
      home: homeSplit.goalDifference,
      away: awaySplit.goalDifference,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Home/Away Splits */}
      <section className="rounded-xl bg-white/5 p-4">
        <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-white/40">
          Home / Away Splits
        </h3>
        <HomeAwayBars stats={homeAwayStats} />
      </section>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Goals by Period */}
        <section className="rounded-xl bg-white/5 p-4">
          <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-white/40">
            Goals by Period
          </h3>
          <GoalsByPeriodChart data={goalsByPeriod} />
        </section>

        {/* xG Analysis -- conditional on hasXg */}
        {hasXg && (
          <section className="rounded-xl bg-white/5 p-4">
            <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-white/40">
              xG Analysis
            </h3>
            <div className="mb-3 flex gap-3">
              <div className="flex-1 rounded-lg bg-white/5 px-3 py-2">
                <p className="text-xs text-amber-400/70">Expected (xG)</p>
                <p className="text-lg font-bold tabular-nums text-amber-400">
                  {totalXg.toFixed(2)}
                </p>
              </div>
              <div className="flex-1 rounded-lg bg-white/5 px-3 py-2">
                <p className="text-xs text-green-400/70">Actual Goals</p>
                <p className="text-lg font-bold tabular-nums text-green-400">
                  {totalGoals}
                </p>
              </div>
              <div className="flex-1 rounded-lg bg-white/5 px-3 py-2">
                <p className="text-xs text-white/40">Difference</p>
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

      {/* Derived Stats */}
      <div className="grid gap-3 sm:grid-cols-2">
        {/* Clean Sheets */}
        <section className="rounded-xl bg-white/5 p-4">
          <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-white/40">
            Clean Sheets
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
              ? `${Math.round(
                  (cleanSheets.cleanSheets / cleanSheets.totalMatches) * 100
                )}% of matches`
              : 'No matches played'}
          </p>
        </section>

        {/* Scoring First Record */}
        <section className="rounded-xl bg-white/5 p-4">
          <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-white/40">
            Scoring First Record
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/60">Scored First</span>
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
              <span className="text-white/60">Conceded First</span>
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
              <span className="text-white/60">0-0 Draws</span>
              <span className="tabular-nums text-white/70">
                {scoringFirstRecord.noGoals}
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
