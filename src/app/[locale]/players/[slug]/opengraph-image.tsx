import { ImageResponse } from 'next/og';
import { getPlayerBySlug, getPlayerSeasonStats } from '@/lib/players/queries';

export const alt = 'Player profile';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const POSITION_LABELS: Record<string, string> = {
  GK: 'Goalkeeper',
  DEF: 'Defender',
  MID: 'Midfielder',
  FWD: 'Forward',
};

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = await params;

  let player: Awaited<ReturnType<typeof getPlayerBySlug>> = null;
  try {
    player = await getPlayerBySlug(slug);
  } catch {
    // fall through to fallback
  }

  if (!player) {
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

  const positionLabel = player.position
    ? POSITION_LABELS[player.position] ?? player.position
    : null;

  // Fetch season stats for the stat line
  let statLine = '';
  try {
    const stats = await getPlayerSeasonStats(
      player.id,
      player.leagueId,
      player.currentSeason,
    );
    statLine = `${stats.goals} Goals | ${stats.assists} Assists | ${stats.appearances} Apps`;
  } catch {
    // stat line omitted on error
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
        <div style={{ fontSize: 56, fontWeight: 800 }}>{player.name}</div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginTop: 12,
            fontSize: 28,
            opacity: 0.7,
          }}
        >
          {positionLabel && <span>{positionLabel}</span>}
          {positionLabel && <span style={{ opacity: 0.4 }}>|</span>}
          <span>{player.teamName}</span>
        </div>
        {statLine && (
          <div style={{ fontSize: 22, marginTop: 16, opacity: 0.55 }}>
            {statLine}
          </div>
        )}
        <div style={{ fontSize: 20, marginTop: 24, opacity: 0.4 }}>
          KickLeague
        </div>
      </div>
    ),
    { ...size },
  );
}
