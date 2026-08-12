import { ImageResponse } from 'next/og';
import { getCityBySlug, getStateBySlug } from '@/lib/data';

export const alt = 'Mobile Tire Repair';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({
  params,
}: {
  params: Promise<{ state: string; city: string }>;
}) {
  const { state: stateSlug, city: citySlug } = await params;
  const [state, city] = await Promise.all([
    getStateBySlug(stateSlug),
    getCityBySlug(citySlug),
  ]);
  const heading = city && state ? `Mobile Tire Repair in ${city.name}, ${state.code}` : 'Mobile Tire Repair';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          backgroundColor: '#0F172A',
          color: 'white',
          padding: 80,
        }}
      >
        <div style={{ fontSize: 30, color: '#60A5FA', fontWeight: 700 }}>
          MobileTireRepair24
        </div>
        <div style={{ fontSize: 64, fontWeight: 700, marginTop: 24, lineHeight: 1.15 }}>
          {heading}
        </div>
        <div style={{ fontSize: 28, color: '#CBD5E1', marginTop: 24 }}>
          Fast on-site service — technicians come to you.
        </div>
      </div>
    ),
    { ...size }
  );
}
