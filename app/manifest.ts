import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'MobileTireRepair24',
    short_name: 'TireRepair24',
    description:
      'The #1 directory for mobile tire repair services across the United States.',
    start_url: '/',
    display: 'standalone',
    background_color: '#F8FAFC',
    theme_color: '#0F172A',
    icons: [{ src: '/favicon.png', sizes: '512x512', type: 'image/png' }],
  };
}
