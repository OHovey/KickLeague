import { ImageResponse } from 'next/og';

export const alt = 'KickLeague - Football intelligence, visualized';
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
        {/* Football icon */}
        <svg width="80" height="80" viewBox="0 0 48 48" fill="none">
          <circle cx="24" cy="24" r="22" stroke="#1a1a2e" strokeWidth="2.5" />
          <polygon
            points="24,10 33.5,17 30,28.5 18,28.5 14.5,17"
            stroke="#1a1a2e"
            strokeWidth="2"
            fill="none"
            strokeLinejoin="round"
          />
          <line x1="24" y1="10" x2="24" y2="2" stroke="#1a1a2e" strokeWidth="1.5" />
          <line x1="33.5" y1="17" x2="44" y2="12" stroke="#1a1a2e" strokeWidth="1.5" />
          <line x1="30" y1="28.5" x2="40" y2="38" stroke="#1a1a2e" strokeWidth="1.5" />
          <line x1="18" y1="28.5" x2="8" y2="38" stroke="#1a1a2e" strokeWidth="1.5" />
          <line x1="14.5" y1="17" x2="4" y2="12" stroke="#1a1a2e" strokeWidth="1.5" />
        </svg>
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            fontStyle: 'italic',
            letterSpacing: '-1px',
            marginTop: 16,
          }}
        >
          KickLeague
        </div>
        <div style={{ fontSize: 24, marginTop: 16, opacity: 0.6 }}>
          Football intelligence, visualized
        </div>
      </div>
    ),
    { ...size },
  );
}
