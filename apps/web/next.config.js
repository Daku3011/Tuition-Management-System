/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@tms/shared-types"],
  images: {
    domains: ["images.unsplash.com"],
  },
};

module.exports = nextConfig;
