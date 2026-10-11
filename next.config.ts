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
  outputFileTracingIncludes: {
    '/api/social-studio': ['./social/instagram/**/*'],
    '/api/social-studio/asset': ['./social/instagram/**/*'],
  },
  // Lower parallel SSG workers — Netlify builds were SIGKILL'd mid page generation.
  experimental: {
    cpus: 1,
    workerThreads: false,
  },
}

export default nextConfig
