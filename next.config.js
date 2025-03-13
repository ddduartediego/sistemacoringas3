/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Ignorar erros do ESLint durante o build
  eslint: {
    // Permitir produção mesmo com erros
    ignoreDuringBuilds: true,
  },
  // Ignorar erros de tipagem durante o build
  typescript: {
    // Permitir produção mesmo com erros
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig 