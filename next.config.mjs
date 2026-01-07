/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverActions: {
      allowedOrigins: [],
    },
  },
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
