/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
