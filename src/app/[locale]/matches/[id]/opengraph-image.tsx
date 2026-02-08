import { ImageResponse } from 'next/og';
import { eq } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { getDb, isDatabaseConfigured } from '@/db/connection';
import { fixtures, teams } from '@/db/schema';

export const alt = 'Match details';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = await params;
  const fixtureId = parseInt(id, 10);

  if (isNaN(fixtureId)) {
    return fallbackImage();
  }

  try {
    if (!isDatabaseConfigured()) {
      return fallbackImage();
    }

    const homeTeam = alias(teams, 'homeTeam');
    const awayTeam = alias(teams, 'awayTeam');

    const rows = await getDb()
      .select({
        status: fixtures.status,
        homeTeamName: homeTeam.name,
        homeTeamShortName: homeTeam.shortName,
        homeTeamLogoUrl: homeTeam.logoUrl,
        awayTeamName: awayTeam.name,
        awayTeamShortName: awayTeam.shortName,
        awayTeamLogoUrl: awayTeam.logoUrl,
      })
      .from(fixtures)
      .innerJoin(homeTeam, eq(fixtures.homeTeamId, homeTeam.id))
      .innerJoin(awayTeam, eq(fixtures.awayTeamId, awayTeam.id))
      .where(eq(fixtures.id, fixtureId))
      .limit(1);

    const match = rows[0];
    if (!match) {
      return fallbackImage();
    }

    const homeName = match.homeTeamShortName ?? match.homeTeamName;
    const awayName = match.awayTeamShortName ?? match.awayTeamName;
    const statusLabel = match.status === 'finished' ? 'Full Time' : 'Upcoming';

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
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '32px',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              {match.homeTeamLogoUrl && (
                <img
                  src={match.homeTeamLogoUrl}
                  width={80}
                  height={80}
                  style={{ marginBottom: 12 }}
                />
              )}
              <div style={{ fontSize: 36, fontWeight: 700 }}>{homeName}</div>
            </div>
            <div
              style={{
                fontSize: 28,
                fontWeight: 600,
                opacity: 0.5,
                padding: '0 16px',
              }}
            >
              vs
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              {match.awayTeamLogoUrl && (
                <img
                  src={match.awayTeamLogoUrl}
                  width={80}
                  height={80}
                  style={{ marginBottom: 12 }}
                />
              )}
              <div style={{ fontSize: 36, fontWeight: 700 }}>{awayName}</div>
            </div>
          </div>
          <div style={{ fontSize: 20, marginTop: 24, opacity: 0.5 }}>
            {statusLabel}
          </div>
          <div style={{ fontSize: 18, marginTop: 12, opacity: 0.3 }}>
            KickLeague
          </div>
        </div>
      ),
      { ...size },
    );
  } catch {
    return fallbackImage();
  }
}

function fallbackImage() {
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
    { width: 1200, height: 630 },
  );
}
