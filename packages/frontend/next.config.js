/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@todolist/shared'],
  eslint: {
    dirs: ['src'],
  },
};

module.exports = nextConfig;
