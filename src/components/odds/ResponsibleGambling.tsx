'use client';

import { useTranslations } from 'next-intl';

interface ResponsibleGamblingProps {
  show: boolean;
}

/**
 * Persistent footer banner for responsible gambling compliance.
 * Renders only when betting content is visible (Tier 1 countries).
 */
export function ResponsibleGambling({ show }: ResponsibleGamblingProps) {
  const t = useTranslations('ResponsibleGambling');

  if (!show) return null;

  return (
    <div className="bg-zinc-900 border-t border-zinc-700 py-2 px-4 text-xs text-zinc-400">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-zinc-500 text-[10px] font-bold text-zinc-300">
            18+
          </span>
          <span>{t('message')}</span>
        </div>
        <a
          href="https://www.begambleaware.org"
          target="_blank"
          rel="noopener noreferrer"
          className="whitespace-nowrap text-zinc-300 underline underline-offset-2 hover:text-white"
        >
          {t('helpLink')}
        </a>
      </div>
    </div>
  );
}
