import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { ThemeBackground } from '@/components/ThemeBackground';
import { routing } from '@/i18n/routing';

import { TeamHero } from '@/components/team-detail/TeamHero';
import { TeamTabs } from '@/components/team-detail/TeamTabs';
import { fetchTeamBySlug } from '@/components/team-detail/actions';
import { buildSportsTeam, buildBreadcrumbs, serializeJsonLd } from '@/lib/seo/structured-data';
import { AdUnit } from '@/components/ads/AdUnit';
import { AD_SLOTS } from '@/components/ads/ad-config';
import { getH2HPairsForTeam } from '@/lib/h2h/queries';

// ISR: revalidate every 30 minutes (matches poll frequency)
export const revalidate = 1800;

// -- Metadata ----------------------------------------------------------------

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;

  try {
    const [team, tMeta] = await Promise.all([
      fetchTeamBySlug(slug),
      getTranslations({ locale, namespace: 'Metadata' }),
    ]);
    if (!team) {
      const tTeams = await getTranslations({ locale, namespace: 'Teams' });
      return { title: tTeams('teamNotFound') };
    }

    const title = tMeta('teamTitle', { team: team.name, league: team.leagueName });
    const description = tMeta('teamDescription', {
      team: team.name,
      league: team.leagueName,
      season: team.currentSeason,
    });

    const teamsPathname = routing.pathnames['/teams/[slug]'];

    return {
      title,
      description,
      openGraph: {
        title: `${title} | KickLeague`,
        description,
        type: 'website',
      },
      alternates: {
        languages: Object.fromEntries(
          routing.locales.map((l) => {
            const localizedPath =
              typeof teamsPathname === 'string'
                ? teamsPathname
                : teamsPathname[l];
            return [l, `/${l}${localizedPath.replace('[slug]', slug)}`];
          })
        ),
      },
    };
  } catch {
    const tTeams = await getTranslations({ locale, namespace: 'Teams' });
    return { title: tTeams('teamNotFound') };
  }
}

// -- Page --------------------------------------------------------------------

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const tTeams = await getTranslations('Teams');
  const tCommon = await getTranslations('Common');

  let teamData;
  try {
    teamData = await fetchTeamBySlug(slug);
  } catch {
    return (
      <div className="min-h-screen bg-[#0a0a0f]">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="rounded-lg bg-white/5 p-8 text-center">
            <p className="text-lg font-medium text-white/90">
              {tTeams('unableToLoadTeam')}
            </p>
            <p className="mt-2 text-white/70">
              {tCommon('checkConfiguration')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!teamData) return notFound();

  // Fetch H2H opponents for cross-linking (non-blocking -- graceful fallback)
  let h2hOpponents: Awaited<ReturnType<typeof getH2HPairsForTeam>> = [];
  try {
    h2hOpponents = await getH2HPairsForTeam(slug, 5);
  } catch {
    // H2H links omitted on error
  }

  const sportsTeamJsonLd = buildSportsTeam({
    name: teamData.name,
    logoUrl: teamData.logoUrl,
    url: `/${locale}/teams/${teamData.slug}`,
    leagueName: teamData.leagueName,
  });
  const breadcrumbJsonLd = buildBreadcrumbs([
    { name: 'Home', url: `/${locale}` },
    { name: teamData.leagueName, url: `/${locale}` },
    { name: teamData.name, url: `/${locale}/teams/${teamData.slug}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(sportsTeamJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd) }}
      />
      <ThemeBackground theme={teamData.leagueSlug} />
      <div className="min-h-screen">
        <div className="mx-auto max-w-6xl px-4 pb-12">
          <TeamHero team={teamData} />
          <AdUnit slotId={AD_SLOTS.TEAM_DETAIL_1.slotId} className="my-6" />
          <TeamTabs
            teamId={teamData.id}
            leagueId={teamData.leagueId}
            season={teamData.currentSeason}
            teamName={teamData.name}
            hasXg={teamData.hasXg}
          />
          <AdUnit slotId={AD_SLOTS.TEAM_DETAIL_2.slotId} className="mt-6" />

          {/* Head-to-Head Matchups */}
          {h2hOpponents.length > 0 && (
            <section className="mt-8">
              <h2 className="mb-4 text-lg font-semibold text-white/90">
                {tTeams('headToHead')}
              </h2>
              <div className="space-y-2">
                {h2hOpponents.map((opp) => (
                  <a
                    key={opp.opponentSlug}
                    href={`/${locale}/h2h/${opp.matchupSlug}`}
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm transition-colors hover:bg-white/10"
                  >
                    {opp.opponentLogoUrl && (
                      <img
                        src={opp.opponentLogoUrl}
                        width={24}
                        height={24}
                        alt=""
                        className="h-6 w-6 object-contain"
                      />
                    )}
                    <span className="flex-1 text-sm font-medium text-white/90">
                      {teamData.name} vs {opp.opponentName}
                    </span>
                    <span className="text-xs text-white/40">
                      {opp.meetingCount} {tTeams('meetingsLabel')}
                    </span>
                    <svg
                      className="h-4 w-4 text-white/30"
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
                  </a>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
