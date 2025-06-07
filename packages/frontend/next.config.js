/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    transpilePackages: ['@todolist/shared'],
  },
};

module.exports = nextConfig;