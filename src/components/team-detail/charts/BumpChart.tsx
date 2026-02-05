'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

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
}

// ── Helpers ────────────────────────────────────────────────────────────────

function ordinal(n: number): string {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
}

// ── Tooltip ────────────────────────────────────────────────────────────────

function BumpTooltip({ active, label, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  // Sort by position (lower = better = first)
  const sorted = [...payload].sort((a, b) => a.value - b.value);

  return (
    <div className="rounded-lg border border-white/10 bg-gray-900/95 px-3 py-2 shadow-lg backdrop-blur-sm">
      <p className="mb-1 text-xs font-medium text-white/50">MW {label}</p>
      {sorted.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2 text-xs">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-white/70">{entry.dataKey}</span>
          <span className="ml-auto font-medium text-white">
            {ordinal(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────

export function BumpChart({ data, focusTeam, rivalTeams }: BumpChartProps) {
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
        <Tooltip content={<BumpTooltip />} />
        {/* Rival team lines: thin, low opacity */}
        {rivalTeams.map((team) => (
          <Line
            key={team}
            type="monotone"
            dataKey={team}
            stroke="rgba(255,255,255,0.2)"
            strokeWidth={1}
            dot={false}
            activeDot={{ r: 3, fill: 'rgba(255,255,255,0.4)' }}
          />
        ))}
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
