'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useLeague } from '@/lib/hooks/use-league';
import { LEAGUE_THEMES } from '@/lib/themes/league-themes';
import type { League } from '@/lib/themes/league-themes';

// ── Types ──────────────────────────────────────────────────────────────────

interface GoalsByPeriodChartProps {
  data: Array<{ period: string; scored: number; conceded: number }>;
}

interface TooltipPayload {
  dataKey: string;
  name: string;
  value: number;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  label?: string;
  payload?: TooltipPayload[];
}

// ── Tooltip ────────────────────────────────────────────────────────────────

function PeriodTooltip({ active, label, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-lg border border-white/10 bg-gray-900/95 px-3 py-2 shadow-lg backdrop-blur-sm">
      <p className="mb-1 text-xs font-medium text-white/50">{label} min</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2 text-xs">
          <span
            className="inline-block h-2 w-2 rounded-sm"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-white/70">{entry.name}</span>
          <span className="ml-auto font-medium text-white">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────

export function GoalsByPeriodChart({ data }: GoalsByPeriodChartProps) {
  const { league } = useLeague();
  const glowColor = LEAGUE_THEMES[league as League]?.colors.glow ?? '#22c55e';

  if (!data || data.length === 0) {
    return (
      <div className="flex h-[250px] items-center justify-center text-sm text-white/30">
        No goal timing data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="rgba(255,255,255,0.06)"
          vertical={false}
        />
        <XAxis
          dataKey="period"
          tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
          axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
          axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
          tickLine={false}
          width={25}
          allowDecimals={false}
        />
        <Tooltip content={<PeriodTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}
        />
        <Bar dataKey="scored" fill={glowColor} name="Scored" radius={[2, 2, 0, 0]} />
        <Bar dataKey="conceded" fill="#ef4444" name="Conceded" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
