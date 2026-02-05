'use client';

import { useEffect, useState, useTransition } from 'react';
import { Link, useRouter } from '@/i18n/navigation';
import { formatKickoffTime, formatMatchDateShort } from '@/lib/dates/format';
import type { MatchWithTeams, MatchEvent } from '@/lib/matches/queries';
import type { H2HSummary } from '@/lib/matches/h2h';
import { FormBadges } from '@/components/league-table/FormBadges';
import { fetchH2HSummary } from './actions';

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

// ─── Event Icons ────────────────────────────────────────────────────────────

function EventSummary({ events }: { events: MatchEvent[] }) {
  if (events.length === 0) return null;
  return (
    <div className="flex flex-wrap justify-center gap-x-3 gap-y-0.5">
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

// ─── H2H Bar ────────────────────────────────────────────────────────────────

function H2HBar({
  team1Wins,
  draws,
  team2Wins,
  team1Name,
  team2Name,
}: {
  team1Wins: number;
  draws: number;
  team2Wins: number;
  team1Name: string;
  team2Name: string;
}) {
  const total = team1Wins + draws + team2Wins;
  if (total === 0) return null;

  const t1Pct = (team1Wins / total) * 100;
  const dPct = (draws / total) * 100;
  const t2Pct = (team2Wins / total) * 100;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[10px] text-white/40">
        <span>
          <span className="text-blue-400">{team1Name}</span>{' '}
          <span className="tabular-nums text-white/60">{team1Wins}</span>
        </span>
        <span className="tabular-nums text-white/60">{draws}D</span>
        <span>
          <span className="tabular-nums text-white/60">{team2Wins}</span>{' '}
          <span className="text-orange-400">{team2Name}</span>
        </span>
      </div>
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
    </div>
  );
}

// ─── H2H Skeleton ───────────────────────────────────────────────────────────

function H2HSkeleton() {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="h-2.5 w-16 animate-pulse rounded bg-white/10" />
        <div className="h-2.5 w-6 animate-pulse rounded bg-white/10" />
        <div className="h-2.5 w-16 animate-pulse rounded bg-white/10" />
      </div>
      <div className="h-1 w-full animate-pulse rounded-full bg-white/10" />
    </div>
  );
}

// ─── H2H Inline Section (lazy loaded) ──────────────────────────────────────

function H2HInline({
  team1Id,
  team2Id,
  team1Name,
  team2Name,
}: {
  team1Id: number;
  team2Id: number;
  team1Name: string;
  team2Name: string;
}) {
  const [h2h, setH2h] = useState<H2HSummary | null>(null);
  const [isPending, startTransition] = useTransition();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    startTransition(async () => {
      try {
        const result = await fetchH2HSummary(team1Id, team2Id);
        setH2h(result);
      } catch {
        // Silently fail - h2h is supplementary data
      } finally {
        setLoaded(true);
      }
    });
  }, [team1Id, team2Id]);

  if (!loaded && isPending) {
    return <H2HSkeleton />;
  }

  if (!h2h) return null;

  const totalMeetings = h2h.team1Wins + h2h.team2Wins + h2h.draws;
  if (totalMeetings === 0) return null;

  return (
    <H2HBar
      team1Wins={h2h.team1Wins}
      draws={h2h.draws}
      team2Wins={h2h.team2Wins}
      team1Name={team1Name}
      team2Name={team2Name}
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
}: MatchCardProps) {
  const router = useRouter();
  const isFinished = match.status === 'finished';
  const homeName = match.homeTeam.shortName ?? match.homeTeam.name;
  const awayName = match.awayTeam.shortName ?? match.awayTeam.name;

  return (
    <Link
      href={`/matches/${match.id}`}
      className="block overflow-hidden rounded-lg bg-white/5 backdrop-blur-sm transition-colors hover:bg-white/[0.08]"
    >
      <div className="px-4 py-3 space-y-3">
        {/* Date */}
        <div className="text-center">
          <span
            className="text-[11px] font-medium uppercase tracking-wider text-white/30"
            suppressHydrationWarning
          >
            {formatMatchDateShort(match.kickoff)}
          </span>
        </div>

        {/* Teams + Score/Time */}
        <div className="flex items-center gap-3">
          {/* Home team */}
          <div className="flex flex-1 items-center justify-end gap-2">
            <span
              className="text-sm font-medium text-white/90 text-right hover:underline cursor-pointer"
              role="link"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                router.push(`/teams/${match.homeTeam.slug}`);
              }}
            >
              {homeName}
            </span>
            <TeamLogo
              logoUrl={match.homeTeam.logoUrl}
              name={match.homeTeam.name}
            />
          </div>

          {/* Score / Time */}
          <div className="flex w-20 flex-col items-center">
            {isFinished ? (
              <span className="text-lg font-bold tabular-nums text-white">
                {match.homeScore} - {match.awayScore}
              </span>
            ) : (
              <span
                className="text-sm font-medium text-white/80"
                suppressHydrationWarning
              >
                {formatKickoffTime(match.kickoff)}
              </span>
            )}
          </div>

          {/* Away team */}
          <div className="flex flex-1 items-center gap-2">
            <TeamLogo
              logoUrl={match.awayTeam.logoUrl}
              name={match.awayTeam.name}
            />
            <span
              className="text-sm font-medium text-white/90 hover:underline cursor-pointer"
              role="link"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                router.push(`/teams/${match.awayTeam.slug}`);
              }}
            >
              {awayName}
            </span>
          </div>
        </div>

        {/* Key events (finished matches only) */}
        {isFinished && events.length > 0 && <EventSummary events={events} />}

        {/* Form badges - shown inline */}
        {(homeForm || awayForm) && (
          <div className="flex items-center justify-between gap-4 px-1">
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-[10px] text-white/30 w-12 text-right shrink-0 truncate">
                {homeName}
              </span>
              <FormBadges form={homeForm} />
            </div>
            <div className="flex items-center gap-2">
              <FormBadges form={awayForm} />
              <span className="hidden sm:inline text-[10px] text-white/30 w-12 shrink-0 truncate">
                {awayName}
              </span>
            </div>
          </div>
        )}

        {/* H2H bar - lazy loaded inline */}
        <H2HInline
          team1Id={match.homeTeam.id}
          team2Id={match.awayTeam.id}
          team1Name={homeName}
          team2Name={awayName}
        />
      </div>
    </Link>
  );
}
