import { ImageResponse } from 'next/og';
import { getTeamBySlug, getTeamCurrentStandings } from '@/lib/teams/queries';

export const alt = 'Team page';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = await params;
  const team = await getTeamBySlug(slug);

  if (!team) {
    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            fontSize: 48,
            background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
            color: '#1a1a2e',
            width: '100%',
            height: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'sans-serif',
          }}
        >
          KickLeague
        </div>
      ),
      { ...size },
    );
  }

  const standings = await getTeamCurrentStandings(
    team.id,
    team.leagueId,
    team.currentSeason,
  );
  const position = standings?.position;

  const ordinal = position ? getOrdinalSuffix(position) : null;
  const positionText = ordinal
    ? `${position}${ordinal} in ${team.leagueName}`
    : team.leagueName;

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
          color: '#1a1a2e',
          fontFamily: 'sans-serif',
        }}
      >
        {team.logoUrl && (
          <img
            src={team.logoUrl}
            width={120}
            height={120}
            style={{ marginBottom: 24 }}
          />
        )}
        <div style={{ fontSize: 56, fontWeight: 800 }}>{team.name}</div>
        <div style={{ fontSize: 28, marginTop: 12, opacity: 0.7 }}>
          {positionText}
        </div>
        <div style={{ fontSize: 20, marginTop: 24, opacity: 0.4 }}>
          KickLeague
        </div>
      </div>
    ),
    { ...size },
  );
}

function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}
