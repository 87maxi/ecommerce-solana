/** @type {import('next').NextConfig} */
const nextConfig = {
  // Es importante para asegurar que Stripe.js se cargue correctamente
  // y que el entorno de serverless de Next.js no interfiera con sus dependencias.
  // Permite que Next.js compile estos paquetes de forma normal.
  experimental: {
    serverComponentsExternalPackages: ["stripe", "@stripe/stripe-js"],
  },

  // Configuración de Webpack para el bundle del cliente
  webpack: (config, { isServer }) => {
    // Excluir librerías de Node.js del bundle del cliente para evitar errores
    // (problemas con 'websocket', 'pino', etc.)
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

  // Opcional: Configurar un tiempo de espera más largo para las rutas API
  // Útil si el procesamiento del webhook puede tomar más de 10 segundos (default)
  // En Next.js 14, esto se controla en el entorno Vercel o con configuraciones del serverless provider.
  // Para desarrollo local, un timeout de ~30s puede ser suficiente.
  // En un entorno de producción real, este timeout lo gestiona la plataforma serverless.
  // api: {
  //   bodyParser: {
  //     sizeLimit: '1mb', // Ajustar si el payload del webhook es muy grande
  //   },
  //   externalResolver: true, // Para webhooks donde no se espera una respuesta inmediata o se usa un streaming
  // },
};

export default nextConfig;
