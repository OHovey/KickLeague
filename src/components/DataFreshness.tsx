'use client';

import { useEffect, useState } from 'react';

interface DataFreshnessProps {
  updatedAt: string | null;
}

function getRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.floor(diffMs / 60_000);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin} min ago`;

  const diffHours = Math.floor(diffMin / 60);
  return `${diffHours}h ago`;
}

export function DataFreshness({ updatedAt }: DataFreshnessProps) {
  const [relative, setRelative] = useState('');

  useEffect(() => {
    if (!updatedAt) return;

    const update = () => setRelative(getRelativeTime(updatedAt));
    update();

    // Refresh the relative time every 30 seconds
    const id = setInterval(update, 30_000);
    return () => clearInterval(id);
  }, [updatedAt]);

  if (!updatedAt || !relative) return null;

  return (
    <span className="text-xs text-white/40">
      Last updated: {relative}
    </span>
  );
}
