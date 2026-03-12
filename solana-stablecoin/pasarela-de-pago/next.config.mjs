/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Exclude server-side libraries from client-side bundle to prevent errors
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        "pino-pretty": false,
        "lokijs": false,
        "encoding": false,
      };
    }
    return config;
  },
};

export default nextConfig;
