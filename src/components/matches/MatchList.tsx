'use client';

import type { MatchWithTeams, MatchEvent } from '@/lib/matches/queries';
import type { CompactOddsData } from '@/components/odds/actions';
import { useTranslations } from 'next-intl';
import { MatchCard } from './MatchCard';

// ─── Types ──────────────────────────────────────────────────────────────────

interface MatchListProps {
  matches: MatchWithTeams[];
  events: Record<number, MatchEvent[]>;
  teamForms: Record<number, string>;
  oddsMap?: Record<number, CompactOddsData>;
  type: 'results' | 'fixtures';
  showBetting?: boolean;
  onShowMore?: () => void;
  hasMore?: boolean;
}

// ─── Group by Matchweek ─────────────────────────────────────────────────────

function groupByMatchweek(
  matches: MatchWithTeams[]
): { matchweek: number | null; matches: MatchWithTeams[] }[] {
  const groups = new Map<number | null, MatchWithTeams[]>();

  for (const match of matches) {
    const key = match.matchweek;
    const group = groups.get(key) ?? [];
    group.push(match);
    groups.set(key, group);
  }

  return Array.from(groups.entries()).map(([matchweek, matches]) => ({
    matchweek,
    matches,
  }));
}

// ─── Component ──────────────────────────────────────────────────────────────

export function MatchList({
  matches,
  events,
  teamForms,
  oddsMap = {},
  type,
  showBetting = false,
  onShowMore,
  hasMore,
}: MatchListProps) {
  const t = useTranslations('Matches');

  if (matches.length === 0) {
    return (
      <div className="rounded-lg bg-white/5 p-8 text-center">
        <p className="text-white/70">
          {type === 'results' ? t('noRecentResults') : t('noUpcomingFixtures')}
        </p>
      </div>
    );
  }

  const groups = groupByMatchweek(matches);

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.matchweek ?? 'unknown'}>
          {/* Matchweek header */}
          <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-white/40">
            {group.matchweek != null
              ? `${t('matchweek')} ${group.matchweek}`
              : t('matchweekTBD')}
          </h3>

          {/* Match cards — two-column grid on md+ */}
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {group.matches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                events={events[match.id] ?? []}
                homeForm={teamForms[match.homeTeam.id] ?? null}
                awayForm={teamForms[match.awayTeam.id] ?? null}
                compactOdds={oddsMap[match.id] ?? null}
                showBetting={showBetting}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Show more button */}
      {hasMore && onShowMore && (
        <div className="text-center">
          <button
            type="button"
            onClick={onShowMore}
            className="min-h-[44px] rounded-lg bg-white/5 px-6 py-2 text-sm text-white/60 transition-colors hover:bg-white/10 hover:text-white/80"
          >
            {type === 'results' ? t('showMoreResults') : t('showMoreFixtures')}
          </button>
        </div>
      )}
    </div>
  );
}
