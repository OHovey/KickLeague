'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

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
}

// ── Tooltip ────────────────────────────────────────────────────────────────

function PointsTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0 || !payload[0].payload) {
    return null;
  }

  const data = payload[0].payload;

  return (
    <div className="rounded-lg border border-white/10 bg-gray-900/95 px-3 py-2 shadow-lg backdrop-blur-sm">
      <p className="text-xs text-white/50">MW {data.matchweek}</p>
      <p className="text-sm font-bold text-white">{data.points} pts</p>
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────

export function CumulativePointsChart({ data }: CumulativePointsChartProps) {
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
          <linearGradient id="pointsFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#22c55e" stopOpacity={0.02} />
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
        <Tooltip content={<PointsTooltip />} />
        <Area
          type="monotone"
          dataKey="points"
          stroke="#22c55e"
          strokeWidth={2}
          fill="url(#pointsFill)"
          dot={false}
          activeDot={{ r: 4, fill: '#22c55e' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
