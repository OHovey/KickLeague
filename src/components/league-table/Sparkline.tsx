'use client';

import { memo } from 'react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import {
  LineChart,
  Line,
  Tooltip,
  ResponsiveContainer,
  YAxis,
} from 'recharts';
import { getLocalizedOrdinal } from '@/lib/i18n/ordinals';

export interface SparklineDataPoint {
  matchweek: number;
  position: number;
}

interface SparklineProps {
  data: SparklineDataPoint[];
  width?: number;
  height?: number;
}

interface TooltipPayload {
  payload?: SparklineDataPoint;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  formatMatchweek?: (mw: number) => string;
  formatOrdinal?: (n: number) => string;
}

/**
 * Custom tooltip component for the sparkline
 */
function SparklineTooltip({ active, payload, formatMatchweek, formatOrdinal }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0 || !payload[0].payload) {
    return null;
  }

  const data = payload[0].payload;

  return (
    <div className="rounded border border-gray-700 bg-gray-900 px-2 py-1 shadow">
      <p className="text-xs text-gray-300">{formatMatchweek?.(data.matchweek) ?? `MW ${data.matchweek}`}</p>
      <p className="text-sm font-bold text-white">{formatOrdinal?.(data.position) ?? data.position}</p>
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
  const t = useTranslations('Charts');
  const locale = useLocale();

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
          <Tooltip
            content={
              <SparklineTooltip
                formatMatchweek={(mw) => t('matchweekShort', { week: mw })}
                formatOrdinal={(n) => getLocalizedOrdinal(n, locale)}
              />
            }
          />
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
