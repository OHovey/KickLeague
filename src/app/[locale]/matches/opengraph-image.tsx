import { ImageResponse } from 'next/og';

export const alt = 'KickLeague Matches';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
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
        <div style={{ fontSize: 56, fontWeight: 800 }}>
          Results &amp; Fixtures
        </div>
        <div style={{ fontSize: 24, marginTop: 16, opacity: 0.5 }}>
          KickLeague
        </div>
      </div>
    ),
    { ...size },
  );
}
