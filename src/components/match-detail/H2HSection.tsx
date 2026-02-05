import type { H2HSummary } from '@/lib/matches/h2h';
import { formatMatchDate } from '@/lib/dates/format';

// ── Props ──────────────────────────────────────────────────────────────────

interface H2HSectionProps {
  h2hData: H2HSummary;
  team1Name: string;
  team2Name: string;
  team1Id: number;
  team2Id: number;
}

// ── Component ──────────────────────────────────────────────────────────────

export function H2HSection({
  h2hData,
  team1Name,
  team2Name,
  team1Id,
}: H2HSectionProps) {
  const total = h2hData.team1Wins + h2hData.team2Wins + h2hData.draws;

  return (
    <section className="mt-6 rounded-xl bg-white/5 p-6">
      <h2 className="mb-4 text-lg font-semibold text-white">Head to Head</h2>

      {total === 0 ? (
        <p className="text-sm text-white/40">No previous meetings found.</p>
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
                {h2hData.team1Wins} {h2hData.team1Wins === 1 ? 'win' : 'wins'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="tabular-nums text-white/60">
                {h2hData.draws} {h2hData.draws === 1 ? 'draw' : 'draws'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-red-400">{team2Name}</span>
              <span className="tabular-nums text-white/90">
                {h2hData.team2Wins} {h2hData.team2Wins === 1 ? 'win' : 'wins'}
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
                    {formatMatchDate(meeting.kickoff)}
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
              Based on {h2hData.meetings.length} available{' '}
              {h2hData.meetings.length === 1 ? 'meeting' : 'meetings'}
            </p>
          )}
        </>
      )}
    </section>
  );
}
