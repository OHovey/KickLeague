import type { MatchStatRow } from './actions';

// ── StatBar ────────────────────────────────────────────────────────────────

interface StatBarProps {
  label: string;
  homeValue: number;
  awayValue: number;
  format?: 'number' | 'percentage' | 'decimal';
}

function StatBar({ label, homeValue, awayValue, format = 'number' }: StatBarProps) {
  const total = homeValue + awayValue;
  const homePercent = total === 0 ? 50 : (homeValue / total) * 100;
  const awayPercent = 100 - homePercent;

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
      {/* Values + label */}
      <div className="flex items-center justify-between text-sm">
        <span className="w-12 text-left tabular-nums font-medium text-white/90">
          {formatValue(homeValue)}
        </span>
        <span className="text-xs text-white/50">{label}</span>
        <span className="w-12 text-right tabular-nums font-medium text-white/90">
          {formatValue(awayValue)}
        </span>
      </div>

      {/* Bars */}
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

interface StatsComparisonProps {
  homeStats: MatchStatRow | null;
  awayStats: MatchStatRow | null;
}

// ── Component ──────────────────────────────────────────────────────────────

export function StatsComparison({ homeStats, awayStats }: StatsComparisonProps) {
  if (!homeStats || !awayStats) {
    return (
      <section className="mt-6 rounded-xl bg-white/5 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Match Stats</h2>
        <p className="text-sm text-white/40">No stats available for this match.</p>
      </section>
    );
  }

  // Build stat entries conditionally
  const statEntries: StatBarProps[] = [
    {
      label: 'Possession',
      homeValue: homeStats.possession ?? 50,
      awayValue: awayStats.possession ?? 50,
      format: 'percentage',
    },
    {
      label: 'Shots',
      homeValue: homeStats.shots ?? 0,
      awayValue: awayStats.shots ?? 0,
    },
    {
      label: 'Shots on Target',
      homeValue: homeStats.shotsOnTarget ?? 0,
      awayValue: awayStats.shotsOnTarget ?? 0,
    },
    {
      label: 'Corners',
      homeValue: homeStats.corners ?? 0,
      awayValue: awayStats.corners ?? 0,
    },
    {
      label: 'Fouls',
      homeValue: homeStats.fouls ?? 0,
      awayValue: awayStats.fouls ?? 0,
    },
    {
      label: 'Offsides',
      homeValue: homeStats.offsides ?? 0,
      awayValue: awayStats.offsides ?? 0,
    },
    {
      label: 'Yellow Cards',
      homeValue: homeStats.yellowCards ?? 0,
      awayValue: awayStats.yellowCards ?? 0,
    },
    {
      label: 'Red Cards',
      homeValue: homeStats.redCards ?? 0,
      awayValue: awayStats.redCards ?? 0,
    },
  ];

  // Add xG only if both teams have it
  if (homeStats.xg !== null && awayStats.xg !== null) {
    statEntries.push({
      label: 'xG',
      homeValue: homeStats.xg,
      awayValue: awayStats.xg,
      format: 'decimal',
    });
  }

  return (
    <section className="mt-6 rounded-xl bg-white/5 p-6">
      <h2 className="mb-4 text-lg font-semibold text-white">Match Stats</h2>
      <div className="space-y-4">
        {statEntries.map((entry) => (
          <StatBar key={entry.label} {...entry} />
        ))}
      </div>
    </section>
  );
}
