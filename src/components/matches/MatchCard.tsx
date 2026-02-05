'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatKickoffTime } from '@/lib/dates/format';
import type { MatchWithTeams, MatchEvent } from '@/lib/matches/queries';
import { MatchCardExpanded } from './MatchCardExpanded';

// ─── Form Dots ──────────────────────────────────────────────────────────────

const FORM_DOT_COLORS: Record<string, string> = {
  W: 'bg-green-500',
  D: 'bg-gray-400',
  L: 'bg-red-500',
};

function FormDots({ form }: { form: string | null }) {
  if (!form) return null;
  return (
    <div className="flex items-center gap-0.5">
      {form.split('').map((result, i) => (
        <span
          key={i}
          className={`h-1.5 w-1.5 rounded-full ${FORM_DOT_COLORS[result] ?? 'bg-gray-600'}`}
        />
      ))}
    </div>
  );
}

// ─── Mini H2H Bar ───────────────────────────────────────────────────────────

function MiniH2HBar({
  team1Wins,
  draws,
  team2Wins,
}: {
  team1Wins: number;
  draws: number;
  team2Wins: number;
}) {
  const total = team1Wins + draws + team2Wins;
  if (total === 0) return null;

  const t1Pct = (team1Wins / total) * 100;
  const dPct = (draws / total) * 100;
  const t2Pct = (team2Wins / total) * 100;

  return (
    <div className="flex h-1 w-full overflow-hidden rounded-full">
      {t1Pct > 0 && (
        <div className="bg-blue-400" style={{ width: `${t1Pct}%` }} />
      )}
      {dPct > 0 && (
        <div className="bg-gray-500" style={{ width: `${dPct}%` }} />
      )}
      {t2Pct > 0 && (
        <div className="bg-orange-400" style={{ width: `${t2Pct}%` }} />
      )}
    </div>
  );
}

// ─── Event Icons ────────────────────────────────────────────────────────────

function EventSummary({ events }: { events: MatchEvent[] }) {
  if (events.length === 0) return null;
  return (
    <div className="mt-1 flex flex-wrap justify-center gap-x-3 gap-y-0.5">
      {events.map((event) => {
        const icon =
          event.type === 'goal' || event.type === 'penalty_scored'
            ? '\u26BD'
            : event.type === 'own_goal'
              ? '\u26BD\u20E0'
              : event.type === 'red_card'
                ? '\uD83D\uDFE5'
                : '';

        return (
          <span key={event.id} className="text-[10px] text-white/50">
            {icon} {event.playerName ?? ''} {event.minute}&apos;
          </span>
        );
      })}
    </div>
  );
}

// ─── Team Logo ──────────────────────────────────────────────────────────────

function TeamLogo({ logoUrl, name }: { logoUrl: string | null; name: string }) {
  if (!logoUrl) {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white/50">
        {name.charAt(0)}
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logoUrl}
      alt={name}
      width={32}
      height={32}
      className="h-8 w-8 object-contain"
    />
  );
}

// ─── MatchCard ──────────────────────────────────────────────────────────────

interface MatchCardProps {
  match: MatchWithTeams;
  events: MatchEvent[];
  homeForm: string | null;
  awayForm: string | null;
  h2hSummary?: { team1Wins: number; team2Wins: number; draws: number } | null;
}

export function MatchCard({
  match,
  events,
  homeForm,
  awayForm,
  h2hSummary,
}: MatchCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isFinished = match.status === 'finished';

  return (
    <div className="overflow-hidden rounded-lg bg-white/5 backdrop-blur-sm">
      <Link
        href={`/matches/${match.id}`}
        className="block px-4 py-3 transition-colors hover:bg-white/5"
      >
        <div className="flex items-center gap-3">
          {/* Home team */}
          <div className="flex flex-1 flex-col items-end gap-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-white/90 text-right">
                {match.homeTeam.shortName ?? match.homeTeam.name}
              </span>
              <TeamLogo
                logoUrl={match.homeTeam.logoUrl}
                name={match.homeTeam.name}
              />
            </div>
            <FormDots form={homeForm} />
          </div>

          {/* Score / Time */}
          <div className="flex w-20 flex-col items-center">
            {isFinished ? (
              <span className="text-lg font-bold tabular-nums text-white">
                {match.homeScore} - {match.awayScore}
              </span>
            ) : (
              <div className="flex flex-col items-center gap-0.5">
                <span
                  className="text-sm font-medium text-white/80"
                  suppressHydrationWarning
                >
                  {formatKickoffTime(match.kickoff)}
                </span>
                <span className="text-xs text-white/30">Odds coming soon</span>
              </div>
            )}
          </div>

          {/* Away team */}
          <div className="flex flex-1 flex-col items-start gap-1">
            <div className="flex items-center gap-2">
              <TeamLogo
                logoUrl={match.awayTeam.logoUrl}
                name={match.awayTeam.name}
              />
              <span className="text-sm font-medium text-white/90">
                {match.awayTeam.shortName ?? match.awayTeam.name}
              </span>
            </div>
            <FormDots form={awayForm} />
          </div>
        </div>

        {/* Key events */}
        {isFinished && events.length > 0 && <EventSummary events={events} />}

        {/* Mini H2H bar */}
        {h2hSummary && (
          <div className="mt-2 px-4">
            <MiniH2HBar
              team1Wins={h2hSummary.team1Wins}
              draws={h2hSummary.draws}
              team2Wins={h2hSummary.team2Wins}
            />
          </div>
        )}
      </Link>

      {/* Expand button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsExpanded((prev) => !prev);
        }}
        className="flex min-h-[44px] w-full items-center justify-center border-t border-white/5 text-xs text-white/40 transition-colors hover:bg-white/5 hover:text-white/60"
        aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded section */}
      {isExpanded && (
        <MatchCardExpanded
          matchId={match.id}
          team1Id={match.homeTeam.id}
          team2Id={match.awayTeam.id}
          team1Name={match.homeTeam.shortName ?? match.homeTeam.name}
          team2Name={match.awayTeam.shortName ?? match.awayTeam.name}
          homeForm={homeForm}
          awayForm={awayForm}
        />
      )}
    </div>
  );
}
