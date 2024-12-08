/** @type {import('next').NextConfig} */

module.exports = {
  // nextConfig
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
