import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@vis.gl/react-google-maps'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Required for PostHog trailing-slash endpoints (/e/, etc.).
  // Proxy itself lives in netlify.toml — Next rewrites break PostHog on Netlify.
  skipTrailingSlashRedirect: true,
}

export default nextConfig
