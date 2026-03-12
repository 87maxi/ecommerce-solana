# Guía de Implementación - Correcciones Web-Admin

## Introducción

Esta guía proporciona instrucciones paso a paso para implementar las correcciones identificadas en el análisis de la aplicación web-admin.

## 1. Corrección de Layout

### Archivo: `src/app/layout.tsx`

**Problema:** Importaciones de fuentes de Google causan error en Next.js 16

**Solución:**

1. Eliminar las importaciones de `Geist_Sans` y `Geist_Mono`
2. Eliminar las definiciones de constantes `geistSans` y `geistMono`
3. Simplificar el className del elemento html

**Código corregido:**

```typescript
'use client';

import { ReactNode } from 'react';
import { Header } from '../components/Header';
import './globals.css';

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 font-sans antialiased">
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
```

## 2. Corrección de Direcciones de Contratos

### Archivo: `src/lib/contracts/addresses.ts`

**Problema:** Variables de entorno pueden ser undefined

**Solución:**

1. Agregar valores por defecto para direcciones de contratos
2. Implementar validación de formato de direcciones
3. Mejorar mensajes de error

**Código corregido:**

```typescript
export const CONTRACT_ADDRESSES = {
  31337: {
    ecommerce: process.env.NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    euroToken: process.env.NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS || '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  },
};

export function getContractAddress(chainId: number, contract: 'ecommerce' | 'euroToken'): string {
  console.log(`Getting address for contract ${contract} on chain ${chainId}`);
  console.log('Available addresses:', CONTRACT_ADDRESSES);
  
  const addresses = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES];
  if (!addresses) {
    throw new Error(`Network ${chainId} not supported. Supported networks: ${Object.keys(CONTRACT_ADDRESSES).join(', ')}`);
  }
  
  const address = addresses[contract];
  if (!address) {
    throw new Error(
      `Contract ${contract} not configured for network ${chainId}. ` +
      `Available contracts: ${Object.keys(addresses).join(', ')}`
    );
  }
  
  // Validar que la dirección tenga el formato correcto
  if (!address.startsWith('0x') || address.length !== 42) {
    throw new Error(`Invalid contract address for ${contract}: ${address}`);
  }
  
  return address;
}

export const SUPPORTED_CHAINS = [
  {
    id: Number(process.env.NEXT_PUBLIC_CHAIN_ID) || 31337,
    name: 'Ethereum Local',
    currency: 'ETH',
  },
];
```

## 3. Corrección de Páginas de Empresas

### Archivo: `src/app/companies/page.tsx`

**Problema:** Manejo incorrecto de objetos retornados por contratos

**Solución:**

1. Implementar manejo flexible de diferentes formatos de retorno
2. Agregar validaciones y conversiones de tipos
3. Mejorar el manejo de errores

**Cambios principales:**

```typescript
// Antes de cada llamada a contrato, agregar logging
console.log('Loading companies...');

// Manejo flexible de resultados
const companyIds = Array.isArray(companyIdsResult) 
  ? companyIdsResult 
  : companyIdsResult.toArray?.() || [];

// Normalización de objetos de contrato
const company = {
  id: id.toString ? id.toString() : String(id),
  owner: companyResult.owner || companyResult[1],
  name: companyResult.name || companyResult[2],
  description: companyResult.description || companyResult[3],
  isActive: companyResult.isActive !== undefined ? companyResult.isActive : companyResult[4],
  createdAt: companyResult.createdAt || companyResult[5],
};

// Manejo de errores mejorado
setError('Failed to load companies: ' + (err instanceof Error ? err.message : String(err)));
```

## 4. Corrección de Página de Detalle de Empresa

### Archivo: `src/app/company/[id]/page.tsx`

**Problema:** Mismos problemas que en la página de empresas

**Solución:**

Aplicar las mismas correcciones que en `src/app/companies/page.tsx`:

1. Manejo flexible de arrays retornados por contratos
2. Normalización de objetos de productos
3. Validaciones de tipos
4. Manejo de errores mejorado

## 5. Validación de Variables de Entorno

### Archivo: `.env.example`

**Asegurarse de que existen las siguientes variables:**

```env
NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
NEXT_PUBLIC_CHAIN_ID=31337
```

## 6. Verificación de Implementación

### Pasos para verificar:

1. **Reiniciar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```

2. **Verificar carga de página principal:**
   - Abrir http://localhost:3000
   - Verificar que no hay errores de fuentes

3. **Verificar conexión de billetera:**
   - Conectar MetaMask
   - Verificar que se muestra la dirección correctamente

4. **Verificar carga de empresas:**
   - Navegar a /companies
   - Verificar que se cargan las empresas existentes
   - Verificar manejo de errores

5. **Verificar registro de empresas:**
   - Completar formulario
   - Verificar que se envía transacción
   - Verificar actualización de lista

6. **Verificar detalle de empresa:**
   - Navegar a /company/[id]
   - Verificar carga de datos
   - Verificar permisos de propietario
   - Verificar carga de productos

## 7. Manejo de Problemas Comunes

### Error: "Network not supported"

**Solución:**
1. Verificar que `NEXT_PUBLIC_CHAIN_ID` esté configurado correctamente
2. Asegurarse de que el chain ID coincida con la red de Anvil (31337)

### Error: "Contract not configured"

**Solución:**
1. Verificar que las variables de entorno estén definidas
2. Asegurarse de que las direcciones de contratos sean válidas
3. Reiniciar el servidor de desarrollo

### Error: "Invalid contract address"

**Solución:**
1. Verificar formato de direcciones (0x + 40 caracteres hexadecimales)
2. Asegurarse de que los contratos estén desplegados

## 8. Pruebas Adicionales

### Pruebas de Regresión

1. **Pruebas de UI:**
   - Verificar que todos los componentes se rendericen correctamente
   - Verificar estados de carga y error
   - Verificar navegación entre páginas

2. **Pruebas de Funcionalidad:**
   - Registro de empresas
   - Agregar productos
   - Verificar permisos
   - Manejo de errores

3. **Pruebas de Integración:**
   - Conexión con MetaMask
   - Transacciones exitosas
   - Manejo de rechazos de transacciones

## Conclusión

Siguiendo esta guía, la aplicación web-admin debería funcionar correctamente con los contratos desplegados en la red local de Anvil. Las correcciones implementadas mejoran la robustez del código y proporcionan una mejor experiencia de usuario al manejar errores de manera más elegante.