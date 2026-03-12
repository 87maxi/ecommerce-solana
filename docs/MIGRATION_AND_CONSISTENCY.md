# Registro de Consistencia y Migración: De Ethereum a Solana

Este documento detalla los cambios estructurales, actualizaciones de dependencias y refactorizaciones de código realizadas para asegurar la consistencia del ecosistema tras la migración de la lógica de Ethereum (EVM) a Solana.

## 1. Actualización de Stack Tecnológico

Se han actualizado todas las interfaces de usuario para utilizar las últimas versiones estables, garantizando compatibilidad con el motor de renderizado de Solana y Turbopack.

| Componente | Versión Anterior | Versión Nueva | Notas |
|------------|------------------|---------------|-------|
| **Next.js** | 14.x | 16.1.x | Soporte para Turbopack y mejoras en App Router. |
| **React** | 18.x | 19.2.x | Mejoras en el manejo de estados y concurrencia. |
| **Tailwind CSS** | 3.x | 4.2.x | Nueva arquitectura basada en CSS nativo y `@theme`. |
| **@solana/web3.js** | 1.91.x | 1.98.x | Estabilidad en la conexión RPC con Localnet/Surfpool. |

---

## 2. Adaptaciones de Código: Ethereum vs. Solana

A continuación se muestran los fragmentos clave donde la lógica de Ethereum fue reemplazada por la arquitectura de Solana.

### A. Identificación de Red (Chain ID)
**Original (Ethereum):** Validaba el ID `31337` (Anvil) y lanzaba error si no coincidía.
**Nuevo (Solana):** Utiliza el ID `1337` para identificar la red local de **Surfpool**. Se eliminó la validación estricta para permitir la flexibilidad del `RPC_URL`.

```typescript
// Fragmento modificado en src/lib/contracts/addresses.ts
export function getContractAddress(chainId: number | string | null, contract: 'Ecommerce' | 'EuroToken'): string {
  // Se asume 1337 como red por defecto para desarrollo local con Solana/Surfpool
  const networkId = 1337; 
  const addresses = CONTRACT_ADDRESSES[networkId];
  // ...
  return addresses[contract];
}
```

### B. Formato de Direcciones
**Original (Ethereum):** Direcciones hexadecimales (`0x...`) de 42 caracteres.
**Nuevo (Solana):** Direcciones en Base58 (Program IDs y Mint Addresses). Se eliminaron las expresiones regulares de validación EVM.

```typescript
// Antes (EVM Validation):
if (!address.startsWith('0x') || address.length !== 42) throw Error(...);

// Ahora (Solana):
// Se aceptan Program IDs de Anchor como '675k16uTf...' sin prefijo '0x'.
```

### C. Proveedores de Billetera
Se migró de `window.ethereum` (MetaMask) a los adaptadores oficiales de Solana.

```tsx
// src/components/AppWalletProvider.tsx
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";

// Se reemplazó require() por import para compatibilidad con Turbopack
import "@solana/wallet-adapter-react-ui/styles.css";
```

---

## 3. Consistencia en Redirecciones (Checkout)

Se unificó la comunicación entre `web-customer` y la `pasarela-de-pago` para asegurar que el minteo de tokens (EURT) sea exitoso.

1. **Parámetro `walletAddress`**: Ahora es obligatorio en la URL de redirección hacia la pasarela para saber a qué cuenta mintear.
2. **Parámetro `amount`**: Se estandarizó el nombre del parámetro (antes se usaba `tokens` en algunas vistas y `amount` en otras).
3. **Página de Éxito**: Se corrigió `web-customer/src/app/cart/success/page.tsx` para que extraiga correctamente el `invoiceId` y `amount` para verificar contra el contrato de Solana.

---

## 4. Solución de Conflictos en el Build (Turbopack/Tailwind v4)

### Configuración de Next.js
Para evitar errores con librerías de Node.js en el navegador, se añadieron alias en `next.config.mjs`:

```javascript
experimental: {
  turbo: {
    resolveAlias: {
      fs: false,
      net: false,
      tls: false,
      "pino-pretty": false,
    },
  },
}
```

### Migración de CSS
Tailwind CSS v4 requiere que las variables del tema se definan en el propio CSS:

```css
/* src/app/globals.css */
@import "tailwindcss";

@theme {
  --color-primary: hsl(var(--primary));
  --font-display: "Syne", sans-serif;
  /* ... */
}
```

---

## 5. Historial de Commits de Refactorización

| Commit Hash | Descripción Breve |
|-------------|-------------------|
| `6ef8893` | Corrección de renderizado de iconos en React 19 (web-admin). |
| `8f86825` | Migración de `globals.css` a Tailwind CSS v4. |
| `5ce30c9` | Fix de compatibilidad Turbopack en `AppWalletProvider`. |
| `5a791fa` | Soporte para red Solana 1337 (Surfpool) y direcciones Base58. |
| `57c0033` | Actualización de PostCSS para `@tailwindcss/postcss`. |

---
**Nota:** Para mantener la red de desarrollo local, asegúrese de que el archivo `.env.local` tenga el `NEXT_PUBLIC_RPC_URL` apuntando al puerto de Surfpool (generalmente `8899`).