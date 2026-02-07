import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { Link } from '@/i18n/navigation';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { ThemeBackground } from '@/components/ThemeBackground';
import { ScoreHero } from '@/components/match-detail/ScoreHero';
import { StatsComparison } from '@/components/match-detail/StatsComparison';
import { EventsTimeline } from '@/components/match-detail/EventsTimeline';
import { H2HSection } from '@/components/match-detail/H2HSection';
import { FormGuide } from '@/components/match-detail/FormGuide';
import { ComparativeStats } from '@/components/match-detail/ComparativeStats';
import { OddsComparisonTable } from '@/components/odds/OddsComparisonTable';
import {
  fetchMatchDetail,
  fetchMatchStats,
  fetchMatchEvents,
  fetchUpcomingMatchContext,
  getLeagueSlugById,
} from '@/components/match-detail/actions';
import { isCountryMapped } from '@/lib/geo/bookmaker-availability';

// -- Metadata ----------------------------------------------------------------

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const fixtureId = parseInt(id, 10);
  if (isNaN(fixtureId)) return { title: 'Match Not Found' };

  try {
    const match = await fetchMatchDetail(fixtureId);
    if (!match) return { title: 'Match Not Found' };

    const homeName = match.homeTeam.shortName ?? match.homeTeam.name;
    const awayName = match.awayTeam.shortName ?? match.awayTeam.name;

    if (match.status === 'finished') {
      return {
        title: `${homeName} ${match.homeScore}-${match.awayScore} ${awayName}`,
      };
    }

    return { title: `${homeName} vs ${awayName}` };
  } catch {
    return { title: 'Match' };
  }
}

// -- Page --------------------------------------------------------------------

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  // Read geo-compliance flags from proxy headers
  const headerStore = await headers();
  const showBetting = headerStore.get('x-show-betting') === '1';
  const countryCode = headerStore.get('x-user-country')?.toUpperCase() ?? null;

  const fixtureId = parseInt(id, 10);
  if (isNaN(fixtureId)) return notFound();

  let match;
  try {
    match = await fetchMatchDetail(fixtureId);
  } catch {
    return (
      <div className="min-h-screen bg-[#0a0a0f]">
        <div className="mx-auto max-w-3xl px-4 py-8">
          <div className="rounded-lg bg-white/5 p-8 text-center">
            <p className="text-lg font-medium text-white/90">
              Unable to Load Match
            </p>
            <p className="mt-2 text-white/70">
              Could not connect to the database. Please check your configuration.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!match) return notFound();

  const isCompleted = match.status === 'finished';

  // Resolve league slug for theme
  let leagueSlug = 'premier-league'; // fallback
  try {
    const slug = await getLeagueSlugById(match.leagueId);
    if (slug) leagueSlug = slug;
  } catch {
    // Use fallback
  }

  if (isCompleted) {
    // Completed match: fetch stats, events, and H2H in parallel
    const [stats, events, context] = await Promise.all([
      fetchMatchStats(fixtureId),
      fetchMatchEvents(fixtureId),
      fetchUpcomingMatchContext(
        match.homeTeam.id,
        match.awayTeam.id,
        match.leagueId,
        match.season
      ),
    ]);

    return (
      <>
        <ThemeBackground theme={leagueSlug} />
        <div className="min-h-screen">
          <div className="mx-auto max-w-3xl px-4 py-8">
            <Link
              href="/matches"
              className="mb-4 inline-block text-sm text-white/50 transition-colors hover:text-white/70"
            >
              &larr; Back to matches
            </Link>

            <ScoreHero
              homeTeam={match.homeTeam}
              awayTeam={match.awayTeam}
              homeScore={match.homeScore}
              awayScore={match.awayScore}
              kickoff={match.kickoff}
              venue={match.venue}
              matchweek={match.matchweek}
              status={match.status}
              locale={locale}
            />

            <StatsComparison
              homeStats={stats.home}
              awayStats={stats.away}
            />

            <EventsTimeline
              events={events}
              homeTeamId={match.homeTeam.id}
            />

            <H2HSection
              h2hData={context.h2h}
              team1Name={match.homeTeam.shortName ?? match.homeTeam.name}
              team2Name={match.awayTeam.shortName ?? match.awayTeam.name}
              team1Id={match.homeTeam.id}
              team2Id={match.awayTeam.id}
              locale={locale}
            />
          </div>
        </div>
      </>
    );
  }

  // Upcoming match: fetch H2H + team stats + form data
  const context = await fetchUpcomingMatchContext(
    match.homeTeam.id,
    match.awayTeam.id,
    match.leagueId,
    match.season
  );

  return (
    <>
      <ThemeBackground theme={leagueSlug} />
      <div className="min-h-screen">
        <div className="mx-auto max-w-3xl px-4 py-8">
          <Link
            href="/matches"
            className="mb-4 inline-block text-sm text-white/50 transition-colors hover:text-white/70"
          >
            &larr; Back to matches
          </Link>

          <ScoreHero
            homeTeam={match.homeTeam}
            awayTeam={match.awayTeam}
            homeScore={match.homeScore}
            awayScore={match.awayScore}
            kickoff={match.kickoff}
            venue={match.venue}
            matchweek={match.matchweek}
            status={match.status}
            locale={locale}
          />

          <FormGuide
            homeTeamName={match.homeTeam.shortName ?? match.homeTeam.name}
            awayTeamName={match.awayTeam.shortName ?? match.awayTeam.name}
            homeForm={context.homeTeamStats?.form ?? null}
            awayForm={context.awayTeamStats?.form ?? null}
          />

          <H2HSection
            h2hData={context.h2h}
            team1Name={match.homeTeam.shortName ?? match.homeTeam.name}
            team2Name={match.awayTeam.shortName ?? match.awayTeam.name}
            team1Id={match.homeTeam.id}
            team2Id={match.awayTeam.id}
            locale={locale}
          />

          <ComparativeStats
            homeTeamStats={context.homeTeamStats}
            awayTeamStats={context.awayTeamStats}
            homeTeamName={match.homeTeam.shortName ?? match.homeTeam.name}
            awayTeamName={match.awayTeam.shortName ?? match.awayTeam.name}
          />

          {/* Odds comparison table (upcoming matches only) */}
          <OddsComparisonTable
            fixtureId={fixtureId}
            homeTeam={match.homeTeam.shortName ?? match.homeTeam.name}
            awayTeam={match.awayTeam.shortName ?? match.awayTeam.name}
            showBetting={showBetting}
            countryCode={countryCode}
            isMapped={isCountryMapped(countryCode)}
          />
        </div>
      </div>
    </>
  );
}
