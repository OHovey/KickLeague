'use client';

interface PositionChangeProps {
  change: number;
}

export function PositionChange({ change }: PositionChangeProps) {
  if (change === 0) {
    return (
      <span className="inline-flex items-center text-sm text-gray-400">
        -
      </span>
    );
  }

  if (change > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-sm text-green-500">
        <span aria-hidden="true">&#9650;</span>
        <span>{change}</span>
      </span>
    );
  }

  // change < 0
  return (
    <span className="inline-flex items-center gap-0.5 text-sm text-red-500">
      <span aria-hidden="true">&#9660;</span>
      <span>{Math.abs(change)}</span>
    </span>
  );
}
