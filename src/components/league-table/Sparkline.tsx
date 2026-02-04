'use client';

import { memo } from 'react';
import {
  LineChart,
  Line,
  Tooltip,
  ResponsiveContainer,
  YAxis,
} from 'recharts';

export interface SparklineDataPoint {
  matchweek: number;
  position: number;
}

interface SparklineProps {
  data: SparklineDataPoint[];
  width?: number;
  height?: number;
}

/**
 * Convert a number to its ordinal form (1st, 2nd, 3rd, 4th, etc.)
 */
function ordinal(n: number): string {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
}

interface TooltipPayload {
  payload?: SparklineDataPoint;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
}

/**
 * Custom tooltip component for the sparkline
 */
function SparklineTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0 || !payload[0].payload) {
    return null;
  }

  const data = payload[0].payload;

  return (
    <div className="rounded border border-gray-700 bg-gray-900 px-2 py-1 shadow">
      <p className="text-xs text-gray-300">MW {data.matchweek}</p>
      <p className="text-sm font-bold text-white">{ordinal(data.position)}</p>
    </div>
  );
}

/**
 * Sparkline component showing position over time.
 * Y-axis is inverted so that position 1 appears at the top.
 */
export const Sparkline = memo(function Sparkline({
  data,
  width = 120,
  height = 32,
}: SparklineProps) {
  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-xs text-gray-500"
        style={{ width, height }}
      >
        -
      </div>
    );
  }

  return (
    <div style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 2, right: 2, bottom: 2, left: 2 }}
        >
          <YAxis
            reversed={true}
            hide={true}
            domain={[1, 'dataMax']}
          />
          <Tooltip content={<SparklineTooltip />} />
          <Line
            type="monotone"
            dataKey="position"
            stroke="currentColor"
            strokeWidth={1.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
});
