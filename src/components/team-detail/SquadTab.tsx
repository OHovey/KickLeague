'use client';

import { useEffect, useState, useTransition } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { fetchSquadData, type SquadData } from './actions';
import type { PlayerStat } from '@/lib/teams/queries';

// ── Position group helpers ──────────────────────────────────────────────────

const POSITION_ORDER = ['GK', 'DEF', 'MID', 'FWD', 'Other'] as const;

const POSITION_KEYS: Record<string, string> = {
  GK: 'goalkeepers',
  DEF: 'defenders',
  MID: 'midfielders',
  FWD: 'forwards',
  Other: 'other',
};

function groupByPosition(players: PlayerStat[]): Record<string, PlayerStat[]> {
  const groups: Record<string, PlayerStat[]> = {};
  for (const pos of POSITION_ORDER) {
    groups[pos] = [];
  }
  for (const p of players) {
    const key = POSITION_ORDER.includes(p.position as typeof POSITION_ORDER[number])
      ? (p.position as string)
      : 'Other';
    groups[key].push(p);
  }
  // Sort each group by appearances descending
  for (const key of Object.keys(groups)) {
    groups[key].sort((a, b) => b.appearances - a.appearances);
  }
  return groups;
}

// ── Top Performer Card ──────────────────────────────────────────────────────

function TopPerformerCard({
  label,
  player,
  stat,
  statLabel,
  href,
}: {
  label: string;
  player: PlayerStat;
  stat: number;
  statLabel: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition-colors hover:bg-white/10"
    >
      <span className="text-[11px] font-medium uppercase tracking-wider text-white/40">
        {label}
      </span>
      {player.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={player.photoUrl}
          alt={player.name}
          width={48}
          height={48}
          className="h-12 w-12 rounded-full object-cover"
        />
      ) : (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-white/50">
          {player.name.charAt(0)}
        </div>
      )}
      <span className="text-sm font-medium text-white/90">{player.name}</span>
      <span className="text-xl font-bold text-white">{stat}</span>
      <span className="text-[11px] text-white/40">{statLabel}</span>
    </a>
  );
}

// ── Loading Skeleton ────────────────────────────────────────────────────────

function SquadSkeleton() {
  return (
    <div className="space-y-6">
      {/* Top performer cards skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-4"
          >
            <div className="h-3 w-20 animate-pulse rounded bg-white/10" />
            <div className="h-12 w-12 animate-pulse rounded-full bg-white/10" />
            <div className="h-4 w-24 animate-pulse rounded bg-white/10" />
            <div className="h-6 w-8 animate-pulse rounded bg-white/10" />
          </div>
        ))}
      </div>
      {/* Roster skeleton */}
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 w-24 animate-pulse rounded bg-white/10" />
          <div className="h-40 w-full animate-pulse rounded-lg bg-white/5" />
        </div>
      ))}
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

interface SquadTabProps {
  teamId: number;
  leagueId: number;
  season: string;
}

export function SquadTab({ teamId, leagueId, season }: SquadTabProps) {
  const t = useTranslations('TeamSquad');
  const locale = useLocale();
  const [data, setData] = useState<SquadData | null>(null);
  const [isPending, startTransition] = useTransition();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    startTransition(async () => {
      try {
        const result = await fetchSquadData(teamId, leagueId, season);
        setData(result);
      } catch {
        // Silently fail
      } finally {
        setLoaded(true);
      }
    });
  }, [teamId, leagueId, season]);

  if (!loaded || isPending) return <SquadSkeleton />;
  if (!data || data.playerStats.length === 0) {
    return (
      <div className="rounded-xl bg-white/5 p-6 text-center">
        <p className="text-white/50">{t('noSquadData')}</p>
      </div>
    );
  }

  const { playerStats, totalFixtures } = data;

  // Check if detailed event stats are available (requires upgraded API tier)
  const hasDetailedStats = playerStats.some(
    (p) => p.appearances > 0 || p.goals > 0 || p.assists > 0 || p.yellowCards > 0 || p.redCards > 0
  );

  // Find top performers (only when stats are available)
  const topScorer = hasDetailedStats
    ? playerStats.reduce((best, p) => (p.goals > (best?.goals ?? 0) ? p : best), null as PlayerStat | null)
    : null;
  const topAssister = hasDetailedStats
    ? playerStats.reduce((best, p) => (p.assists > (best?.assists ?? 0) ? p : best), null as PlayerStat | null)
    : null;
  const mostBooked = hasDetailedStats
    ? playerStats.reduce((best, p) => {
        const cards = p.yellowCards + p.redCards;
        const bestCards = (best?.yellowCards ?? 0) + (best?.redCards ?? 0);
        return cards > bestCards ? p : best;
      }, null as PlayerStat | null)
    : null;

  const groups = groupByPosition(playerStats);

  return (
    <div className="space-y-6">
      {/* Top Performer Callout Cards — only when stats exist */}
      {hasDetailedStats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {topScorer && topScorer.goals > 0 && (
            <TopPerformerCard
              label={t('topScorer')}
              player={topScorer}
              stat={topScorer.goals}
              statLabel={t('goals')}
              href={`/${locale}/players/${topScorer.slug}`}
            />
          )}
          {topAssister && topAssister.assists > 0 && (
            <TopPerformerCard
              label={t('topAssister')}
              player={topAssister}
              stat={topAssister.assists}
              statLabel={t('assists')}
              href={`/${locale}/players/${topAssister.slug}`}
            />
          )}
          {mostBooked &&
            mostBooked.yellowCards + mostBooked.redCards > 0 && (
              <TopPerformerCard
                label={t('mostBooked')}
                player={mostBooked}
                stat={mostBooked.yellowCards + mostBooked.redCards}
                statLabel={t('cards')}
                href={`/${locale}/players/${mostBooked.slug}`}
              />
            )}
        </div>
      )}

      {/* Position-Grouped Roster */}
      {POSITION_ORDER.map((pos) => {
        const group = groups[pos];
        if (!group || group.length === 0) return null;

        return (
          <div key={pos}>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/60">
              {t(POSITION_KEYS[pos] as 'goalkeepers' | 'defenders' | 'midfielders' | 'forwards' | 'other')}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-[11px] uppercase tracking-wider text-white/40">
                    <th className="py-2 pr-2 text-left w-10">#</th>
                    <th className="py-2 px-2 text-left">{t('player')}</th>
                    {hasDetailedStats && (
                      <>
                        <th className="py-2 px-2 text-center w-16">{t('apps')}</th>
                        <th className="py-2 px-2 text-left min-w-[100px]"></th>
                        <th className="py-2 px-2 text-center w-12">{t('g')}</th>
                        <th className="py-2 px-2 text-center w-12">{t('a')}</th>
                        <th className="py-2 px-2 text-center w-16">{t('cards')}</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {group.map((p) => {
                    const appsPct = totalFixtures > 0
                      ? Math.round((p.appearances / totalFixtures) * 100)
                      : 0;

                    return (
                      <tr
                        key={p.playerId}
                        className="border-b border-white/5 transition-colors hover:bg-white/5"
                      >
                        <td className="py-2.5 pr-2 text-white/40 tabular-nums">
                          {p.number ?? '-'}
                        </td>
                        <td className="py-2.5 px-2 font-medium text-white/90">
                          <a
                            href={`/${locale}/players/${p.slug}`}
                            className="hover:text-white transition-colors"
                          >
                            {p.name}
                          </a>
                        </td>
                        {hasDetailedStats && (
                          <>
                            <td className="py-2.5 px-2 text-center tabular-nums text-white/70">
                              {p.appearances}
                            </td>
                            <td className="py-2.5 px-2">
                              <div className="flex items-center gap-2">
                                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                                  <div
                                    className="h-full rounded-full bg-white/30"
                                    style={{ width: `${appsPct}%` }}
                                  />
                                </div>
                                <span className="text-[10px] tabular-nums text-white/30 w-8 text-right">
                                  {appsPct}%
                                </span>
                              </div>
                            </td>
                            <td className="py-2.5 px-2 text-center tabular-nums text-white/70">
                              {p.goals || '-'}
                            </td>
                            <td className="py-2.5 px-2 text-center tabular-nums text-white/70">
                              {p.assists || '-'}
                            </td>
                            <td className="py-2.5 px-2 text-center">
                              {(p.yellowCards > 0 || p.redCards > 0) ? (
                                <span className="inline-flex gap-1 text-xs tabular-nums">
                                  {p.yellowCards > 0 && (
                                    <span className="text-yellow-400">{p.yellowCards}</span>
                                  )}
                                  {p.redCards > 0 && (
                                    <span className="text-red-400">{p.redCards}</span>
                                  )}
                                </span>
                              ) : (
                                <span className="text-white/30">-</span>
                              )}
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
