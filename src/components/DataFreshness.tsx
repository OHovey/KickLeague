'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';

interface DataFreshnessProps {
  updatedAt: string | null;
}

/** Compute the numeric time bucket from an ISO timestamp */
function getTimeBucket(iso: string): { type: 'justNow' } | { type: 'minutes'; count: number } | { type: 'hours'; count: number } {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.floor(diffMs / 60_000);

  if (diffMin < 1) return { type: 'justNow' };
  if (diffMin < 60) return { type: 'minutes', count: diffMin };

  const diffHours = Math.floor(diffMin / 60);
  return { type: 'hours', count: diffHours };
}

export function DataFreshness({ updatedAt }: DataFreshnessProps) {
  const t = useTranslations('DataFreshness');
  const [relative, setRelative] = useState('');

  const formatRelativeTime = useCallback((iso: string) => {
    const bucket = getTimeBucket(iso);
    switch (bucket.type) {
      case 'justNow':
        return t('justNow');
      case 'minutes':
        return t('minutesAgo', { count: bucket.count });
      case 'hours':
        return t('hoursAgo', { count: bucket.count });
    }
  }, [t]);

  useEffect(() => {
    if (!updatedAt) return;

    const update = () => setRelative(formatRelativeTime(updatedAt));
    update();

    // Refresh the relative time every 30 seconds
    const id = setInterval(update, 30_000);
    return () => clearInterval(id);
  }, [updatedAt, formatRelativeTime]);

  if (!updatedAt || !relative) return null;

  return (
    <span className="text-xs text-white/40">
      {t('lastUpdated')} {relative}
    </span>
  );
}
