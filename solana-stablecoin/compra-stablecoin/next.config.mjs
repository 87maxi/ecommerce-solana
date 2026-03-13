/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

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
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        "pino-pretty": false,
        lokijs: false,
        encoding: false,
      };
    }
    return config;
  },

  // CORS headers para rutas API
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET,DELETE,PATCH,POST,PUT",
          },
          {
            key: "Access-Control-Allow-Headers",
            value:
              "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
