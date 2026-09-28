import type { NextConfig } from 'next';
const plausibleOrigin = 'https://analytics.mgck.ink';

const nextConfig: NextConfig = {
  output: 'standalone',
  async redirects() {
    return [
      { source: '/preview', destination: '/', permanent: true },
      { source: '/preview/:path+', destination: '/:path+', permanent: true },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/ingest/js/script.js',
        destination: `${plausibleOrigin}/js/script.js`,
      },
      {
        source: '/ingest/api/event',
        destination: `${plausibleOrigin}/api/event`,
      },
    ];
  },
};

export default nextConfig;
