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
  // Lower parallel SSG workers — Netlify builds were SIGKILL'd mid page generation.
  experimental: {
    cpus: 1,
    workerThreads: false,
  },
  // Avoid retaining prerender source maps in memory during large SSG runs.
  enablePrerenderSourceMaps: false,
}

export default nextConfig
