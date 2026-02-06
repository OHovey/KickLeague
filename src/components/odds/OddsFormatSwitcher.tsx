'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { useTranslations } from 'next-intl';

// ── Odds Format Context ────────────────────────────────────────────────────

export type OddsFormat = 'decimal' | 'fractional' | 'american';

const OddsFormatContext = createContext<{
  format: OddsFormat;
  setFormat: (f: OddsFormat) => void;
}>({
  format: 'decimal',
  setFormat: () => {},
});

export function useOddsFormat() {
  return useContext(OddsFormatContext);
}

const STORAGE_KEY = 'odds-format';

/**
 * Provider that manages odds format preference with localStorage persistence.
 * Wrap around any component tree that needs access to the odds format.
 */
export function OddsFormatProvider({ children }: { children: React.ReactNode }) {
  const [format, setFormatState] = useState<OddsFormat>('decimal');

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'decimal' || stored === 'fractional' || stored === 'american') {
      setFormatState(stored);
    }
  }, []);

  const setFormat = (f: OddsFormat) => {
    setFormatState(f);
    localStorage.setItem(STORAGE_KEY, f);
  };

  return (
    <OddsFormatContext.Provider value={{ format, setFormat }}>
      {children}
    </OddsFormatContext.Provider>
  );
}

// ── Format Switcher Component ──────────────────────────────────────────────

const OPTIONS: OddsFormat[] = ['decimal', 'fractional', 'american'];

/**
 * Three-option pill toggle: Decimal | Fractional | American.
 * Stores preference in localStorage and broadcasts via context.
 */
export function OddsFormatSwitcher() {
  const t = useTranslations('Formats');
  const { format, setFormat } = useOddsFormat();

  return (
    <div className="inline-flex rounded-lg bg-white/5 p-0.5">
      {OPTIONS.map((opt) => (
        <button
          key={opt}
          onClick={() => setFormat(opt)}
          className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
            format === opt
              ? 'bg-white/15 text-white'
              : 'text-white/50 hover:text-white/70'
          }`}
        >
          {t(opt)}
        </button>
      ))}
    </div>
  );
}
