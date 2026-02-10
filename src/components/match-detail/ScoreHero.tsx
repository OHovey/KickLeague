'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { formatMatchDate, formatKickoffTime } from '@/lib/dates/format';

// ── Team Logo ──────────────────────────────────────────────────────────────

function TeamLogo({ logoUrl, name }: { logoUrl: string | null; name: string }) {
  if (!logoUrl) {
    return (
      <div className="relative">
        {/* Glow behind placeholder */}
        <div
          className="pointer-events-none absolute inset-0 scale-150 rounded-full blur-2xl"
          style={{
            backgroundColor: 'var(--league-glow)',
            opacity: 0.06,
          }}
        />
        <div className="relative flex h-[72px] w-[72px] items-center justify-center rounded-full bg-white/10 text-xl font-bold text-white/50 md:h-24 md:w-24 md:text-2xl">
          {name.charAt(0)}
        </div>
      </div>
    );
  }
  return (
    <div className="relative">
      {/* Glow behind logo */}
      <div
        className="pointer-events-none absolute inset-0 scale-150 rounded-full blur-2xl"
        style={{
          backgroundColor: 'var(--league-glow)',
          opacity: 0.06,
        }}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logoUrl}
        alt={name}
        width={96}
        height={96}
        className="relative h-[72px] w-[72px] object-contain md:h-24 md:w-24"
      />
    </div>
  );
}

// ── Props ──────────────────────────────────────────────────────────────────

interface ScoreHeroProps {
  homeTeam: { name: string; shortName: string | null; logoUrl: string | null; slug: string };
  awayTeam: { name: string; shortName: string | null; logoUrl: string | null; slug: string };
  homeScore: number | null;
  awayScore: number | null;
  kickoff: Date | string;
  venue: string | null;
  matchweek: number | null;
  status: string;
  locale?: string;
}

// ── Component ──────────────────────────────────────────────────────────────

export function ScoreHero({
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  kickoff,
  venue,
  matchweek,
  status,
  locale = 'en-GB',
}: ScoreHeroProps) {
  const t = useTranslations('MatchDetail');
  const isCompleted = status === 'finished';

  return (
    <section className="glow-card relative overflow-hidden rounded-xl bg-gradient-to-b from-white/10 to-white/5 px-8 py-10 md:px-12 md:py-12">
      {/* Primary glow orb */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{
          backgroundColor: 'var(--league-glow)',
          opacity: 0.06,
        }}
      />
      {/* Secondary diffuse orb for depth */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[100px]"
        style={{
          backgroundColor: 'var(--league-glow)',
          opacity: 0.025,
        }}
      />

      {/* Top line: matchweek + venue */}
      <div className="relative mb-6 flex items-center justify-center gap-2 text-sm font-medium tracking-wide text-white/60">
        {matchweek && <span>{t('matchweekN', { week: matchweek })}</span>}
        {matchweek && venue && <span className="text-white/30">-</span>}
        {venue && <span>{venue}</span>}
      </div>

      {/* Center: teams + score */}
      <div className="relative flex items-center justify-evenly">
        {/* Home team — centered column */}
        <div className="flex flex-col items-center gap-2">
          <TeamLogo logoUrl={homeTeam.logoUrl} name={homeTeam.name} />
          <Link
            href={`/teams/${homeTeam.slug}`}
            className="text-base font-semibold text-white/90 hover:underline md:text-lg"
          >
            {homeTeam.shortName ?? homeTeam.name}
          </Link>
        </div>

        {/* Score or kickoff */}
        <div className="relative flex flex-col items-center">
          {isCompleted ? (
            <span
              className="whitespace-nowrap text-5xl font-bold tabular-nums text-white md:text-6xl"
              style={{
                textShadow: `0 0 24px var(--league-glow, transparent), 0 0 48px var(--league-glow, transparent)`,
                filter: 'drop-shadow(0 0 2px rgba(255,255,255,0.2))',
              }}
            >
              {homeScore} - {awayScore}
            </span>
          ) : (
            <span
              className="whitespace-nowrap text-3xl font-bold text-white md:text-4xl"
              style={{
                textShadow: `0 0 24px var(--league-glow, transparent), 0 0 48px var(--league-glow, transparent)`,
                filter: 'drop-shadow(0 0 2px rgba(255,255,255,0.2))',
              }}
              suppressHydrationWarning
            >
              {formatKickoffTime(kickoff, locale)}
            </span>
          )}
        </div>

        {/* Away team — centered column */}
        <div className="flex flex-col items-center gap-2">
          <TeamLogo logoUrl={awayTeam.logoUrl} name={awayTeam.name} />
          <Link
            href={`/teams/${awayTeam.slug}`}
            className="text-base font-semibold text-white/90 hover:underline md:text-lg"
          >
            {awayTeam.shortName ?? awayTeam.name}
          </Link>
        </div>
      </div>

      {/* Bottom: match date */}
      <div className="relative mt-6 text-center text-sm font-medium text-white/50" suppressHydrationWarning>
        {formatMatchDate(kickoff, locale)}
      </div>

      {/* Bottom accent line */}
      <div
        className="absolute bottom-0 left-1/4 right-1/4 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, var(--league-glow), transparent)`,
          opacity: 0.2,
        }}
      />
    </section>
  );
}
