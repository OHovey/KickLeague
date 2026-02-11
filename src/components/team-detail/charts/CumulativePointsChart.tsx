'use client';

import { useTranslations } from 'next-intl';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { useLeague } from '@/lib/hooks/use-league';
import { LEAGUE_THEMES } from '@/lib/themes/league-themes';
import type { League } from '@/lib/themes/league-themes';

// ── Types ──────────────────────────────────────────────────────────────────

interface CumulativePointsChartProps {
  data: Array<{ matchweek: number; points: number }>;
}

interface TooltipPayload {
  payload?: { matchweek: number; points: number };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  formatMatchweek?: (mw: number) => string;
  formatPoints?: (count: number) => string;
}

// ── Tooltip ────────────────────────────────────────────────────────────────

function PointsTooltip({ active, payload, formatMatchweek, formatPoints }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0 || !payload[0].payload) {
    return null;
  }

  const data = payload[0].payload;

  return (
    <div className="rounded-lg border border-white/10 bg-gray-900/95 px-3 py-2 shadow-lg backdrop-blur-sm">
      <p className="text-xs text-white/50">{formatMatchweek?.(data.matchweek) ?? `MW ${data.matchweek}`}</p>
      <p className="text-sm font-bold text-white">{formatPoints?.(data.points) ?? `${data.points} pts`}</p>
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────

export function CumulativePointsChart({ data }: CumulativePointsChartProps) {
  const t = useTranslations('Charts');
  const { league } = useLeague();
  const glowColor = LEAGUE_THEMES[league as League]?.colors.glow ?? '#22c55e';

  // Unique gradient ID per league to avoid conflicts
  const gradientId = `pointsFill-${league}`;

  if (!data || data.length === 0) {
    return (
      <div className="flex h-[250px] items-center justify-center text-sm text-white/30">
        No points data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <AreaChart data={data} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={glowColor} stopOpacity={0.3} />
            <stop offset="100%" stopColor={glowColor} stopOpacity={0.02} />
          </linearGradient>
        </defs>
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
            <PointsTooltip
              formatMatchweek={(mw) => t('matchweekShort', { week: mw })}
              formatPoints={(count) => t('points', { count })}
            />
          }
        />
        <Area
          type="monotone"
          dataKey="points"
          stroke={glowColor}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          dot={false}
          activeDot={{ r: 4, fill: glowColor }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
