# Análisis del Proyecto web-customer

Este reporte detalla la implementación del frontend web-customer del proyecto de comercio electrónico blockchain. El análisis cubre la arquitectura, configuraciones, componentes, hooks y la integración con contratos inteligentes.

## Framework y Arquitectura

El proyecto web-customer está construido con **Next.js 14** utilizando el **App Router**. La arquitectura sigue los principios modernos de React con Server Components para páginas iniciales y Client Components (`'use client'`) para interactividad.

### Estructura del Proyecto
```
web-customer/
├── .gitignore
├── README.md
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── public/
├── src/
│   ├── app/
│   │   ├── cart/
│   │   ├── favicon.ico
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── orders/
│   │   ├── page.tsx
│   │   └── products/
│   ├── components/
│   ├── contracts/
│   ├── hooks/
│   └── lib/
├── tsconfig.json
└── ...
```

## Archivos de Configuración

### `next.config.ts`

Configuración especial para Web3 y ambiente blockchain:
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    return config;
  },
};

export default nextConfig;
```

**Observaciones:**
- `fallback`: Desactiva módulos Node.js (`fs`, `net`, `tls`) que no están disponibles en el navegador
- `externals`: Excluye bibliotecas que pueden causar problemas de empaquetado con Webpack

### `tsconfig.json`

Configuración de TypeScript con soporte para JSON y módulos ES:
```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": [
    "next-env.d.ts", 
    "**/*.ts", 
    "**/*.tsx", 
    ".next/types/**/*.ts", 
    "src/lib/contracts/abis/**/*.json"
  ],
  "exclude": ["node_modules"]
}
```

**Características clave:**
- `resolveJsonModule`: Permite importar archivos JSON
- `paths`: Aliasing `@/*` para `./src/*`
- Inclusión de archivos JSON de ABIs en el análisis de TypeScript

### `eslint.config.mjs`

Configuración de ESLint extendida con reglas de Next.js:
```javascript
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
];

export default eslintConfig;
```

## Implementación del Frontend

### `app/layout.tsx`

Layout principal con conexión de billetera:
```tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <header className="border-b bg-white sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-8">
                <Link href="/" className="text-2xl font-bold text-blue-600">
                  E-Shop
                </Link>
                <nav className="hidden md:flex gap-6">
                  <Link href="/products" className="hover:text-blue-600">
                    Products
                  </Link>
                  <Link href="/cart" className="hover:text-blue-600">
                    Cart
                  </Link>
                  
                  <Link href="/orders" className="hover:text-blue-600">
                    Orders
                  </Link>
                </nav>
              </div>
              <WalletConnect />
            </div>
          </div>
        </header>
        <main>{children}</main>
        <footer className="bg-gray-100 border-t mt-16">
          <div className="container mx-auto px-4 py-8 text-center text-gray-600">
            <p>&copy; 2025 Blockchain E-Commerce. Powered by Ethereum & EURT.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
```

**Características:**
- Navegación persistente entre rutas
- Componente `WalletConnect` en el header
- Meta información SEO

### Página de Inicio (`app/page.tsx`)

Página principal con llamadas a acción:
```tsx
export default function Home() {
  return (
    <div className="min-h-screen">
      <div className="hero bg-gradient-to-r from-blue-500 to-purple-600 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4">Blockchain E-Commerce</h1>
          <p className="text-xl mb-8">Shop with cryptocurrency. Secure, transparent, decentralized.</p>
          <Link
            href="/products"
            className="inline-block px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100"
          >
            Start Shopping
          </Link>
        </div>
      </div>

      {/* Features grid */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="text-center p-6">
            <div className="text-4xl mb-4">🔒</div>
            <h3 className="text-xl font-semibold mb-2 dark:text-white">Secure Payments</h3>
            <p className="text-gray-600 dark:text-gray-400">Pay with EURT tokens backed by real euros</p>
          </div>

          <div className="text-center p-6">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-semibold mb-2 dark:text-white">Fast Transactions</h3>
            <p className="text-gray-600 dark:text-gray-400">Instant confirmation on the blockchain</p>
          </div>

          <div className="text-center p-6">
            <div className="text-4xl mb-4">🌐</div>
            <h3 className="text-xl font-semibold mb-2 dark:text-white">Decentralized</h3>
            <p className="text-gray-600 dark:text-gray-400">No intermediaries, direct transactions</p>
          </div>
        </div>

        {/* Quick Access Links */}
