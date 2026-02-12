import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { ThemeBackground } from '@/components/ThemeBackground';
import { LEAGUES, LEAGUE_THEMES } from '@/lib/themes/league-themes';
import {
  fetchLeaderboardData,
  type LeaderboardData,
} from '@/components/leaderboard/actions';
import {
  buildBreadcrumbs,
  buildItemList,
  serializeJsonLd,
} from '@/lib/seo/structured-data';

// ISR: revalidate every 30 minutes
export const revalidate = 1800;

// -- Valid stat types --------------------------------------------------------

const VALID_STATS = ['top-scorers', 'top-assists', 'disciplinary'] as const;
type StatParam = (typeof VALID_STATS)[number];

const STAT_TITLE_KEYS: Record<StatParam, string> = {
  'top-scorers': 'topScorers',
  'top-assists': 'topAssists',
  disciplinary: 'disciplinary',
};

const STAT_META_KEYS: Record<StatParam, string> = {
  'top-scorers': 'statTopScorers',
  'top-assists': 'statTopAssists',
  disciplinary: 'statDisciplinary',
};

// -- Static Params -----------------------------------------------------------

export function generateStaticParams() {
  const params: { slug: string; stat: string }[] = [];
  for (const slug of LEAGUES) {
    for (const stat of VALID_STATS) {
      params.push({ slug, stat });
    }
  }
  return params;
}

// -- Metadata ----------------------------------------------------------------

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string; stat: string }>;
}): Promise<Metadata> {
  const { locale, slug, stat } = await params;

  if (
    !LEAGUES.includes(slug as (typeof LEAGUES)[number]) ||
    !VALID_STATS.includes(stat as StatParam)
  ) {
    return { title: 'Not Found' };
  }

  const theme = LEAGUE_THEMES[slug as keyof typeof LEAGUE_THEMES];
  const tMeta = await getTranslations({ locale, namespace: 'Metadata' });
  const statDisplayName = tMeta(STAT_META_KEYS[stat as StatParam]);
  const title = tMeta('statsTitle', {
    stat: statDisplayName,
    league: theme?.name ?? slug,
  });
  const description = tMeta('statsDescription', {
    league: theme?.name ?? slug,
    season: new Date().getFullYear().toString(),
    stat: statDisplayName,
  });

  const statsPathname =
    routing.pathnames['/leagues/[slug]/stats/[stat]'];

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
            typeof statsPathname === 'string'
              ? statsPathname
              : statsPathname[l];
          return [
            l,
            `/${l}${localizedPath.replace('[slug]', slug).replace('[stat]', stat)}`,
          ];
        })
      ),
    },
  };
}

// -- Page --------------------------------------------------------------------

export default async function StatsLeaderboardPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string; stat: string }>;
}) {
  const { locale, slug, stat } = await params;
  setRequestLocale(locale);

  // Validate slug and stat
  if (!LEAGUES.includes(slug as (typeof LEAGUES)[number])) {
    return notFound();
  }
  if (!VALID_STATS.includes(stat as StatParam)) {
    return notFound();
  }

  const t = await getTranslations('StatsPage');

  let data: LeaderboardData;
  try {
    data = await fetchLeaderboardData(slug, stat);
  } catch {
    return (
      <div className="min-h-screen bg-[#0a0a0f]">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="rounded-lg bg-white/5 p-8 text-center">
            <p className="text-lg font-medium text-white/90">
              Unable to load leaderboard data.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const theme = LEAGUE_THEMES[slug as keyof typeof LEAGUE_THEMES];
  const leagueName = data?.league.name || theme?.name || slug;
  const logoUrl = data?.league.logoUrl || theme?.logoUrl || '';
  const statTitle = t(STAT_TITLE_KEYS[stat as StatParam]);

  // JSON-LD: BreadcrumbList
  const breadcrumbJsonLd = buildBreadcrumbs([
    { name: 'Home', url: `/${locale}` },
    { name: leagueName, url: `/${locale}/leagues/${slug}` },
    { name: statTitle, url: `/${locale}/leagues/${slug}/stats/${stat}` },
  ]);

  // JSON-LD: ItemList from leaderboard rows
  const itemListJsonLd = buildItemList(
    (data?.rows ?? []).map((row, index) => ({
      name: row.playerName,
      position: index + 1,
    }))
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(itemListJsonLd) }}
      />
      <ThemeBackground theme={slug} />
      <div className="min-h-screen">
        <div className="mx-auto max-w-6xl px-4 pb-12">

          {/* Hero Section */}
          <section className="py-8">
            <a
              href={`/${locale}/leagues/${slug}`}
              className="mb-4 inline-flex items-center gap-1 text-sm text-white/50 transition-colors hover:text-white/80"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              {t('backToLeague', { league: leagueName })}
            </a>
            <div className="flex items-center gap-4">
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
                <h1 className="text-3xl font-bold text-white">
                  {leagueName} {statTitle}
                </h1>
                <p className="text-white/60">
                  {data?.league.country} &middot; {data?.league.currentSeason} Season
                </p>
              </div>
            </div>
          </section>

          {/* Stat Type Navigation Tabs */}
          <nav className="mb-6 flex gap-2">
            {VALID_STATS.map((s) => {
              const isActive = s === stat;
              return (
                <a
                  key={s}
                  href={`/${locale}/leagues/${slug}/stats/${s}`}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80'
                  }`}
                >
                  {t(STAT_TITLE_KEYS[s])}
                </a>
              );
            })}
          </nav>

          {/* Leaderboard Table */}
          {!data || (data.rows.length === 0) ? (
            <div className="rounded-xl border border-white/10 bg-white/5 p-12 text-center backdrop-blur-sm">
              <p className="text-white/50">{t('noData')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
              <table className="w-full text-sm text-white/90">
                <thead>
                  <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-white/50">
                    <th className="w-10 px-3 py-3 text-center">{t('rank')}</th>
                    <th className="px-3 py-3">{t('player')}</th>
                    <th className="px-3 py-3">{t('team')}</th>
                    {data.type === 'scorers' && (
                      <>
                        <th className="px-3 py-3 text-center">{t('goals')}</th>
                        <th className="hidden px-3 py-3 text-center sm:table-cell">
                          {t('appearances')}
                        </th>
                        <th className="hidden px-3 py-3 text-center sm:table-cell">
                          {t('goalsPerAppearance')}
                        </th>
                      </>
                    )}
                    {data.type === 'assists' && (
                      <>
                        <th className="px-3 py-3 text-center">{t('assists')}</th>
                        <th className="hidden px-3 py-3 text-center sm:table-cell">
                          {t('appearances')}
                        </th>
                        <th className="hidden px-3 py-3 text-center sm:table-cell">
                          {t('assistsPerAppearance')}
                        </th>
                      </>
                    )}
                    {data.type === 'disciplinary' && (
                      <>
                        <th className="px-3 py-3 text-center">{t('yellowCards')}</th>
                        <th className="px-3 py-3 text-center">{t('redCards')}</th>
                        <th className="hidden px-3 py-3 text-center sm:table-cell">
                          {t('appearances')}
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((row, index) => (
                    <tr
                      key={row.playerId}
                      className="border-b border-white/5 transition-colors hover:bg-white/5"
                    >
                      {/* Rank */}
                      <td className="w-10 px-3 py-2 text-center font-medium">
                        {index + 1}
                      </td>

                      {/* Player */}
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          {row.playerPhotoUrl ? (
                            <img
                              src={row.playerPhotoUrl}
                              width={24}
                              height={24}
                              alt=""
                              className="h-6 w-6 rounded-full object-cover"
                            />
                          ) : (
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white/60">
                              {row.playerName
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .slice(0, 2)
                                .toUpperCase()}
                            </span>
                          )}
                          <span className="whitespace-nowrap font-medium">
                            {row.playerName}
                          </span>
                        </div>
                      </td>

                      {/* Team */}
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1.5">
                          {row.teamLogoUrl && (
                            <img
                              src={row.teamLogoUrl}
                              width={18}
                              height={18}
                              alt=""
                              className="h-[18px] w-[18px] object-contain"
                            />
                          )}
                          <span className="whitespace-nowrap text-white/70">
                            {row.teamName}
                          </span>
                        </div>
                      </td>

                      {/* Stat-specific columns */}
                      {data.type === 'scorers' &&
                        'goals' in row && (
                          <>
                            <td className="px-3 py-2 text-center font-bold">
                              {row.goals}
                            </td>
                            <td className="hidden px-3 py-2 text-center sm:table-cell">
                              {row.appearances}
                            </td>
                            <td className="hidden px-3 py-2 text-center text-white/60 sm:table-cell">
                              {row.goalsPerAppearance}
                            </td>
                          </>
                        )}
                      {data.type === 'assists' &&
                        'assists' in row && (
                          <>
                            <td className="px-3 py-2 text-center font-bold">
                              {row.assists}
                            </td>
                            <td className="hidden px-3 py-2 text-center sm:table-cell">
                              {row.appearances}
                            </td>
                            <td className="hidden px-3 py-2 text-center text-white/60 sm:table-cell">
                              {row.assistsPerAppearance}
                            </td>
                          </>
                        )}
                      {data.type === 'disciplinary' &&
                        'yellowCards' in row && (
                          <>
                            <td className="px-3 py-2 text-center font-bold text-yellow-400">
                              {row.yellowCards}
                            </td>
                            <td className="px-3 py-2 text-center font-bold text-red-400">
                              {row.redCards}
                            </td>
                            <td className="hidden px-3 py-2 text-center sm:table-cell">
                              {row.appearances}
                            </td>
                          </>
                        )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
