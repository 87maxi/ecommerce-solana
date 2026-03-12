/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,

    // Silence workspace root warning about multiple lockfiles
    outputFileTracingRoot: require('path').join(__dirname, '../../'),

    // Environment variables
    env: {
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
        NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS,
        NEXT_PUBLIC_PASARELA_PAGO_URL: process.env.NEXT_PUBLIC_PASARELA_PAGO_URL,
        NEXT_PUBLIC_WEB_CUSTOMER_URL: process.env.NEXT_PUBLIC_WEB_CUSTOMER_URL,
        NEXT_PUBLIC_NETWORK_NAME: process.env.NEXT_PUBLIC_NETWORK_NAME,
        NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    },

    // CORS headers for potential future API routes
    async headers() {
        return [
            {
                source: "/api/:path*",
                headers: [
                    { key: "Access-Control-Allow-Credentials", value: "true" },
                    { key: "Access-Control-Allow-Origin", value: "*" },
                    { key: "Access-Control-Allow-Methods", value: "GET,DELETE,PATCH,POST,PUT" },
                    { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" },
                ]
            }
        ]
    },
};

module.exports = nextConfig;
