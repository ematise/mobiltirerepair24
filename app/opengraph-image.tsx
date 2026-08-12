import { ImageResponse } from 'next/og';

export const alt = 'MobileTireRepair24 — Find Mobile Tire Repair Near You';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0F172A',
          color: 'white',
          padding: 80,
        }}
      >
        <div style={{ fontSize: 72, fontWeight: 700, display: 'flex' }}>
          MobileTireRepair<span style={{ color: '#60A5FA' }}>24</span>
        </div>
        <div style={{ fontSize: 32, color: '#CBD5E1', marginTop: 24 }}>
          Find Mobile Tire Repair Near You — Anywhere in the US
        </div>
      </div>
    ),
    { ...size }
  );
}
