import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { ThemeBackground } from '@/components/ThemeBackground';
import { Header } from '@/components/header/Header';
import { TeamHero } from '@/components/team-detail/TeamHero';
import { TeamTabs } from '@/components/team-detail/TeamTabs';
import { fetchTeamBySlug } from '@/components/team-detail/actions';

// -- Metadata ----------------------------------------------------------------

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  try {
    const team = await fetchTeamBySlug(slug);
    if (!team) return { title: 'Team Not Found | KickData' };
    return { title: `${team.name} | KickData` };
  } catch {
    return { title: 'Team | KickData' };
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

  let teamData;
  try {
    teamData = await fetchTeamBySlug(slug);
  } catch {
    return (
      <div className="min-h-screen bg-[#0a0a0f]">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="rounded-lg bg-white/5 p-8 text-center">
            <p className="text-lg font-medium text-white/90">
              Unable to Load Team
            </p>
            <p className="mt-2 text-white/70">
              Could not connect to the database. Please check your
              configuration.
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
        <Header />
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
