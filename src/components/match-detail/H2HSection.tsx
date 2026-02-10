'use client';

import { useTranslations } from 'next-intl';
import type { H2HSummary } from '@/lib/matches/h2h';
import { formatMatchDate } from '@/lib/dates/format';

// ── Props ──────────────────────────────────────────────────────────────────

interface H2HSectionProps {
  h2hData: H2HSummary;
  team1Name: string;
  team2Name: string;
  team1Id: number;
  team2Id: number;
  locale?: string;
}

// ── Component ──────────────────────────────────────────────────────────────

export function H2HSection({
  h2hData,
  team1Name,
  team2Name,
  team1Id,
  locale = 'en-GB',
}: H2HSectionProps) {
  const t = useTranslations('MatchDetail');
  const total = h2hData.team1Wins + h2hData.team2Wins + h2hData.draws;

  return (
    <section className="glow-card rounded-xl bg-white/5 p-6">
      <h2 className="mb-4 text-lg font-semibold text-white">{t('headToHead')}</h2>

      {total === 0 ? (
        <p className="text-sm text-white/40">{t('noPreviousMeetings')}</p>
      ) : (
        <>
          {/* Summary bar */}
          <div className="mb-3 flex h-3 overflow-hidden rounded-full">
            {h2hData.team1Wins > 0 && (
              <div
                className="bg-blue-500"
                style={{ width: `${(h2hData.team1Wins / total) * 100}%` }}
              />
            )}
            {h2hData.draws > 0 && (
              <div
                className="bg-gray-500"
                style={{ width: `${(h2hData.draws / total) * 100}%` }}
              />
            )}
            {h2hData.team2Wins > 0 && (
              <div
                className="bg-red-500"
                style={{ width: `${(h2hData.team2Wins / total) * 100}%` }}
              />
            )}
          </div>

          {/* Summary text */}
          <div className="mb-4 flex items-center justify-between text-sm">
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-blue-400">{team1Name}</span>
              <span className="tabular-nums text-white/90">
                {t('wins', { count: h2hData.team1Wins })}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="tabular-nums text-white/60">
                {t('draws', { count: h2hData.draws })}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-red-400">{team2Name}</span>
              <span className="tabular-nums text-white/90">
                {t('wins', { count: h2hData.team2Wins })}
              </span>
            </div>
          </div>

          {/* Meetings list */}
          <div className="space-y-2">
            {h2hData.meetings.slice(0, 5).map((meeting) => {
              const isTeam1Home = meeting.homeTeamId === team1Id;
              const homeWon =
                meeting.homeScore !== null &&
                meeting.awayScore !== null &&
                meeting.homeScore > meeting.awayScore;
              const awayWon =
                meeting.homeScore !== null &&
                meeting.awayScore !== null &&
                meeting.awayScore > meeting.homeScore;

              const homeName = isTeam1Home ? team1Name : team2Name;
              const awayName = isTeam1Home ? team2Name : team1Name;

              return (
                <div
                  key={meeting.id}
                  className="flex items-center gap-3 text-xs"
                >
                  <span
                    className="w-28 shrink-0 text-white/40"
                    suppressHydrationWarning
                  >
                    {formatMatchDate(meeting.kickoff, locale)}
                  </span>
                  <span
                    className={`flex-1 text-right ${
                      homeWon ? 'font-medium text-white' : 'text-white/50'
                    }`}
                  >
                    {homeName}
                  </span>
                  <span className="w-10 text-center tabular-nums font-medium text-white/80">
                    {meeting.homeScore} - {meeting.awayScore}
                  </span>
                  <span
                    className={`flex-1 ${
                      awayWon ? 'font-medium text-white' : 'text-white/50'
                    }`}
                  >
                    {awayName}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Note if fewer than 5 meetings */}
          {h2hData.meetings.length < 5 && h2hData.meetings.length > 0 && (
            <p className="mt-3 text-[10px] text-white/30">
              {t('basedOnMeetings', { count: h2hData.meetings.length })}
            </p>
          )}
        </>
      )}
    </section>
  );
}
