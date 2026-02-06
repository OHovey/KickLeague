'use client';

import { useEffect, useState, useTransition } from 'react';
import { useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { formatKickoffTime } from '@/lib/dates/format';
import { fetchFixturesData, type FixturesData } from './actions';
import type { FixtureWithTeams } from '@/lib/teams/queries';
import { CompactOdds } from '@/components/odds/CompactOdds';
import { fetchCompactOdds, type CompactOddsData } from '@/components/odds/actions';

// ── Result indicator ────────────────────────────────────────────────────────

function getResult(
  fixture: FixtureWithTeams,
  teamId: number
): 'W' | 'D' | 'L' | null {
  if (fixture.status !== 'finished') return null;
  if (fixture.homeScore === null || fixture.awayScore === null) return null;

  const isHome = fixture.homeTeam.id === teamId;
  const teamScore = isHome ? fixture.homeScore : fixture.awayScore;
  const opponentScore = isHome ? fixture.awayScore : fixture.homeScore;

  if (teamScore > opponentScore) return 'W';
  if (teamScore < opponentScore) return 'L';
  return 'D';
}

const RESULT_STYLES = {
  W: 'bg-green-500/20 text-green-400 border-green-500/40',
  D: 'bg-white/10 text-white/60 border-white/20',
  L: 'bg-red-500/20 text-red-400 border-red-500/40',
} as const;

const RESULT_BG = {
  W: 'bg-green-500/5',
  D: 'bg-white/[0.02]',
  L: 'bg-red-500/5',
} as const;

// ── Difficulty indicator ────────────────────────────────────────────────────

function DifficultyBadge({
  position,
}: {
  position: number | undefined;
}) {
  if (!position) return null;

  let colorClass: string;
  if (position <= 6) {
    colorClass = 'bg-red-500/20 text-red-400 border-red-500/40';
  } else if (position <= 14) {
    colorClass = 'bg-amber-500/20 text-amber-400 border-amber-500/40';
  } else {
    colorClass = 'bg-green-500/20 text-green-400 border-green-500/40';
  }

  return (
    <span
      className={`inline-flex h-6 w-6 items-center justify-center rounded border text-[10px] font-bold tabular-nums ${colorClass}`}
      title={`Opponent league position: ${position}`}
    >
      {position}
    </span>
  );
}

// ── Loading Skeleton ────────────────────────────────────────────────────────

function FixturesSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-4 w-28 animate-pulse rounded bg-white/10" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-14 w-full animate-pulse rounded-lg bg-white/5"
          />
        ))}
      </div>
      <div className="space-y-2">
        <div className="h-4 w-32 animate-pulse rounded bg-white/10" />
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-14 w-full animate-pulse rounded-lg bg-white/5"
          />
        ))}
      </div>
    </div>
  );
}

// ── Fixture Row ─────────────────────────────────────────────────────────────

function FixtureRow({
  fixture,
  teamId,
  opponentPositions,
  isResult,
  locale,
}: {
  fixture: FixtureWithTeams;
  teamId: number;
  opponentPositions: Record<number, number>;
  isResult: boolean;
  locale: string;
}) {
  const result = isResult ? getResult(fixture, teamId) : null;
  const isHome = fixture.homeTeam.id === teamId;
  const opponentId = isHome ? fixture.awayTeam.id : fixture.homeTeam.id;

  const bgClass = result ? RESULT_BG[result] : '';

  return (
    <Link
      href={`/matches/${fixture.id}`}
      className={`flex items-center gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-white/[0.08] ${bgClass}`}
    >
      {/* Matchweek badge */}
      <span className="w-12 shrink-0 text-center text-[10px] font-medium uppercase tracking-wider text-white/30">
        MW {fixture.matchweek ?? '?'}
      </span>

      {/* Teams + Score/Time */}
      <div className="flex min-w-0 flex-1 items-center justify-center gap-2 text-sm">
        <span
          className={`truncate text-right ${
            isHome ? 'font-semibold text-white' : 'text-white/70'
          }`}
          style={{ flex: '1 1 0' }}
        >
          {fixture.homeTeam.shortName ?? fixture.homeTeam.name}
        </span>

        <div className="flex w-20 shrink-0 items-center justify-center">
          {fixture.status === 'finished' ? (
            <span className="text-sm font-bold tabular-nums text-white">
              {fixture.homeScore} - {fixture.awayScore}
            </span>
          ) : (
            <span
              className="text-xs text-white/50"
              suppressHydrationWarning
            >
              {formatKickoffTime(fixture.kickoff, locale)}
            </span>
          )}
        </div>

        <span
          className={`truncate text-left ${
            !isHome ? 'font-semibold text-white' : 'text-white/70'
          }`}
          style={{ flex: '1 1 0' }}
        >
          {fixture.awayTeam.shortName ?? fixture.awayTeam.name}
        </span>
      </div>

      {/* Result indicator or Difficulty badge */}
      <div className="flex w-8 shrink-0 items-center justify-center">
        {isResult && result ? (
          <span
            className={`inline-flex h-6 w-6 items-center justify-center rounded border text-[10px] font-bold ${RESULT_STYLES[result]}`}
          >
            {result}
          </span>
        ) : !isResult ? (
          <DifficultyBadge position={opponentPositions[opponentId]} />
        ) : null}
      </div>
    </Link>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

interface FixturesTabProps {
  teamId: number;
  leagueId: number;
  season: string;
  showBetting?: boolean;
  countryCode?: string | null;
}

export function FixturesTab({ teamId, leagueId, season, showBetting = false, countryCode = null }: FixturesTabProps) {
  const locale = useLocale();
  const [data, setData] = useState<FixturesData | null>(null);
  const [oddsMap, setOddsMap] = useState<Record<number, CompactOddsData>>({});
  const [isPending, startTransition] = useTransition();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    startTransition(async () => {
      try {
        const result = await fetchFixturesData(teamId, leagueId, season);
        setData(result);

        // Batch-fetch compact odds for upcoming fixtures
        if (showBetting && result.upcoming.length > 0) {
          const upcomingIds = result.upcoming.map((f) => f.id);
          const odds = await fetchCompactOdds(upcomingIds, countryCode ?? null);
          setOddsMap(odds);
        }
      } catch {
        // Silently fail
      } finally {
        setLoaded(true);
      }
    });
  }, [teamId, leagueId, season, showBetting, countryCode]);

  if (!loaded || isPending) return <FixturesSkeleton />;
  if (!data || (data.recent.length === 0 && data.upcoming.length === 0)) {
    return (
      <div className="rounded-xl bg-white/5 p-6 text-center">
        <p className="text-white/50">No fixture data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Recent Results */}
      {data.recent.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/60">
            Recent Results
          </h3>
          <div className="space-y-1">
            {data.recent.map((fixture) => (
              <FixtureRow
                key={fixture.id}
                fixture={fixture}
                teamId={teamId}
                opponentPositions={data.opponentPositions}
                isResult
                locale={locale}
              />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Fixtures */}
      {data.upcoming.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/60">
            Upcoming Fixtures
          </h3>
          <div className="space-y-1">
            {data.upcoming.map((fixture) => (
              <div key={fixture.id}>
                <FixtureRow
                  fixture={fixture}
                  teamId={teamId}
                  opponentPositions={data.opponentPositions}
                  isResult={false}
                  locale={locale}
                />
                {oddsMap[fixture.id] && (
                  <div className="ml-12 mr-8 -mt-1 mb-1">
                    <CompactOdds
                      fixtureId={fixture.id}
                      bestHome={oddsMap[fixture.id].bestHome}
                      bestDraw={oddsMap[fixture.id].bestDraw}
                      bestAway={oddsMap[fixture.id].bestAway}
                      bookmakerCount={oddsMap[fixture.id].bookmakerCount}
                      showBetting={showBetting}
                      topBookmakers={oddsMap[fixture.id].topBookmakers}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
