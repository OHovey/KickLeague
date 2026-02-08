'use client';

import { useEffect, useState, useTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { formatMatchDate } from '@/lib/dates/format';
import { fetchH2HSummary } from './actions';
import type { H2HSummary } from '@/lib/matches/h2h';
import { FormBadges } from '@/components/league-table/FormBadges';

// ─── Skeleton ───────────────────────────────────────────────────────────────

function ExpandedSkeleton() {
  return (
    <div className="space-y-3 border-t border-white/5 px-4 py-4">
      <div className="h-4 w-32 animate-pulse rounded bg-white/10" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="h-3 w-20 animate-pulse rounded bg-white/10" />
          <div className="h-3 w-12 animate-pulse rounded bg-white/10" />
        </div>
      ))}
    </div>
  );
}

// ─── Props ──────────────────────────────────────────────────────────────────

interface MatchCardExpandedProps {
  matchId: number;
  team1Id: number;
  team2Id: number;
  team1Name: string;
  team2Name: string;
  homeForm: string | null;
  awayForm: string | null;
}

export function MatchCardExpanded({
  team1Id,
  team2Id,
  team1Name,
  team2Name,
  homeForm,
  awayForm,
}: MatchCardExpandedProps) {
  const locale = useLocale();
  const t = useTranslations('Matches');
  const [h2h, setH2h] = useState<H2HSummary | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      try {
        const result = await fetchH2HSummary(team1Id, team2Id);
        setH2h(result);
      } catch {
        // Silently fail - h2h is supplementary data
      }
    });
  }, [team1Id, team2Id]);

  if (isPending || !h2h) {
    return <ExpandedSkeleton />;
  }

  const totalMeetings = h2h.team1Wins + h2h.team2Wins + h2h.draws;

  return (
    <div className="space-y-4 border-t border-white/5 px-4 py-4">
      {/* H2H Record */}
      <div>
        <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-white/50">
          {t('h2h')}
        </h4>
        {totalMeetings === 0 ? (
          <p className="text-sm text-white/40">{t('noPreviousMeetings')}</p>
        ) : (
          <>
            {/* Record summary */}
            <div className="mb-3 flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-blue-400">{team1Name}</span>
                <span className="tabular-nums text-white/90">{h2h.team1Wins}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-white/50">{t('draws')}</span>
                <span className="tabular-nums text-white/90">{h2h.draws}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-orange-400">{team2Name}</span>
                <span className="tabular-nums text-white/90">{h2h.team2Wins}</span>
              </div>
            </div>

            {/* Last 5 meetings */}
            <div className="space-y-1.5">
              {h2h.meetings.slice(0, 5).map((meeting) => {
                const isTeam1Home = meeting.homeTeamId === team1Id;
                const t1Score = isTeam1Home ? meeting.homeScore : meeting.awayScore;
                const t2Score = isTeam1Home ? meeting.awayScore : meeting.homeScore;

                return (
                  <div
                    key={meeting.id}
                    className="flex items-center gap-3 text-xs text-white/60"
                  >
                    <span className="w-28 shrink-0" suppressHydrationWarning>
                      {formatMatchDate(meeting.kickoff, locale)}
                    </span>
                    <span className="tabular-nums font-medium text-white/80">
                      {t1Score} - {t2Score}
                    </span>
                    {isTeam1Home ? (
                      <span className="text-white/30">{t('homeShort')}</span>
                    ) : (
                      <span className="text-white/30">{t('awayShort')}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Team Forms */}
      <div>
        <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-white/50">
          {t('form')}
        </h4>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="w-24 shrink-0 text-xs text-white/60 truncate">
              {team1Name}
            </span>
            <FormBadges form={homeForm} />
          </div>
          <div className="flex items-center gap-3">
            <span className="w-24 shrink-0 text-xs text-white/60 truncate">
              {team2Name}
            </span>
            <FormBadges form={awayForm} />
          </div>
        </div>
      </div>
    </div>
  );
}
