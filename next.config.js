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
  // Add trailing slash to help with URL consistency
  trailingSlash: true,
  // Add output for standalone mode
  output: 'standalone',
  images: {
    domains: [
      'placehold.co',
      'th.bing.com',
      'i.imgur.com',
      'images.unsplash.com',
      'via.placeholder.com',
      'picsum.photos',
      'cloudflare-ipfs.com',
      'loremflickr.com',
      'res.cloudinary.com',
      'text.pollinations.ai',
      'image.pollinations.ai'
    ],
    unoptimized: true,
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
  // Update rewrites to match the port being used
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