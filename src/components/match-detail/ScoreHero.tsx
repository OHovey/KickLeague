import { Link } from '@/i18n/navigation';
import { formatMatchDate, formatKickoffTime } from '@/lib/dates/format';

// ── Team Logo ──────────────────────────────────────────────────────────────

function TeamLogo({ logoUrl, name }: { logoUrl: string | null; name: string }) {
  if (!logoUrl) {
    return (
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-white/50">
        {name.charAt(0)}
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logoUrl}
      alt={name}
      width={48}
      height={48}
      className="h-12 w-12 object-contain"
    />
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
  const isCompleted = status === 'finished';

  return (
    <section className="rounded-xl bg-gradient-to-b from-white/10 to-white/5 p-6">
      {/* Top line: matchweek + venue */}
      <div className="mb-4 flex items-center justify-center gap-2 text-xs text-white/50">
        {matchweek && <span>Matchweek {matchweek}</span>}
        {matchweek && venue && <span>-</span>}
        {venue && <span>{venue}</span>}
      </div>

      {/* Center: teams + score */}
      <div className="flex items-center justify-center gap-4">
        {/* Home team */}
        <div className="flex flex-1 flex-col items-end gap-2">
          <TeamLogo logoUrl={homeTeam.logoUrl} name={homeTeam.name} />
          <Link
            href={`/teams/${homeTeam.slug}`}
            className="text-sm font-medium text-white/90 text-right hover:underline"
          >
            {homeTeam.shortName ?? homeTeam.name}
          </Link>
        </div>

        {/* Score or kickoff */}
        <div className="flex w-28 flex-col items-center">
          {isCompleted ? (
            <span className="text-3xl font-bold tabular-nums text-white">
              {homeScore} - {awayScore}
            </span>
          ) : (
            <div className="flex flex-col items-center gap-0.5">
              <span
                className="text-lg font-semibold text-white/80"
                suppressHydrationWarning
              >
                {formatKickoffTime(kickoff, locale)}
              </span>
            </div>
          )}
        </div>

        {/* Away team */}
        <div className="flex flex-1 flex-col items-start gap-2">
          <TeamLogo logoUrl={awayTeam.logoUrl} name={awayTeam.name} />
          <Link
            href={`/teams/${awayTeam.slug}`}
            className="text-sm font-medium text-white/90 hover:underline"
          >
            {awayTeam.shortName ?? awayTeam.name}
          </Link>
        </div>
      </div>

      {/* Bottom: match date */}
      <div className="mt-4 text-center text-xs text-white/40" suppressHydrationWarning>
        {formatMatchDate(kickoff, locale)}
      </div>
    </section>
  );
}
