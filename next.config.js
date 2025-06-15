/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  async rewrites() {
    return [
      {
        // tudo em /api que NÃO comece com auth/ vai pro seu backend
        source: '/api/:path((?!auth/).*)',
        destination: process.env.BACKEND_URL
          ? `${process.env.BACKEND_URL}/api/:path`
          : 'http://localhost:8080/api/:path',
      },
    ]
  },
};
module.exports = nextConfig;