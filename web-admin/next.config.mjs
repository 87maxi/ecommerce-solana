/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Configuración para Turbopack (Next.js 15+)
    turbo: {
      resolveAlias: {
        fs: false,
        'pino-pretty': false,
        lokijs: false,
        encoding: false,
      },
    },
  },
  // Configuración de Webpack para el bundle del cliente (Retrocompatibilidad)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        'pino-pretty': false,
        lokijs: false,
        encoding: false,
      };
    }
    return config;
  },
};

export default nextConfig;
