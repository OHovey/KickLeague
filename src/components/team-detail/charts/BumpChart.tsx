'use client';

import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { getLocalizedOrdinal } from '@/lib/i18n/ordinals';

// ── Types ──────────────────────────────────────────────────────────────────

interface BumpChartProps {
  data: Array<{ matchweek: number; [teamName: string]: number }>;
  focusTeam: string;
  rivalTeams: string[];
}

interface TooltipPayload {
  dataKey: string;
  value: number;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  label?: number;
  payload?: TooltipPayload[];
  formatMatchweek?: (mw: number) => string;
  formatOrdinal?: (n: number) => string;
}

// ── Constants ─────────────────────────────────────────────────────────────

const RIVAL_COLORS = [
  '#60a5fa', // blue-400
  '#f472b6', // pink-400
  '#a78bfa', // violet-400
  '#fb923c', // orange-400
  '#2dd4bf', // teal-400
  '#facc15', // yellow-400
];

// ── Tooltip ────────────────────────────────────────────────────────────────

function BumpTooltip({ active, label, payload, formatMatchweek, formatOrdinal }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  // Sort by position (lower = better = first)
  const sorted = [...payload].sort((a, b) => a.value - b.value);

  return (
    <div className="rounded-lg border border-white/10 bg-gray-900/95 px-3 py-2 shadow-lg backdrop-blur-sm">
      <p className="mb-1 text-xs font-medium text-white/50">{formatMatchweek?.(label ?? 0) ?? `MW ${label}`}</p>
      {sorted.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2 text-xs">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-white/70">{entry.dataKey}</span>
          <span className="ml-auto font-medium text-white">
            {formatOrdinal?.(entry.value) ?? entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────

export function BumpChart({ data, focusTeam, rivalTeams }: BumpChartProps) {
  const t = useTranslations('Charts');
  const locale = useLocale();
  if (!data || data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-sm text-white/30">
        No position history available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
        <XAxis
          dataKey="matchweek"
          tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
          axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
          tickLine={false}
        />
        <YAxis
          reversed
          domain={[1, 'dataMax']}
          tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
          axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
          tickLine={false}
          width={30}
        />
        <Tooltip
          content={
            <BumpTooltip
              formatMatchweek={(mw) => t('matchweekShort', { week: mw })}
              formatOrdinal={(n) => getLocalizedOrdinal(n, locale)}
            />
          }
        />
        {/* Rival team lines: distinct colors, semi-transparent */}
        {rivalTeams.map((team, i) => {
          const color = RIVAL_COLORS[i % RIVAL_COLORS.length];
          return (
            <Line
              key={team}
              type="monotone"
              dataKey={team}
              stroke={color}
              strokeWidth={1.5}
              strokeOpacity={0.45}
              dot={false}
              activeDot={{ r: 3, fill: color }}
            />
          );
        })}
        {/* Focus team: thick green line with dots */}
        <Line
          type="monotone"
          dataKey={focusTeam}
          stroke="#22c55e"
          strokeWidth={3}
          dot={{ r: 2, fill: '#22c55e', strokeWidth: 0 }}
          activeDot={{ r: 4, fill: '#22c55e' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
