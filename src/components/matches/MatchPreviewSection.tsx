'use client';

import { useEffect, useState, useTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { formatKickoffTime } from '@/lib/dates/format';
import type { MatchWithTeams } from '@/lib/matches/queries';
import { fetchRecentMatches, fetchUpcomingFixtures, getGeoContext } from './actions';
import { fetchCompactOdds, type CompactOddsData } from '@/components/odds/actions';
import { CompactOdds } from '@/components/odds/CompactOdds';

// ─── Compact Match Row ──────────────────────────────────────────────────────

function CompactTeamLogo({
  logoUrl,
  name,
}: {
  logoUrl: string | null;
  name: string;
}) {
  if (!logoUrl) {
    return (
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold text-white/50">
        {name.charAt(0)}
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logoUrl}
      alt={name}
      width={24}
      height={24}
      className="h-6 w-6 object-contain"
    />
  );
}

function CompactResultRow({ match }: { match: MatchWithTeams }) {
  return (
    <Link
      href={`/matches/${match.id}`}
      className="flex items-center gap-2 rounded-lg px-3 py-2 transition-colors hover:bg-white/5"
    >
      {/* Home team */}
      <div className="flex flex-1 items-center justify-end gap-2">
        <span className="truncate text-xs font-medium text-white/80">
          {match.homeTeam.shortName ?? match.homeTeam.name}
        </span>
        <CompactTeamLogo
          logoUrl={match.homeTeam.logoUrl}
          name={match.homeTeam.name}
        />
      </div>

      {/* Score */}
      <span className="w-12 text-center text-sm font-bold tabular-nums text-white">
        {match.homeScore} - {match.awayScore}
      </span>

      {/* Away team */}
      <div className="flex flex-1 items-center gap-2">
        <CompactTeamLogo
          logoUrl={match.awayTeam.logoUrl}
          name={match.awayTeam.name}
        />
        <span className="truncate text-xs font-medium text-white/80">
          {match.awayTeam.shortName ?? match.awayTeam.name}
        </span>
      </div>
    </Link>
  );
}

function CompactFixtureRow({
  match,
  locale,
  compactOdds,
  showBetting,
}: {
  match: MatchWithTeams;
  locale: string;
  compactOdds?: CompactOddsData;
  showBetting?: boolean;
}) {
  return (
    <Link
      href={`/matches/${match.id}`}
      className="block rounded-lg px-3 py-2 transition-colors hover:bg-white/5"
    >
      <div className="flex items-center gap-2">
        {/* Home team */}
        <div className="flex flex-1 items-center justify-end gap-2">
          <span className="truncate text-xs font-medium text-white/80">
            {match.homeTeam.shortName ?? match.homeTeam.name}
          </span>
          <CompactTeamLogo
            logoUrl={match.homeTeam.logoUrl}
            name={match.homeTeam.name}
          />
        </div>

        {/* Kickoff time */}
        <span
          className="w-16 text-center text-xs font-medium text-white/60"
          suppressHydrationWarning
        >
          {formatKickoffTime(match.kickoff, locale)}
        </span>

        {/* Away team */}
        <div className="flex flex-1 items-center gap-2">
          <CompactTeamLogo
            logoUrl={match.awayTeam.logoUrl}
            name={match.awayTeam.name}
          />
          <span className="truncate text-xs font-medium text-white/80">
            {match.awayTeam.shortName ?? match.awayTeam.name}
          </span>
        </div>
      </div>
      {compactOdds && showBetting && (
        <CompactOdds
          fixtureId={match.id}
          bestHome={compactOdds.bestHome}
          bestDraw={compactOdds.bestDraw}
          bestAway={compactOdds.bestAway}
          bookmakerCount={compactOdds.bookmakerCount}
          showBetting={showBetting}
          topBookmakers={compactOdds.topBookmakers}
        />
      )}
    </Link>
  );
}

// ─── Skeleton ───────────────────────────────────────────────────────────────

function CompactSkeleton() {
  return (
    <div className="space-y-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-2 px-3 py-2">
          <div className="flex flex-1 items-center justify-end gap-2">
            <div className="h-3 w-16 animate-pulse rounded bg-white/10" />
            <div className="h-6 w-6 animate-pulse rounded-full bg-white/10" />
          </div>
          <div className="h-4 w-12 animate-pulse rounded bg-white/10" />
          <div className="flex flex-1 items-center gap-2">
            <div className="h-6 w-6 animate-pulse rounded-full bg-white/10" />
            <div className="h-3 w-16 animate-pulse rounded bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── View All Arrow ─────────────────────────────────────────────────────────

function ViewAllLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="mt-3 flex items-center gap-1 text-sm text-white/50 transition-colors hover:text-white/80"
    >
      {children}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 5l7 7-7 7"
        />
      </svg>
    </Link>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

interface MatchPreviewSectionProps {
  league: string;
}

export function MatchPreviewSection({ league }: MatchPreviewSectionProps) {
  const t = useTranslations('Matches');
  const locale = useLocale();
  const [recentMatches, setRecentMatches] = useState<MatchWithTeams[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<MatchWithTeams[]>([]);
  const [oddsMap, setOddsMap] = useState<Record<number, CompactOddsData>>({});
  const [showBetting, setShowBetting] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    startTransition(async () => {
      try {
        const [recentResult, upcomingResult, geo] = await Promise.all([
          fetchRecentMatches(league, 10),
          fetchUpcomingFixtures(league, 5),
          getGeoContext(),
        ]);

        if (!recentResult.error) {
          setRecentMatches(recentResult.matches);
        }
        if (!upcomingResult.error) {
          setUpcomingMatches(upcomingResult.matches);

          // Fetch compact odds for upcoming fixtures if betting is allowed
          if (geo.showBetting && upcomingResult.matches.length > 0) {
            setShowBetting(true);
            const ids = upcomingResult.matches.map((m) => m.id);
            const odds = await fetchCompactOdds(ids, geo.countryCode);
            setOddsMap(odds);
          }
        }
      } catch {
        // Silently handle errors -- preview is non-critical
      } finally {
        setHasLoaded(true);
      }
    });
  }, [league]);

  // Hidden on mobile -- mobile users use the Matches link in the header
  return (
    <section className="hidden md:block">
      <div
        className={`grid grid-cols-2 gap-6 ${isPending && hasLoaded ? 'opacity-60 transition-opacity' : ''}`}
      >
        {/* Recent Results Column */}
        <div className="overflow-hidden rounded-lg bg-white/5 backdrop-blur-sm">
          <div className="border-b border-white/10 px-4 py-3">
            <h2 className="text-sm font-medium text-white/90">
              {t('recentResults')}
            </h2>
          </div>
          <div className="py-1">
            {!hasLoaded ? (
              <CompactSkeleton />
            ) : recentMatches.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-white/40">
                {t('noRecentResults')}
              </p>
            ) : (
              <div className="space-y-0">
                {recentMatches.map((match) => (
                  <CompactResultRow key={match.id} match={match} />
                ))}
              </div>
            )}
          </div>
          <div className="border-t border-white/5 px-4 py-2">
            <ViewAllLink href="/matches?tab=results">
              {t('viewAllResults')}
            </ViewAllLink>
          </div>
        </div>

        {/* Upcoming Fixtures Column */}
        <div className="overflow-hidden rounded-lg bg-white/5 backdrop-blur-sm">
          <div className="border-b border-white/10 px-4 py-3">
            <h2 className="text-sm font-medium text-white/90">
              {t('upcomingFixtures')}
            </h2>
          </div>
          <div className="py-1">
            {!hasLoaded ? (
              <CompactSkeleton />
            ) : upcomingMatches.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-white/40">
                {t('noUpcomingFixtures')}
              </p>
            ) : (
              <div className="space-y-0">
                {upcomingMatches.map((match) => (
                  <CompactFixtureRow
                    key={match.id}
                    match={match}
                    locale={locale}
                    compactOdds={oddsMap[match.id]}
                    showBetting={showBetting}
                  />
                ))}
              </div>
            )}
          </div>
          <div className="border-t border-white/5 px-4 py-2">
            <ViewAllLink href="/matches?tab=fixtures">
              {t('viewAllFixtures')}
            </ViewAllLink>
          </div>
        </div>
      </div>
    </section>
  );
}
