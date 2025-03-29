/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['placehold.co'], // Allow images from our placeholder service
  },
  env: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
    OPENAI_ORG_ID: process.env.OPENAI_ORG_ID || '',
  },
}

module.exports = nextConfig