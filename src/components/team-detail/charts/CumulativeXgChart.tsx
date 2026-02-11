'use client';

import { useTranslations } from 'next-intl';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { useLeague } from '@/lib/hooks/use-league';
import { LEAGUE_THEMES } from '@/lib/themes/league-themes';
import type { League } from '@/lib/themes/league-themes';

// ── Types ──────────────────────────────────────────────────────────────────

interface CumulativeXgChartProps {
  data: Array<{
    matchweek: number;
    cumulativeXg: number;
    cumulativeGoals: number;
  }>;
}

interface TooltipPayload {
  dataKey: string;
  name: string;
  value: number;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  label?: number;
  payload?: TooltipPayload[];
  formatMatchweek?: (mw: number) => string;
}

// ── Tooltip ────────────────────────────────────────────────────────────────

function XgTooltip({ active, label, payload, formatMatchweek }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-lg border border-white/10 bg-gray-900/95 px-3 py-2 shadow-lg backdrop-blur-sm">
      <p className="mb-1 text-xs font-medium text-white/50">{formatMatchweek?.(label ?? 0) ?? `MW ${label}`}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2 text-xs">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-white/70">{entry.name}</span>
          <span className="ml-auto font-medium tabular-nums text-white">
            {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────

export function CumulativeXgChart({ data }: CumulativeXgChartProps) {
  const t = useTranslations('Charts');
  const { league } = useLeague();
  const glowColor = LEAGUE_THEMES[league as League]?.colors.glow ?? '#22c55e';

  if (!data || data.length === 0) {
    return (
      <div className="flex h-[250px] items-center justify-center text-sm text-white/30">
        No xG data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={data} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="rgba(255,255,255,0.06)"
          vertical={false}
        />
        <XAxis
          dataKey="matchweek"
          tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
          axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
          axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
          tickLine={false}
          width={30}
        />
        <Tooltip
          content={
            <XgTooltip
              formatMatchweek={(mw) => t('matchweekShort', { week: mw })}
            />
          }
        />
        <Legend
          wrapperStyle={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}
        />
        <Line
          type="monotone"
          dataKey="cumulativeXg"
          stroke="#f59e0b"
          strokeWidth={2}
          strokeDasharray="5 3"
          dot={false}
          activeDot={{ r: 4, fill: '#f59e0b' }}
          name="Expected Goals (xG)"
        />
        <Line
          type="monotone"
          dataKey="cumulativeGoals"
          stroke={glowColor}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: glowColor }}
          name="Actual Goals"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
