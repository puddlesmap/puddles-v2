import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@vis.gl/react-google-maps'],
  eslint: {
    ignoreDuringBuilds: true,
  },
}

export default nextConfig
