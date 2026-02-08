import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { ThemeBackground } from '@/components/ThemeBackground';

import { TeamHero } from '@/components/team-detail/TeamHero';
import { TeamTabs } from '@/components/team-detail/TeamTabs';
import { fetchTeamBySlug } from '@/components/team-detail/actions';

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
    return { title: tMeta('teamTitle', { team: team.name }) };
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

  return (
    <>
      <ThemeBackground theme={teamData.leagueSlug} />
      <div className="min-h-screen">
        <div className="mx-auto max-w-6xl px-4 pb-12">
          <TeamHero team={teamData} />
          <TeamTabs
            teamId={teamData.id}
            leagueId={teamData.leagueId}
            season={teamData.currentSeason}
            teamName={teamData.name}
            hasXg={teamData.hasXg}
          />
        </div>
      </div>
    </>
  );
}
