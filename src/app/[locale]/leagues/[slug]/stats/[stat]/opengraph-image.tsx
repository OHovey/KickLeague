import { ImageResponse } from 'next/og';
import { LEAGUE_THEMES, type League } from '@/lib/themes/league-themes';

export const alt = 'Stat leaderboard';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const STAT_DISPLAY_NAMES: Record<string, string> = {
  'top-scorers': 'Top Scorers',
  'top-assists': 'Top Assists',
  disciplinary: 'Disciplinary',
};

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; slug: string; stat: string }>;
}) {
  const { slug, stat } = await params;
  const theme = LEAGUE_THEMES[slug as League];
  const statName = STAT_DISPLAY_NAMES[stat];

  if (!theme || !statName) {
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
        <div style={{ fontSize: 56, fontWeight: 800 }}>{statName}</div>
        <div style={{ fontSize: 28, marginTop: 12, opacity: 0.7 }}>
          {theme.name}
        </div>
        <div style={{ fontSize: 20, marginTop: 24, opacity: 0.4 }}>
          KickLeague
        </div>
      </div>
    ),
    { ...size },
  );
}
