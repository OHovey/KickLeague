import { cache } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { ThemeBackground } from '@/components/ThemeBackground';
import { fetchPlayerPageData } from '@/components/player-page/actions';
import type { PlayerProfile, PlayerSeasonStats, PlayerMatchInvolvement } from '@/lib/players/queries';

// Local type matching the server action return shape
interface PlayerPageData {
  player: PlayerProfile;
  seasonStats: PlayerSeasonStats;
  recentMatches: PlayerMatchInvolvement[];
}

// Deduplicate fetches between generateMetadata and page component
const getCachedPlayerData = cache((slug: string) => fetchPlayerPageData(slug));
import {
  buildBreadcrumbs,
  buildPerson,
  serializeJsonLd,
} from '@/lib/seo/structured-data';

// ISR: revalidate every 30 minutes
export const revalidate = 1800;

// -- Position Helpers --------------------------------------------------------

const POSITION_COLORS: Record<string, string> = {
  GK: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  DEF: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  MID: 'bg-green-500/20 text-green-300 border-green-500/30',
  FWD: 'bg-red-500/20 text-red-300 border-red-500/30',
};

const POSITION_I18N_KEYS: Record<string, string> = {
  GK: 'position_GK',
  DEF: 'position_DEF',
  MID: 'position_MID',
  FWD: 'position_FWD',
};

// -- Event Icons -------------------------------------------------------------

function EventBadge({
  type,
  minute,
  extraMinute,
  label,
}: {
  type: string;
  minute: number;
  extraMinute: number | null;
  label: string;
}) {
  const minuteDisplay = extraMinute
    ? `${minute}+${extraMinute}'`
    : `${minute}'`;

  let icon: React.ReactNode;
  let colorClass: string;

  switch (type) {
    case 'goal':
    case 'penalty_scored':
      icon = (
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="12" r="10" />
        </svg>
      );
      colorClass = 'bg-white/10 text-white';
      break;
    case 'yellow_card':
      icon = <span className="inline-block h-3 w-2 rounded-[1px] bg-yellow-400" />;
      colorClass = 'bg-yellow-500/10 text-yellow-300';
      break;
    case 'red_card':
      icon = <span className="inline-block h-3 w-2 rounded-[1px] bg-red-500" />;
      colorClass = 'bg-red-500/10 text-red-300';
      break;
    default:
      icon = null;
      colorClass = 'bg-white/10 text-white/60';
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${colorClass}`}
      title={`${label} ${minuteDisplay}`}
    >
      {icon}
      <span>{minuteDisplay}</span>
    </span>
  );
}

// -- Static Params -----------------------------------------------------------

export async function generateStaticParams() {
  // Skip pre-rendering player pages at build time to stay under Vercel's
  // 75 MB deployment size limit. Pages are generated on-demand via ISR.
  return [];
}

// -- Metadata ----------------------------------------------------------------

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;

  let data: PlayerPageData | null;
  try {
    data = await getCachedPlayerData(slug);
  } catch {
    return { title: 'Not Found' };
  }

  if (!data) {
    return { title: 'Not Found' };
  }

  const { player } = data;
  const tMeta = await getTranslations({ locale, namespace: 'Metadata' });
  const tPlayer = await getTranslations({ locale, namespace: 'PlayerPage' });

  const positionLabel = player.position
    ? tPlayer(POSITION_I18N_KEYS[player.position] ?? 'position_MID')
    : '';

  const title = tMeta('playerTitle', {
    player: player.name,
    team: player.teamName,
  });

  const description = tMeta('playerDescription', {
    player: player.name,
    position: positionLabel,
    team: player.teamName,
    league: player.leagueName,
    goals: String(data.seasonStats.goals),
    assists: String(data.seasonStats.assists),
    appearances: String(data.seasonStats.appearances),
  });

  const playerPathname = routing.pathnames['/players/[slug]'];

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
            typeof playerPathname === 'string'
              ? playerPathname
              : playerPathname[l];
          return [l, `/${l}${localizedPath.replace('[slug]', slug)}`];
        })
      ),
    },
  };
}

// -- Page Component ----------------------------------------------------------

export default async function PlayerPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('PlayerPage');

  let data: PlayerPageData | null;
  try {
    data = await getCachedPlayerData(slug);
  } catch {
    return notFound();
  }

  if (!data) {
    return notFound();
  }

  const { player, seasonStats, recentMatches } = data;

  // JSON-LD: BreadcrumbList
  const breadcrumbJsonLd = buildBreadcrumbs([
    { name: 'Home', url: `/${locale}` },
    {
      name: player.teamName,
      url: `/${locale}/teams/${player.teamSlug}`,
    },
    {
      name: player.name,
      url: `/${locale}/players/${player.slug}`,
    },
  ]);

  // JSON-LD: Person/Athlete
  const personJsonLd = buildPerson({
    name: player.name,
    photoUrl: player.photoUrl,
    url: `/${locale}/players/${player.slug}`,
    teamName: player.teamName,
    nationality: player.nationality,
    position: player.position,
  });

  // Stat card data
  const statCards = [
    {
      label: t('goals'),
      value: seasonStats.goals,
      colorClass: '',
    },
    {
      label: t('assists'),
      value: seasonStats.assists,
      colorClass: '',
    },
    {
      label: t('yellowCards'),
      value: seasonStats.yellowCards,
      colorClass: 'text-yellow-400',
    },
    {
      label: t('redCards'),
      value: seasonStats.redCards,
      colorClass: 'text-red-400',
    },
    {
      label: t('appearances'),
      value: seasonStats.appearances,
      colorClass: '',
    },
  ];

  // Event type i18n mapping
  const eventLabels: Record<string, string> = {
    goal: t('goal'),
    penalty_scored: t('penaltyScored'),
    yellow_card: t('yellowCard'),
    red_card: t('redCard'),
  };

  // Player initials fallback
  const initials = player.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(personJsonLd) }}
      />
      <ThemeBackground theme={player.leagueSlug} />
      <div className="min-h-screen">
        <div className="mx-auto max-w-4xl px-4 pb-12">

          {/* Back to team link */}
          <div className="py-6">
            <a
              href={`/${locale}/teams/${player.teamSlug}`}
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
              {t('backToTeam', { team: player.teamName })}
            </a>
          </div>

          {/* Hero Section */}
          <section className="mb-8">
            <div className="flex items-start gap-5">
              {/* Player photo */}
              {player.photoUrl ? (
                <img
                  src={player.photoUrl}
                  width={96}
                  height={96}
                  alt={player.name}
                  className="h-24 w-24 rounded-full border-2 border-white/20 object-cover"
                />
              ) : (
                <span className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-white/20 bg-white/10 text-2xl font-bold text-white/60">
                  {initials}
                </span>
              )}

              <div className="flex-1">
                {/* Name */}
                <h1 className="text-3xl font-bold text-white sm:text-4xl">
                  {player.name}
                </h1>

                {/* Position + Nationality + Number */}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {player.position && (
                    <span
                      className={`rounded-full border px-3 py-0.5 text-xs font-semibold ${
                        POSITION_COLORS[player.position] ??
                        'bg-white/10 text-white/70 border-white/20'
                      }`}
                    >
                      {t(POSITION_I18N_KEYS[player.position] ?? 'position_MID')}
                    </span>
                  )}
                  {player.nationality && (
                    <span className="text-sm text-white/60">
                      {player.nationality}
                    </span>
                  )}
                  {player.number != null && (
                    <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-bold text-white/70">
                      #{player.number}
                    </span>
                  )}
                </div>

                {/* Team + League */}
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <a
                    href={`/${locale}/teams/${player.teamSlug}`}
                    className="flex items-center gap-1.5 text-sm text-white/80 transition-colors hover:text-white"
                  >
                    {player.teamLogoUrl && (
                      <img
                        src={player.teamLogoUrl}
                        width={20}
                        height={20}
                        alt=""
                        className="h-5 w-5 object-contain"
                      />
                    )}
                    {player.teamName}
                  </a>
                  <span className="text-white/30">|</span>
                  <span className="flex items-center gap-1.5 text-sm text-white/60">
                    {player.leagueLogoUrl && (
                      <img
                        src={player.leagueLogoUrl}
                        width={16}
                        height={16}
                        alt=""
                        className="h-4 w-4 object-contain"
                      />
                    )}
                    {player.leagueName}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Season Stats Cards */}
          <section className="mb-8">
            <h2 className="mb-4 text-lg font-semibold text-white/90">
              {t('seasonStats')}
            </h2>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
              {statCards.map((card) => (
                <div
                  key={card.label}
                  className="rounded-xl border border-white/10 bg-white/5 p-4 text-center backdrop-blur-sm"
                >
                  <p
                    className={`text-2xl font-bold ${card.colorClass || 'text-white'}`}
                  >
                    {card.value}
                  </p>
                  <p className="mt-1 text-xs text-white/50">{card.label}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Recent Matches */}
          <section>
            <h2 className="mb-4 text-lg font-semibold text-white/90">
              {t('recentMatches')}
            </h2>

            {recentMatches.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-sm">
                <p className="text-white/50">{t('noRecentMatches')}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentMatches.map((match) => {
                  const matchDate = new Date(match.kickoff);
                  const dateStr = matchDate.toLocaleDateString(locale, {
                    month: 'short',
                    day: 'numeric',
                  });

                  return (
                    <a
                      key={match.fixtureId}
                      href={`/${locale}/matches/${match.fixtureId}`}
                      className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm transition-colors hover:bg-white/10"
                    >
                      {/* Date + Matchweek */}
                      <div className="w-16 shrink-0 text-center">
                        <p className="text-xs font-medium text-white/80">
                          {dateStr}
                        </p>
                        {match.matchweek != null && (
                          <p className="text-[10px] text-white/40">
                            {t('matchweek', { week: String(match.matchweek) })}
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

                      {/* Player events */}
                      <div className="hidden shrink-0 flex-wrap justify-end gap-1 sm:flex">
                        {match.events.map((event, idx) => (
                          <EventBadge
                            key={`${event.type}-${event.minute}-${idx}`}
                            type={event.type}
                            minute={event.minute}
                            extraMinute={event.extraMinute}
                            label={eventLabels[event.type] ?? event.type}
                          />
                        ))}
                      </div>
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
