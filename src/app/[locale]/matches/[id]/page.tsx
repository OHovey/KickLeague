import { notFound } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { ThemeBackground } from '@/components/ThemeBackground';
import { routing } from '@/i18n/routing';
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
import { buildSportsEvent, buildBreadcrumbs, serializeJsonLd } from '@/lib/seo/structured-data';
import { AdUnit } from '@/components/ads/AdUnit';
import { AD_SLOTS } from '@/components/ads/ad-config';

// ISR: revalidate every 30 minutes (matches poll frequency)
export const revalidate = 1800;

// -- Metadata ----------------------------------------------------------------

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const tMeta = await getTranslations({ locale, namespace: 'Metadata' });
  const tCommon = await getTranslations({ locale, namespace: 'Common' });
  const fixtureId = parseInt(id, 10);
  if (isNaN(fixtureId)) return { title: tCommon('notFound') };

  try {
    const match = await fetchMatchDetail(fixtureId);
    if (!match) return { title: tCommon('notFound') };

    const homeName = match.homeTeam.shortName ?? match.homeTeam.name;
    const awayName = match.awayTeam.shortName ?? match.awayTeam.name;

    const ogTitle = `${tMeta('matchTitle', { home: homeName, away: awayName })} | KickLeague`;
    const description = tMeta('matchDescription', { home: homeName, away: awayName });

    const matchPathname = routing.pathnames['/matches/[id]'];

    return {
      title:
        match.status === 'finished'
          ? `${homeName} ${match.homeScore}-${match.awayScore} ${awayName}`
          : tMeta('matchTitle', { home: homeName, away: awayName }),
      description,
      openGraph: {
        title: ogTitle,
        description,
        type: 'website',
      },
      alternates: {
        languages: Object.fromEntries(
          routing.locales.map((l) => {
            const localizedPath =
              typeof matchPathname === 'string'
                ? matchPathname
                : matchPathname[l];
            return [l, `/${l}${localizedPath.replace('[id]', id)}`];
          })
        ),
      },
    };
  } catch {
    return { title: tMeta('matchesTitle') };
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

  const tCommon = await getTranslations('Common');

  const fixtureId = parseInt(id, 10);
  if (isNaN(fixtureId)) return notFound();

  let match;
  try {
    match = await fetchMatchDetail(fixtureId);
  } catch {
    return (
      <div className="min-h-screen bg-[#0a0a0f]">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="rounded-lg bg-white/5 p-8 text-center">
            <p className="text-lg font-medium text-white/90">
              {tCommon('unableToLoadMatch')}
            </p>
            <p className="mt-2 text-white/70">
              {tCommon('checkConfiguration')}
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

  // Build JSON-LD structured data (shared by both completed & upcoming branches)
  const tMeta = await getTranslations('Metadata');
  const sportsEventJsonLd = buildSportsEvent({
    homeTeamName: match.homeTeam.name,
    awayTeamName: match.awayTeam.name,
    kickoff: match.kickoff,
    venue: match.venue,
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    status: match.status,
  });
  const breadcrumbJsonLd = buildBreadcrumbs([
    { name: 'Home', url: `/${locale}` },
    { name: tMeta('matchesTitle'), url: `/${locale}/matches` },
    {
      name: `${match.homeTeam.shortName ?? match.homeTeam.name} vs ${match.awayTeam.shortName ?? match.awayTeam.name}`,
      url: `/${locale}/matches/${match.id}`,
    },
  ]);

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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(sportsEventJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd) }}
        />
        <ThemeBackground theme={leagueSlug} />
        <div className="min-h-screen">
          <div className="mx-auto max-w-6xl px-4 py-8">
            <Link
              href="/matches"
              className="mb-4 inline-block text-sm text-white/50 transition-colors hover:text-white/70"
            >
              &larr; {tCommon('backToMatches')}
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

            {/* Two-column grid: stats left, H2H right */}
            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
              {/* Column 1: Match analysis */}
              <div className="flex flex-col gap-6">
                <StatsComparison
                  homeStats={stats.home}
                  awayStats={stats.away}
                />

                <EventsTimeline
                  events={events}
                  homeTeamId={match.homeTeam.id}
                />

                <AdUnit slotId={AD_SLOTS.MATCH_DETAIL_1.slotId} />
              </div>

              {/* Column 2: Context */}
              <div className="lg:sticky lg:top-8 lg:self-start flex flex-col gap-6">
                <H2HSection
                  h2hData={context.h2h}
                  team1Name={match.homeTeam.shortName ?? match.homeTeam.name}
                  team2Name={match.awayTeam.shortName ?? match.awayTeam.name}
                  team1Id={match.homeTeam.id}
                  team2Id={match.awayTeam.id}
                  locale={locale}
                  team1Slug={match.homeTeam.slug}
                  team2Slug={match.awayTeam.slug}
                />

                <AdUnit slotId={AD_SLOTS.MATCH_DETAIL_2.slotId} />
              </div>
            </div>
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(sportsEventJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd) }}
      />
      <ThemeBackground theme={leagueSlug} />
      <div className="min-h-screen">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <Link
            href="/matches"
            className="mb-4 inline-block text-sm text-white/50 transition-colors hover:text-white/70"
          >
            &larr; {tCommon('backToMatches')}
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

          {/* Two-column grid: analysis left, odds right */}
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
            {/* Column 1: Match context */}
            <div className="flex flex-col gap-6">
              <FormGuide
                homeTeamName={match.homeTeam.shortName ?? match.homeTeam.name}
                awayTeamName={match.awayTeam.shortName ?? match.awayTeam.name}
                homeForm={context.homeTeamStats?.form ?? null}
                awayForm={context.awayTeamStats?.form ?? null}
              />

              <AdUnit slotId={AD_SLOTS.MATCH_DETAIL_1.slotId} />

              <H2HSection
                h2hData={context.h2h}
                team1Name={match.homeTeam.shortName ?? match.homeTeam.name}
                team2Name={match.awayTeam.shortName ?? match.awayTeam.name}
                team1Id={match.homeTeam.id}
                team2Id={match.awayTeam.id}
                locale={locale}
                team1Slug={match.homeTeam.slug}
                team2Slug={match.awayTeam.slug}
              />

              <AdUnit slotId={AD_SLOTS.MATCH_DETAIL_2.slotId} />

              <ComparativeStats
                homeTeamStats={context.homeTeamStats}
                awayTeamStats={context.awayTeamStats}
                homeTeamName={match.homeTeam.shortName ?? match.homeTeam.name}
                awayTeamName={match.awayTeam.shortName ?? match.awayTeam.name}
              />
            </div>

            {/* Column 2: Betting odds */}
            <div className="lg:sticky lg:top-8 lg:self-start">
              <OddsComparisonTable
                fixtureId={fixtureId}
                homeTeam={match.homeTeam.shortName ?? match.homeTeam.name}
                awayTeam={match.awayTeam.shortName ?? match.awayTeam.name}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
