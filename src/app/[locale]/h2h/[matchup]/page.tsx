import { cache } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { ThemeBackground } from '@/components/ThemeBackground';
import { fetchH2HPageData } from '@/components/h2h-page/actions';
import {
  type H2HMeeting,
  type H2HAggregateRecord,
  type TeamFormAndPosition,
} from '@/lib/h2h/queries';
import {
  buildBreadcrumbs,
  serializeJsonLd,
} from '@/lib/seo/structured-data';

// Local type matching the server action return shape
interface H2HPageData {
  team1: { id: number; name: string; slug: string; logoUrl: string | null };
  team2: { id: number; name: string; slug: string; logoUrl: string | null };
  meetings: H2HMeeting[];
  aggregate: H2HAggregateRecord;
  team1Form: TeamFormAndPosition | null;
  team2Form: TeamFormAndPosition | null;
  leagueSlug: string;
}

// Deduplicate fetches between generateMetadata and page component
const getCachedH2HData = cache((matchup: string) => fetchH2HPageData(matchup));

// ISR: revalidate every 30 minutes
export const revalidate = 1800;

// -- Form Badge Helper -------------------------------------------------------

const FORM_COLORS: Record<string, string> = {
  W: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  D: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  L: 'bg-red-500/20 text-red-300 border-red-500/30',
};

function FormBadgesInline({ form }: { form: string | null }) {
  if (!form) return null;
  return (
    <div className="flex gap-1">
      {form.split('').map((ch, i) => (
        <span
          key={i}
          className={`inline-flex h-6 w-6 items-center justify-center rounded border text-[10px] font-bold ${
            FORM_COLORS[ch] ?? 'bg-white/10 text-white/50 border-white/10'
          }`}
        >
          {ch}
        </span>
      ))}
    </div>
  );
}

// -- Ordinal Suffix Helper ---------------------------------------------------

function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// -- Static Params -----------------------------------------------------------

export async function generateStaticParams() {
  // Skip pre-rendering h2h pages at build time to stay under Vercel's
  // 75 MB deployment size limit. Pages are generated on-demand via ISR.
  return [];
}

// -- Metadata ----------------------------------------------------------------

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; matchup: string }>;
}): Promise<Metadata> {
  const { locale, matchup } = await params;

  let data: H2HPageData | null;
  try {
    data = await getCachedH2HData(matchup);
  } catch {
    return { title: 'Not Found' };
  }

  if (!data) {
    return { title: 'Not Found' };
  }

  const tMeta = await getTranslations({ locale, namespace: 'Metadata' });

  const title = tMeta('h2hTitle', {
    team1: data.team1.name,
    team2: data.team2.name,
  });

  const description = tMeta('h2hDescription', {
    team1: data.team1.name,
    team2: data.team2.name,
    meetings: String(data.aggregate.totalMeetings),
  });

  const h2hPathname = routing.pathnames['/h2h/[matchup]'];

  return {
    title,
    description,
    openGraph: {
      title: `${data.team1.name} vs ${data.team2.name} | KickLeague`,
      description,
      type: 'website',
    },
    alternates: {
      languages: Object.fromEntries(
        routing.locales.map((l) => {
          const localizedPath =
            typeof h2hPathname === 'string'
              ? h2hPathname
              : h2hPathname[l];
          return [l, `/${l}${localizedPath.replace('[matchup]', matchup)}`];
        })
      ),
    },
  };
}

// -- Page Component ----------------------------------------------------------

export default async function H2HPage({
  params,
}: {
  params: Promise<{ locale: string; matchup: string }>;
}) {
  const { locale, matchup } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('H2HPage');

  let data: H2HPageData | null;
  try {
    data = await getCachedH2HData(matchup);
  } catch {
    return notFound();
  }

  if (!data) {
    return notFound();
  }

  const { team1, team2, meetings, aggregate, team1Form, team2Form, leagueSlug } = data;

  // JSON-LD: BreadcrumbList
  const breadcrumbJsonLd = buildBreadcrumbs([
    { name: 'Home', url: `/${locale}` },
    { name: team1.name, url: `/${locale}/teams/${team1.slug}` },
    {
      name: `${team1.name} vs ${team2.name}`,
      url: `/${locale}/h2h/${matchup}`,
    },
  ]);

  // Most recent meeting (first in list, already sorted by kickoff DESC)
  const mostRecent = meetings[0];
  const mostRecentDate = new Date(mostRecent.kickoff);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd) }}
      />
      <ThemeBackground theme={leagueSlug} />
      <div className="min-h-screen">
        <div className="mx-auto max-w-4xl px-4 pb-12">

          {/* Back navigation */}
          <div className="py-6">
            <a
              href={`/${locale}/teams/${team1.slug}`}
              className="inline-flex items-center gap-1 text-sm text-white/50 transition-colors hover:text-white/80"
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
              {t('backToTeam', { team: team1.name })}
            </a>
          </div>

          {/* Team Headers */}
          <section className="mb-8">
            <div className="flex items-center justify-between gap-4">
              {/* Team 1 */}
              <a
                href={`/${locale}/teams/${team1.slug}`}
                className="flex flex-1 flex-col items-center gap-2 transition-opacity hover:opacity-80"
              >
                {team1.logoUrl && (
                  <img
                    src={team1.logoUrl}
                    width={64}
                    height={64}
                    alt=""
                    className="h-16 w-16 object-contain"
                  />
                )}
                <h2 className="text-center text-lg font-bold text-white sm:text-xl">
                  {team1.name}
                </h2>
              </a>

              {/* VS badge */}
              <div className="shrink-0">
                <span className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-white/60 backdrop-blur-sm">
                  {t('vsLabel')}
                </span>
              </div>

              {/* Team 2 */}
              <a
                href={`/${locale}/teams/${team2.slug}`}
                className="flex flex-1 flex-col items-center gap-2 transition-opacity hover:opacity-80"
              >
                {team2.logoUrl && (
                  <img
                    src={team2.logoUrl}
                    width={64}
                    height={64}
                    alt=""
                    className="h-16 w-16 object-contain"
                  />
                )}
                <h2 className="text-center text-lg font-bold text-white sm:text-xl">
                  {team2.name}
                </h2>
              </a>
            </div>
          </section>

          {/* H1 for SEO */}
          <h1 className="sr-only">
            {team1.name} {t('vsLabel')} {team2.name} - {t('title')}
          </h1>

          {/* Aggregate Record Card */}
          <section className="mb-8">
            <h2 className="mb-4 text-lg font-semibold text-white/90">
              {t('aggregateRecord')}
            </h2>
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              {/* Win/Draw/Win bar */}
              <div className="flex items-center justify-between gap-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-emerald-400">
                    {aggregate.team1Wins}
                  </p>
                  <p className="mt-1 text-xs text-white/50">
                    {t('wins')}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-yellow-400">
                    {aggregate.draws}
                  </p>
                  <p className="mt-1 text-xs text-white/50">
                    {t('draws')}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-emerald-400">
                    {aggregate.team2Wins}
                  </p>
                  <p className="mt-1 text-xs text-white/50">
                    {t('wins')}
                  </p>
                </div>
              </div>

              {/* Stats row */}
              <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
                <div className="text-center">
                  <p className="text-lg font-semibold text-white">
                    {aggregate.team1Goals}
                  </p>
                  <p className="text-xs text-white/50">{t('totalGoals')}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-white/60">
                    {t('meetings', { count: aggregate.totalMeetings })}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-white">
                    {aggregate.team2Goals}
                  </p>
                  <p className="text-xs text-white/50">{t('totalGoals')}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Most Recent Meeting */}
          <section className="mb-8">
            <h2 className="mb-4 text-lg font-semibold text-white/90">
              {t('mostRecentMeeting')}
            </h2>
            <a
              href={`/${locale}/matches/${mostRecent.fixtureId}`}
              className="block rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm transition-colors hover:bg-white/10"
            >
              {/* Date and venue */}
              <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-white/50">
                <span>
                  {mostRecentDate.toLocaleDateString(locale, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
                {mostRecent.matchweek != null && (
                  <>
                    <span className="text-white/20">|</span>
                    <span>MW {mostRecent.matchweek}</span>
                  </>
                )}
                {mostRecent.venue && (
                  <>
                    <span className="text-white/20">|</span>
                    <span>{mostRecent.venue}</span>
                  </>
                )}
              </div>

              {/* Score display */}
              <div className="flex items-center justify-center gap-4">
                <div className="flex flex-1 items-center justify-end gap-2">
                  <span className="text-right text-base font-medium text-white/90 sm:text-lg">
                    {mostRecent.homeTeamName}
                  </span>
                  {mostRecent.homeTeamLogoUrl && (
                    <img
                      src={mostRecent.homeTeamLogoUrl}
                      width={28}
                      height={28}
                      alt=""
                      className="h-7 w-7 object-contain"
                    />
                  )}
                </div>

                <span className="shrink-0 rounded-lg bg-white/10 px-4 py-2 text-xl font-bold text-white">
                  {mostRecent.homeScore ?? '-'} - {mostRecent.awayScore ?? '-'}
                </span>

                <div className="flex flex-1 items-center gap-2">
                  {mostRecent.awayTeamLogoUrl && (
                    <img
                      src={mostRecent.awayTeamLogoUrl}
                      width={28}
                      height={28}
                      alt=""
                      className="h-7 w-7 object-contain"
                    />
                  )}
                  <span className="text-base font-medium text-white/90 sm:text-lg">
                    {mostRecent.awayTeamName}
                  </span>
                </div>
              </div>
            </a>
          </section>

          {/* Form Comparison */}
          {(team1Form || team2Form) && (
            <section className="mb-8">
              <h2 className="mb-4 text-lg font-semibold text-white/90">
                {t('formComparison')}
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {/* Team 1 Form */}
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                  <div className="mb-3 flex items-center gap-2">
                    {team1.logoUrl && (
                      <img
                        src={team1.logoUrl}
                        width={24}
                        height={24}
                        alt=""
                        className="h-6 w-6 object-contain"
                      />
                    )}
                    <span className="truncate text-sm font-semibold text-white/90">
                      {team1.name}
                    </span>
                  </div>
                  {team1Form ? (
                    <>
                      <div className="mb-2 flex items-center gap-2">
                        <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-bold text-white/80">
                          {getOrdinalSuffix(team1Form.position)}
                        </span>
                        <span className="text-xs text-white/50">
                          {t('points', { count: team1Form.points })}
                        </span>
                      </div>
                      <FormBadgesInline form={team1Form.form} />
                    </>
                  ) : (
                    <p className="text-xs text-white/40">{t('noFormData')}</p>
                  )}
                </div>

                {/* Team 2 Form */}
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                  <div className="mb-3 flex items-center gap-2">
                    {team2.logoUrl && (
                      <img
                        src={team2.logoUrl}
                        width={24}
                        height={24}
                        alt=""
                        className="h-6 w-6 object-contain"
                      />
                    )}
                    <span className="truncate text-sm font-semibold text-white/90">
                      {team2.name}
                    </span>
                  </div>
                  {team2Form ? (
                    <>
                      <div className="mb-2 flex items-center gap-2">
                        <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-bold text-white/80">
                          {getOrdinalSuffix(team2Form.position)}
                        </span>
                        <span className="text-xs text-white/50">
                          {t('points', { count: team2Form.points })}
                        </span>
                      </div>
                      <FormBadgesInline form={team2Form.form} />
                    </>
                  ) : (
                    <p className="text-xs text-white/40">{t('noFormData')}</p>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* All Meetings List */}
          <section>
            <h2 className="mb-4 text-lg font-semibold text-white/90">
              {t('allMeetings')}
            </h2>

            {meetings.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-sm">
                <p className="text-white/50">{t('noMeetings')}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {meetings.map((match) => {
                  const matchDate = new Date(match.kickoff);
                  const dateStr = matchDate.toLocaleDateString(locale, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });

                  return (
                    <a
                      key={match.fixtureId}
                      href={`/${locale}/matches/${match.fixtureId}`}
                      className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm transition-colors hover:bg-white/10"
                    >
                      {/* Date + Matchweek */}
                      <div className="w-20 shrink-0 text-center">
                        <p className="text-xs font-medium text-white/80">
                          {dateStr}
                        </p>
                        {match.matchweek != null && (
                          <p className="text-[10px] text-white/40">
                            MW {match.matchweek}
                          </p>
                        )}
                      </div>

                      {/* Teams + Score */}
                      <div className="flex flex-1 items-center gap-2 overflow-hidden">
                        <div className="flex flex-1 items-center justify-end gap-1.5 overflow-hidden">
                          <span className="truncate text-right text-sm text-white/90">
                            {match.homeTeamName}
                          </span>
                          {match.homeTeamLogoUrl && (
                            <img
                              src={match.homeTeamLogoUrl}
                              width={18}
                              height={18}
                              alt=""
                              className="h-[18px] w-[18px] shrink-0 object-contain"
                            />
                          )}
                        </div>

                        <span className="shrink-0 rounded bg-white/10 px-2 py-0.5 text-sm font-bold text-white">
                          {match.homeScore ?? '-'} - {match.awayScore ?? '-'}
                        </span>

                        <div className="flex flex-1 items-center gap-1.5 overflow-hidden">
                          {match.awayTeamLogoUrl && (
                            <img
                              src={match.awayTeamLogoUrl}
                              width={18}
                              height={18}
                              alt=""
                              className="h-[18px] w-[18px] shrink-0 object-contain"
                            />
                          )}
                          <span className="truncate text-sm text-white/90">
                            {match.awayTeamName}
                          </span>
                        </div>
                      </div>

                      {/* Venue (hidden on mobile) */}
                      {match.venue && (
                        <div className="hidden w-32 shrink-0 text-right sm:block">
                          <p className="truncate text-xs text-white/40">
                            {match.venue}
                          </p>
                        </div>
                      )}
                    </a>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
