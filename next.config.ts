import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  reactStrictMode: false,
  async redirects() {
    return [
      {
        source: '/setup-wizard',
        destination: '/setup-wizard/1',
        permanent: true,
      },
      {
        source: '/manage-repo',
        destination: '/',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
