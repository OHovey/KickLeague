'use client';

import { useEffect, useState, useTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { formatKickoffTime, formatMatchDateShort } from '@/lib/dates/format';
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
      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[9px] font-bold text-white/50">
        {name.charAt(0)}
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logoUrl}
      alt={name}
      width={20}
      height={20}
      className="h-5 w-5 shrink-0 object-contain"
    />
  );
}

/** Group label for a cluster of matches on the same date */
function DateGroupHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-white/30">
        {label}
      </span>
      <div className="h-px flex-1 bg-white/5" />
    </div>
  );
}

function CompactResultRow({ match, locale }: { match: MatchWithTeams; locale: string }) {
  const homeWin = (match.homeScore ?? 0) > (match.awayScore ?? 0);
  const awayWin = (match.awayScore ?? 0) > (match.homeScore ?? 0);
  const isDraw = match.homeScore === match.awayScore;

  return (
    <Link
      href={`/matches/${match.id}`}
      className="group flex items-center gap-1.5 px-3 py-1.5 transition-colors hover:bg-white/5"
    >
      {/* Home team */}
      <div className="flex flex-1 items-center justify-end gap-1.5 overflow-hidden">
        <span
          className={`truncate text-xs tabular-nums ${
            homeWin
              ? 'font-semibold text-white'
              : isDraw
                ? 'font-medium text-white/70'
                : 'font-normal text-white/45'
          }`}
        >
          {match.homeTeam.shortName ?? match.homeTeam.name}
        </span>
        <CompactTeamLogo
          logoUrl={match.homeTeam.logoUrl}
          name={match.homeTeam.name}
        />
      </div>

      {/* Score pill */}
      <div className="flex w-[52px] shrink-0 items-center justify-center gap-px rounded bg-white/[0.07] px-1.5 py-0.5">
        <span
          className={`text-xs tabular-nums ${homeWin ? 'font-bold text-white' : 'font-semibold text-white/60'}`}
        >
          {match.homeScore}
        </span>
        <span className="text-[10px] text-white/25">-</span>
        <span
          className={`text-xs tabular-nums ${awayWin ? 'font-bold text-white' : 'font-semibold text-white/60'}`}
        >
          {match.awayScore}
        </span>
      </div>

      {/* Away team */}
      <div className="flex flex-1 items-center gap-1.5 overflow-hidden">
        <CompactTeamLogo
          logoUrl={match.awayTeam.logoUrl}
          name={match.awayTeam.name}
        />
        <span
          className={`truncate text-xs tabular-nums ${
            awayWin
              ? 'font-semibold text-white'
              : isDraw
                ? 'font-medium text-white/70'
                : 'font-normal text-white/45'
          }`}
        >
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
      className="group block px-3 py-1.5 transition-colors hover:bg-white/5"
    >
      <div className="flex items-center gap-1.5">
        {/* Home team */}
        <div className="flex flex-1 items-center justify-end gap-1.5 overflow-hidden">
          <span className="truncate text-xs font-medium text-white/80">
            {match.homeTeam.shortName ?? match.homeTeam.name}
          </span>
          <CompactTeamLogo
            logoUrl={match.homeTeam.logoUrl}
            name={match.homeTeam.name}
          />
        </div>

        {/* Kickoff time pill */}
        <div
          className="flex w-[52px] shrink-0 items-center justify-center rounded bg-white/[0.07] px-1.5 py-0.5"
          suppressHydrationWarning
        >
          <span className="text-[11px] font-medium tabular-nums text-white/60" suppressHydrationWarning>
            {formatKickoffTime(match.kickoff, locale).replace(/\s*(GMT|BST|CET|CEST|EST|PST|UTC).*$/i, '')}
          </span>
        </div>

        {/* Away team */}
        <div className="flex flex-1 items-center gap-1.5 overflow-hidden">
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

function CompactSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="divide-y divide-white/5">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-1.5 px-3 py-1.5">
          <div className="flex flex-1 items-center justify-end gap-1.5">
            <div className="shimmer-loading h-3 w-14 rounded" />
            <div className="shimmer-loading h-5 w-5 rounded-full" />
          </div>
          <div className="shimmer-loading h-5 w-[52px] rounded" />
          <div className="flex flex-1 items-center gap-1.5">
            <div className="shimmer-loading h-5 w-5 rounded-full" />
            <div className="shimmer-loading h-3 w-14 rounded" />
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
      className="flex items-center gap-1 text-xs font-medium text-white/40 transition-colors hover:text-white/70"
    >
      {children}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-3 w-3"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2.5}
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

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Group matches by their short date string for matchday headers */
function groupByDate(
  matches: MatchWithTeams[],
  locale: string
): { label: string; matches: MatchWithTeams[] }[] {
  const groups: { label: string; matches: MatchWithTeams[] }[] = [];
  let currentLabel = '';

  for (const match of matches) {
    const label = formatMatchDateShort(match.kickoff, locale);
    if (label !== currentLabel) {
      currentLabel = label;
      groups.push({ label, matches: [match] });
    } else {
      groups[groups.length - 1].matches.push(match);
    }
  }

  return groups;
}

// ─── Section Header ─────────────────────────────────────────────────────────

function SectionHeader({
  title,
  count,
}: {
  title: string;
  count: number;
}) {
  return (
    <div className="relative border-b border-white/10 px-4 py-2.5">
      {/* Subtle accent glow at the top edge */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-30"
        style={{ background: 'linear-gradient(90deg, transparent 0%, var(--league-accent) 50%, transparent 100%)' }}
      />
      <div className="flex items-center justify-between">
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-white/70">
          {title}
        </h2>
        {count > 0 && (
          <span className="text-[10px] font-medium tabular-nums text-white/25">
            {count}
          </span>
        )}
      </div>
    </div>
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

  const resultGroups = groupByDate(recentMatches, locale);
  const fixtureGroups = groupByDate(upcomingMatches, locale);

  // Hidden on mobile -- mobile users use the Matches link in the header
  return (
    <section className="hidden md:block">
      <div
        className={`grid grid-cols-2 gap-6 ${isPending && hasLoaded ? 'opacity-60 transition-opacity' : ''}`}
      >
        {/* Recent Results Column */}
        <div className="flex flex-col overflow-hidden rounded-lg border border-white/[0.07] bg-white/[0.03] backdrop-blur-sm">
          <SectionHeader title={t('recentResults')} count={recentMatches.length} />
          <div className="flex flex-1 flex-col justify-evenly py-0.5">
            {!hasLoaded ? (
              <CompactSkeleton rows={8} />
            ) : recentMatches.length === 0 ? (
              <p className="px-4 py-6 text-center text-xs text-white/30">
                {t('noRecentResults')}
              </p>
            ) : (
              resultGroups.flatMap((group) => [
                <DateGroupHeader key={`hdr-${group.label}`} label={group.label} />,
                ...group.matches.map((match) => (
                  <CompactResultRow key={match.id} match={match} locale={locale} />
                )),
              ])
            )}
          </div>
          <div className="mt-auto border-t border-white/[0.06] px-4 py-2">
            <ViewAllLink href="/matches?tab=results">
              {t('viewAllResults')}
            </ViewAllLink>
          </div>
        </div>

        {/* Upcoming Fixtures Column */}
        <div className="flex flex-col overflow-hidden rounded-lg border border-white/[0.07] bg-white/[0.03] backdrop-blur-sm">
          <SectionHeader title={t('upcomingFixtures')} count={upcomingMatches.length} />
          <div className="flex flex-1 flex-col justify-evenly py-0.5">
            {!hasLoaded ? (
              <CompactSkeleton rows={5} />
            ) : upcomingMatches.length === 0 ? (
              <p className="px-4 py-6 text-center text-xs text-white/30">
                {t('noUpcomingFixtures')}
              </p>
            ) : (
              fixtureGroups.flatMap((group) => [
                <DateGroupHeader key={`hdr-${group.label}`} label={group.label} />,
                ...group.matches.map((match) => (
                  <CompactFixtureRow
                    key={match.id}
                    match={match}
                    locale={locale}
                    compactOdds={oddsMap[match.id]}
                    showBetting={showBetting}
                  />
                )),
              ])
            )}
          </div>
          <div className="mt-auto border-t border-white/[0.06] px-4 py-2">
            <ViewAllLink href="/matches?tab=fixtures">
              {t('viewAllFixtures')}
            </ViewAllLink>
          </div>
        </div>
      </div>
    </section>
  );
}
