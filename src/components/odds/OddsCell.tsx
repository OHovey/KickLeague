'use client';

import { formatOdds } from '@/lib/odds-api/odds-format';
import { useOddsFormat, type OddsFormat } from './OddsFormatSwitcher';

interface OddsCellProps {
  value: number;
  link: string | null;
  prevValue: number | null;
  fixtureId: number;
  bookmakerKey: string;
  outcome: 'home' | 'draw' | 'away';
  isBest?: boolean;
}

/**
 * Single odds cell with formatted value, movement indicator, and affiliate click tracking.
 *
 * - Displays odds in user's preferred format (decimal/fractional/American)
 * - Shows up/down arrow when odds have moved since last poll
 * - On click: tracks via /api/clicks and opens bookmaker affiliate link
 */
export function OddsCell({
  value,
  link,
  prevValue,
  fixtureId,
  bookmakerKey,
  outcome,
  isBest = false,
}: OddsCellProps) {
  const { format } = useOddsFormat();

  // Determine movement direction
  const hasMovement = prevValue !== null && prevValue !== value;
  const drifted = hasMovement && value > prevValue!; // odds lengthened (better for bettor)
  const shortened = hasMovement && value < prevValue!; // odds shortened

  const handleClick = () => {
    // Fire-and-forget click tracking
    fetch('/api/clicks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fixtureId, bookmakerKey, outcome, odds: value }),
    }).catch(() => {
      // Never block the user's click
    });

    // Open bookmaker affiliate link
    if (link) {
      window.open(link, '_blank', 'noopener');
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`group relative flex items-center justify-center gap-1 rounded px-2 py-1.5 font-mono text-sm transition-colors ${
        link ? 'cursor-pointer' : 'cursor-default'
      } ${
        isBest
          ? 'bg-emerald-500/10 hover:bg-emerald-500/20'
          : 'hover:bg-white/10'
      }`}
      title={link ? `Open ${bookmakerKey}` : undefined}
    >
      {/* Movement indicator */}
      {drifted && (
        <span className="text-[10px] text-green-400" title="Drifted">
          &#9650;
        </span>
      )}
      {shortened && (
        <span className="text-[10px] text-red-400" title="Shortened">
          &#9660;
        </span>
      )}

      {/* Odds value */}
      <span
        className={`tabular-nums ${
          isBest ? 'font-semibold text-emerald-300' : 'text-white/90'
        }`}
      >
        {formatOdds(value, format)}
      </span>
    </button>
  );
}
