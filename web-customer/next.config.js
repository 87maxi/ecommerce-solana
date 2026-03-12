/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Configuración para Turbopack (Next.js 15+)
    turbo: {
      resolveAlias: {
        fs: false,
        net: false,
        tls: false,
        "pino-pretty": false,
        lokijs: false,
        encoding: false,
      },
    },
  },
  // Configuración de Webpack para el bundle del cliente (Retrocompatibilidad)
  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    config.externals.push("pino-pretty", "lokijs", "encoding");
    return config;
  },
};

module.exports = nextConfig;
