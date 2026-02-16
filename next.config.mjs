/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['ui-avatars.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
}

export default nextConfig
