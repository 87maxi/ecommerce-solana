/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Excluir librerías de Node.js del bundle del cliente
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
