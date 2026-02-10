'use client';

import { useTranslations } from 'next-intl';
import type { TeamSeasonStats } from './actions';

// ── Comparison Row ─────────────────────────────────────────────────────────

interface ComparisonRowProps {
  label: string;
  homeValue: number;
  awayValue: number;
  format?: 'number' | 'percentage' | 'decimal';
  /** If true, lower value is better (e.g., league position) */
  lowerIsBetter?: boolean;
}

function ComparisonRow({
  label,
  homeValue,
  awayValue,
  format = 'number',
  lowerIsBetter = false,
}: ComparisonRowProps) {
  const total = homeValue + awayValue;
  let homePercent = total === 0 ? 50 : (homeValue / total) * 100;
  let awayPercent = total === 0 ? 50 : (awayValue / total) * 100;

  // For lower-is-better stats, invert the bar widths
  if (lowerIsBetter) {
    const temp = homePercent;
    homePercent = awayPercent;
    awayPercent = temp;
  }

  // Determine which side is "better"
  const homeBetter = lowerIsBetter
    ? homeValue < awayValue
    : homeValue > awayValue;
  const awayBetter = lowerIsBetter
    ? awayValue < homeValue
    : awayValue > homeValue;

  function formatValue(val: number): string {
    switch (format) {
      case 'percentage':
        return `${Math.round(val)}%`;
      case 'decimal':
        return val.toFixed(1);
      default:
        return String(val);
    }
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span
          className={`w-12 text-left tabular-nums font-medium ${
            homeBetter ? 'text-white' : 'text-white/50'
          }`}
        >
          {formatValue(homeValue)}
        </span>
        <span className="text-xs text-white/50">{label}</span>
        <span
          className={`w-12 text-right tabular-nums font-medium ${
            awayBetter ? 'text-white' : 'text-white/50'
          }`}
        >
          {formatValue(awayValue)}
        </span>
      </div>
      <div className="flex h-2 gap-0.5 overflow-hidden rounded-full">
        <div
          className="rounded-l-full bg-blue-500 transition-all duration-300"
          style={{ width: `${homePercent}%` }}
        />
        <div
          className="rounded-r-full bg-red-500 transition-all duration-300"
          style={{ width: `${awayPercent}%` }}
        />
      </div>
    </div>
  );
}

// ── Props ──────────────────────────────────────────────────────────────────

interface ComparativeStatsProps {
  homeTeamStats: TeamSeasonStats | null;
  awayTeamStats: TeamSeasonStats | null;
  homeTeamName: string;
  awayTeamName: string;
}

// ── Component ──────────────────────────────────────────────────────────────

export function ComparativeStats({
  homeTeamStats,
  awayTeamStats,
  homeTeamName,
  awayTeamName,
}: ComparativeStatsProps) {
  const t = useTranslations('MatchDetail');

  if (!homeTeamStats || !awayTeamStats) {
    return (
      <section className="glow-card rounded-xl bg-white/5 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">
          {t('seasonComparison')}
        </h2>
        <p className="text-sm text-white/40">
          {t('seasonStatsNotAvailable')}
        </p>
      </section>
    );
  }

  const homeGPG =
    homeTeamStats.played > 0
      ? homeTeamStats.goalsFor / homeTeamStats.played
      : 0;
  const awayGPG =
    awayTeamStats.played > 0
      ? awayTeamStats.goalsFor / awayTeamStats.played
      : 0;

  const homeGCPG =
    homeTeamStats.played > 0
      ? homeTeamStats.goalsAgainst / homeTeamStats.played
      : 0;
  const awayGCPG =
    awayTeamStats.played > 0
      ? awayTeamStats.goalsAgainst / awayTeamStats.played
      : 0;

  const homeWinRate =
    homeTeamStats.played > 0
      ? (homeTeamStats.won / homeTeamStats.played) * 100
      : 0;
  const awayWinRate =
    awayTeamStats.played > 0
      ? (awayTeamStats.won / awayTeamStats.played) * 100
      : 0;

  return (
    <section className="glow-card rounded-xl bg-white/5 p-6">
      <h2 className="mb-2 text-lg font-semibold text-white">
        {t('seasonComparison')}
      </h2>
      <p className="mb-4 text-xs text-white/40">
        {homeTeamName} vs {awayTeamName}
      </p>
      <div className="space-y-4">
        <ComparisonRow
          label={t('leaguePosition')}
          homeValue={homeTeamStats.position}
          awayValue={awayTeamStats.position}
          lowerIsBetter
        />
        <ComparisonRow
          label={t('pointsLabel')}
          homeValue={homeTeamStats.points}
          awayValue={awayTeamStats.points}
        />
        <ComparisonRow
          label={t('goalsPerGame')}
          homeValue={homeGPG}
          awayValue={awayGPG}
          format="decimal"
        />
        <ComparisonRow
          label={t('concededPerGame')}
          homeValue={homeGCPG}
          awayValue={awayGCPG}
          format="decimal"
          lowerIsBetter
        />
        <ComparisonRow
          label={t('winRate')}
          homeValue={homeWinRate}
          awayValue={awayWinRate}
          format="percentage"
        />
      </div>
    </section>
  );
}
