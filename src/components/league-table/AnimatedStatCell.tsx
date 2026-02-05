'use client';

import NumberFlow from '@number-flow/react';

interface AnimatedStatCellProps {
  value: number;
  className?: string;
}

/**
 * Stat cell with digit-spin animation powered by NumberFlow.
 * When the value changes (e.g. switching matchweeks), digits animate
 * via the shortest-path spin transition.
 */
export function AnimatedStatCell({ value, className }: AnimatedStatCellProps) {
  return (
    <NumberFlow
      value={value}
      transformTiming={{ duration: 300, easing: 'ease-out' }}
      spinTiming={{ duration: 300, easing: 'ease-out' }}
      trend={0}
      className={className}
    />
  );
}
