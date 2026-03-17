/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["stripe", "@stripe/stripe-js"],
  turbopack: {},
  // Configuración de Webpack para el bundle del cliente (Retrocompatibilidad)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        "pino-pretty": false,
        lokijs: false,
        encoding: false,
      };
    }
    return config;
  },
};

export default nextConfig;
