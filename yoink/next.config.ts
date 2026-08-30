import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Lets another device on the local network load development assets when needed.
  allowedDevOrigins: ['10.19.149.11', '10.19.66.187'],
}

export default nextConfig
