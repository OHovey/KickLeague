'use client';

// ── Types ──────────────────────────────────────────────────────────────────

interface HomeAwayBarsStat {
  label: string;
  home: number;
  away: number;
}

interface HomeAwayBarsProps {
  stats: HomeAwayBarsStat[];
}

// ── Row Component ──────────────────────────────────────────────────────────

function ComparisonRow({ label, home, away }: HomeAwayBarsStat) {
  const total = home + away;
  const homePercent = total === 0 ? 50 : (home / total) * 100;
  const awayPercent = total === 0 ? 50 : (away / total) * 100;

  const homeBetter = home > away;
  const awayBetter = away > home;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span
          className={`w-10 text-left tabular-nums font-medium ${
            homeBetter ? 'text-white' : 'text-white/50'
          }`}
        >
          {home}
        </span>
        <span className="text-xs text-white/40">{label}</span>
        <span
          className={`w-10 text-right tabular-nums font-medium ${
            awayBetter ? 'text-white' : 'text-white/50'
          }`}
        >
          {away}
        </span>
      </div>
      <div className="flex h-2 gap-0.5 overflow-hidden rounded-full">
        <div
          className="rounded-l-full bg-blue-500 transition-all duration-300"
          style={{ width: `${homePercent}%` }}
        />
        <div
          className="rounded-r-full bg-amber-500 transition-all duration-300"
          style={{ width: `${awayPercent}%` }}
        />
      </div>
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────

export function HomeAwayBars({ stats }: HomeAwayBarsProps) {
  if (!stats || stats.length === 0) {
    return (
      <div className="py-4 text-center text-sm text-white/30">
        No home/away data available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex items-center justify-between text-xs text-white/40">
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
          <span>Home</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span>Away</span>
          <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
        </div>
      </div>
      {/* Bars */}
      {stats.map((stat) => (
        <ComparisonRow key={stat.label} {...stat} />
      ))}
    </div>
  );
}
