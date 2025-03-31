/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  pageExtensions: ['jsx', 'js', 'ts', 'tsx'],
  // Prevent typescript from causing issues
  typescript: {
    ignoreBuildErrors: true,
  },
  // Disable linting during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['placehold.co'], // Allow images from our placeholder service
  },
  env: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
    OPENAI_ORG_ID: process.env.OPENAI_ORG_ID || '',
    NEXT_PUBLIC_PORT: '3002'
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `http://localhost:3002/api/:path*`,
      },
    ]
  },
}

module.exports = nextConfig