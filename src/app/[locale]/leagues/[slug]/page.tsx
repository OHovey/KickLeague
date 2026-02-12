import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { ThemeBackground } from '@/components/ThemeBackground';
import { routing } from '@/i18n/routing';
import { LEAGUES, LEAGUE_THEMES } from '@/lib/themes/league-themes';
import { fetchLeaguePageData } from '@/components/league-page/actions';
import { getZoneColor } from '@/lib/zones';
import { ZoneLegend } from '@/components/league-table/ZoneLegend';
import { buildBreadcrumbs, buildSportsOrganization, serializeJsonLd } from '@/lib/seo/structured-data';

// ISR: revalidate every 30 minutes (matches poll frequency)
export const revalidate = 1800;

// -- Static Params -----------------------------------------------------------

export function generateStaticParams() {
  return LEAGUES.map((slug) => ({ slug }));
}

// -- Metadata ----------------------------------------------------------------

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;

  if (!LEAGUES.includes(slug as (typeof LEAGUES)[number])) {
    return { title: 'League Not Found' };
  }

  const theme = LEAGUE_THEMES[slug as keyof typeof LEAGUE_THEMES];
  const tMeta = await getTranslations({ locale, namespace: 'Metadata' });
  const title = tMeta('leagueTitle', { league: theme?.name ?? slug });
  const description = tMeta('leagueDescription', {
    league: theme?.name ?? slug,
    season: new Date().getFullYear().toString(),
  });

  const leaguesPathname = routing.pathnames['/leagues/[slug]'];

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
            typeof leaguesPathname === 'string'
              ? leaguesPathname
              : leaguesPathname[l];
          return [l, `/${l}${localizedPath.replace('[slug]', slug)}`];
        })
      ),
    },
  };
}

// -- Helpers -----------------------------------------------------------------

function formatDate(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

function FormBadgesInline({ form }: { form: string }) {
  return (
    <div className="flex items-center gap-1">
      {form.split('').map((result, index) => {
        const bg =
          result === 'W'
            ? 'bg-green-500'
            : result === 'D'
              ? 'bg-amber-500'
              : result === 'L'
                ? 'bg-red-500'
                : 'bg-gray-600';
        return (
          <span
            key={index}
            className={`flex h-5 w-5 items-center justify-center rounded text-xs font-bold text-white ${bg}`}
          >
            {result}
          </span>
        );
      })}
    </div>
  );
}

// -- Page --------------------------------------------------------------------

export default async function LeaguePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  if (!LEAGUES.includes(slug as (typeof LEAGUES)[number])) {
    return notFound();
  }

  const t = await getTranslations('LeaguePage');
  const tCommon = await getTranslations('Common');

  let data;
  try {
    data = await fetchLeaguePageData(slug);
  } catch {
    return (
      <div className="min-h-screen bg-[#0a0a0f]">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="rounded-lg bg-white/5 p-8 text-center">
            <p className="text-lg font-medium text-white/90">
              {tCommon('unableToLoad')}
            </p>
            <p className="mt-2 text-white/70">
              {tCommon('checkConfiguration')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return notFound();

  const theme = LEAGUE_THEMES[slug as keyof typeof LEAGUE_THEMES];
  const logoUrl = data.league.logoUrl || theme?.logoUrl || '';
  const leagueName = data.league.name || theme?.name || slug;

  const leagueJsonLd = buildSportsOrganization({
    name: leagueName,
    logoUrl: logoUrl || null,
    url: `/${locale}/leagues/${slug}`,
  });
  const breadcrumbJsonLd = buildBreadcrumbs([
    { name: 'Home', url: `/${locale}` },
    { name: leagueName, url: `/${locale}/leagues/${slug}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(leagueJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd) }}
      />
      <ThemeBackground theme={slug} />
      <div className="min-h-screen">
        <div className="mx-auto max-w-6xl px-4 pb-12">

          {/* League Hero */}
          <section className="py-8">
            <div className="mb-4 flex items-center gap-4">
              {logoUrl && (
                <img
                  src={logoUrl}
                  width={64}
                  height={64}
                  alt={leagueName}
                  className="h-16 w-16 object-contain"
                />
              )}
              <div>
                <h1 className="text-3xl font-bold text-white">{leagueName}</h1>
                <p className="text-white/60">
                  {data.description.country} &middot; {data.league.currentSeason} Season
                </p>
              </div>
            </div>
            <p className="max-w-3xl leading-relaxed text-white/70">
              {data.description.description}
            </p>
          </section>

          {/* Zone Legend */}
          {data.standings.zones.length > 0 && (
            <ZoneLegend zones={data.standings.zones} />
          )}

          {/* Current Standings */}
          <section className="mt-8">
            <h2 className="mb-4 text-xl font-semibold text-white">
              {t('standings')}
            </h2>
            {data.standings.standings.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
                <table className="w-full text-sm text-white/90">
                  <thead>
                    <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-white/50">
                      <th className="px-3 py-3 w-10 text-center">#</th>
                      <th className="px-3 py-3">Team</th>
                      <th className="px-3 py-3 text-center">P</th>
                      <th className="px-3 py-3 text-center">W</th>
                      <th className="px-3 py-3 text-center">D</th>
                      <th className="px-3 py-3 text-center">L</th>
                      <th className="px-3 py-3 text-center">GD</th>
                      <th className="px-3 py-3 text-center">Pts</th>
                      <th className="hidden px-3 py-3 sm:table-cell">Form</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.standings.standings.map((row) => {
                      const zoneColor = getZoneColor(
                        data.standings.zones,
                        row.position
                      );
                      return (
                        <tr
                          key={row.teamId}
                          className="border-b border-white/5 transition-colors hover:bg-white/5"
                        >
                          <td
                            className="px-3 py-2 text-center font-medium"
                            style={
                              zoneColor
                                ? { borderLeft: `3px solid ${zoneColor}` }
                                : { borderLeft: '3px solid transparent' }
                            }
                          >
                            {row.position}
                          </td>
                          <td className="px-3 py-2">
                            <a
                              href={`/${locale}/teams/${row.teamSlug}`}
                              className="flex items-center gap-2 hover:text-white"
                            >
                              {row.teamLogoUrl && (
                                <img
                                  src={row.teamLogoUrl}
                                  width={20}
                                  height={20}
                                  alt=""
                                  className="h-5 w-5 object-contain"
                                />
                              )}
                              <span className="whitespace-nowrap">
                                {row.teamName}
                              </span>
                            </a>
                          </td>
                          <td className="px-3 py-2 text-center">{row.played}</td>
                          <td className="px-3 py-2 text-center">{row.won}</td>
                          <td className="px-3 py-2 text-center">{row.drawn}</td>
                          <td className="px-3 py-2 text-center">{row.lost}</td>
                          <td className="px-3 py-2 text-center">
                            {row.goalDifference > 0
                              ? `+${row.goalDifference}`
                              : row.goalDifference}
                          </td>
                          <td className="px-3 py-2 text-center font-bold">
                            {row.points}
                          </td>
                          <td className="hidden px-3 py-2 sm:table-cell">
                            {row.form && <FormBadgesInline form={row.form} />}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center text-white/50 backdrop-blur-sm">
                {tCommon('noDataAvailable')}
              </div>
            )}
          </section>

          {/* Two-column grid: Top Scorers + Form Team */}
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Top 5 Scorers */}
            <section className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <h2 className="mb-4 text-lg font-semibold text-white">
                {t('topScorers')}
              </h2>
              {data.topScorers.length > 0 ? (
                <ol className="space-y-3">
                  {data.topScorers.map((scorer, index) => (
                    <li
                      key={scorer.playerId}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white/70">
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-medium text-white">
                            {scorer.playerName}
                          </p>
                          <div className="flex items-center gap-1.5 text-xs text-white/50">
                            {scorer.teamLogoUrl && (
                              <img
                                src={scorer.teamLogoUrl}
                                width={14}
                                height={14}
                                alt=""
                                className="h-3.5 w-3.5 object-contain"
                              />
                            )}
                            <span>{scorer.teamName}</span>
                          </div>
                        </div>
                      </div>
                      <span className="text-lg font-bold text-white">
                        {scorer.goalCount}
                      </span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-white/50">{t('noScorers')}</p>
              )}
            </section>

            {/* Form Team */}
            <section className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <h2 className="mb-4 text-lg font-semibold text-white">
                {t('formTeam')}
              </h2>
              {data.formTeam ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    {data.formTeam.teamLogoUrl && (
                      <img
                        src={data.formTeam.teamLogoUrl}
                        width={40}
                        height={40}
                        alt=""
                        className="h-10 w-10 object-contain"
                      />
                    )}
                    <div>
                      <p className="text-lg font-semibold text-white">
                        {data.formTeam.teamName}
                      </p>
                      <p className="text-sm text-white/50">
                        {t('position', { position: data.formTeam.position })} &middot;{' '}
                        {data.formTeam.points} pts
                      </p>
                    </div>
                  </div>
                  <FormBadgesInline form={data.formTeam.form} />
                </div>
              ) : (
                <p className="text-white/50">{t('noFormData')}</p>
              )}
            </section>
          </div>

          {/* Statistics Links */}
          <section className="mt-8">
            <h2 className="mb-4 text-lg font-semibold text-white">
              {t('statistics')}
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {(['top-scorers', 'top-assists', 'disciplinary'] as const).map(
                (stat) => (
                  <a
                    key={stat}
                    href={`/${locale}/leagues/${slug}/stats/${stat}`}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm transition-colors hover:bg-white/10"
                  >
                    <span className="text-sm font-medium text-white/90">
                      {t(`stat_${stat.replace('-', '_')}` as 'stat_top_scorers')}
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
                )
              )}
            </div>
          </section>

          {/* Two-column grid: Recent Matches + Upcoming Matches */}
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Recent Matches */}
            <section className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <h2 className="mb-4 text-lg font-semibold text-white">
                {t('recentMatches')}
              </h2>
              {data.recentMatches.length > 0 ? (
                <div className="space-y-3">
                  {data.recentMatches.map((match) => (
                    <a
                      key={match.id}
                      href={`/${locale}/matches/${match.id}`}
                      className="flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-white/5"
                    >
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-xs text-white/40">
                          {formatDate(match.kickoff, locale)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="flex items-center gap-1.5 text-right">
                          <span className="whitespace-nowrap text-white/90">
                            {match.homeTeam.name}
                          </span>
                          {match.homeTeam.logoUrl && (
                            <img
                              src={match.homeTeam.logoUrl}
                              width={18}
                              height={18}
                              alt=""
                              className="h-[18px] w-[18px] object-contain"
                            />
                          )}
                        </div>
                        <span className="min-w-[3rem] text-center font-bold text-white">
                          {match.homeScore} - {match.awayScore}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {match.awayTeam.logoUrl && (
                            <img
                              src={match.awayTeam.logoUrl}
                              width={18}
                              height={18}
                              alt=""
                              className="h-[18px] w-[18px] object-contain"
                            />
                          )}
                          <span className="whitespace-nowrap text-white/90">
                            {match.awayTeam.name}
                          </span>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-white/50">{t('noRecentMatches')}</p>
              )}
            </section>

            {/* Upcoming Matches */}
            <section className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <h2 className="mb-4 text-lg font-semibold text-white">
                {t('upcomingMatches')}
              </h2>
              {data.upcomingMatches.length > 0 ? (
                <div className="space-y-3">
                  {data.upcomingMatches.map((match) => (
                    <a
                      key={match.id}
                      href={`/${locale}/matches/${match.id}`}
                      className="flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-white/5"
                    >
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-xs text-white/40">
                          {formatDate(match.kickoff, locale)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="flex items-center gap-1.5 text-right">
                          <span className="whitespace-nowrap text-white/90">
                            {match.homeTeam.name}
                          </span>
                          {match.homeTeam.logoUrl && (
                            <img
                              src={match.homeTeam.logoUrl}
                              width={18}
                              height={18}
                              alt=""
                              className="h-[18px] w-[18px] object-contain"
                            />
                          )}
                        </div>
                        <span className="min-w-[3rem] text-center font-medium text-white/60">
                          {t('vs')}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {match.awayTeam.logoUrl && (
                            <img
                              src={match.awayTeam.logoUrl}
                              width={18}
                              height={18}
                              alt=""
                              className="h-[18px] w-[18px] object-contain"
                            />
                          )}
                          <span className="whitespace-nowrap text-white/90">
                            {match.awayTeam.name}
                          </span>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-white/50">{t('noUpcomingMatches')}</p>
              )}
            </section>
          </div>

        </div>
      </div>
    </>
  );
}
