# Análisis de Problemas en la Aplicación Web-Admin

## Resumen

Este documento detalla los problemas identificados en la aplicación web-admin y las soluciones propuestas para corregirlos. Los principales problemas se encuentran en la interacción con los contratos inteligentes y el manejo de los datos retornados por estas llamadas.

## Problemas Identificados

### 1. Problema con Fuentes de Google en Next.js 16

**Archivo afectado:** `src/app/layout.tsx`

**Descripción:**
Next.js 16 tiene problemas de compatibilidad con la importación de fuentes de Google usando `next/font/google`. Esto causa errores al iniciar la aplicación.

**Solución propuesta:**
Eliminar las importaciones de fuentes de Google y usar fuentes del sistema o definir fuentes personalizadas de otra manera.

```typescript
// ANTES (problemático)
import { Geist_Sans } from 'next/font/google';
import { Geist_Mono } from 'next/font/google';

const geistSans = Geist_Sans({
  subsets: ['latin'],
  variable: '--font-geist-sans',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
});

// DESPUÉS (corregido)
// Eliminar las importaciones y usar fuentes del sistema
```

### 2. Problema con Direcciones de Contratos

**Archivo afectado:** `src/lib/contracts/addresses.ts`

**Descripción:**
Las variables de entorno pueden ser `undefined`, lo que causa errores cuando se intenta acceder a direcciones de contratos no definidas.

**Solución propuesta:**
Proporcionar valores por defecto y validar las direcciones antes de usarlas.

```typescript
// ANTES
export const CONTRACT_ADDRESSES = {
  31337: {
    ecommerce: process.env.NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS,
    euroToken: process.env.NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS,
  },
};

// DESPUÉS
export const CONTRACT_ADDRESSES = {
  31337: {
    ecommerce: process.env.NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    euroToken: process.env.NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS || '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  },
};

// Agregar validación de formato
guard {
  // Validar que la dirección tenga el formato correcto
  if (!address.startsWith('0x') || address.length !== 42) {
    throw new Error(`Invalid contract address for ${contract}: ${address}`);
  }
}
```

### 3. Problema con Manejo de Objetos Retornados por Contratos

**Archivos afectados:**
- `src/app/companies/page.tsx`
- `src/app/company/[id]/page.tsx`

**Descripción:**
Los contratos inteligentes retornan objetos estructurados, pero el código actual asume que se pueden acceder directamente a las propiedades por nombre. Sin embargo, dependiendo de la versión de Ethers.js y cómo se compilan los contratos, los objetos pueden tener una estructura diferente o requerir un manejo especial.

**Análisis del ABI:**
Según el ABI del contrato Ecommerce, las funciones retornan objetos con propiedades específicas:

```javascript
// getCompany retorna:
{
  "id": "uint256",
  "owner": "address",
  "name": "string",
  "description": "string",
  "isActive": "bool",
  "createdAt": "uint256"
}

// getProduct retorna:
{
  "id": "uint256",
  "companyId": "uint256",
  "name": "string",
  "description": "string",
  "price": "uint256",
  "stock": "uint256",
  "image": "string",
  "active": "bool"
}
```

**Problemas específicos:**
1. **Acceso a propiedades:** El código asume que `company.owner` existe, pero puede que las propiedades estén indexadas numéricamente.
2. **Conversiones de tipos:** Necesidad de convertir BigInt a string y números.
3. **Manejo de arrays:** Algunas funciones retornan arrays que necesitan ser convertidos correctamente.

**Solución propuesta:**
Implementar una función de normalización que maneje diferentes formatos de retorno:

```typescript
// Función auxiliar para normalizar objetos de contrato
function normalizeCompany(companyResult: any): Company {
  return {
    id: companyResult.id?.toString() || companyResult[0]?.toString() || '0',
    owner: companyResult.owner || companyResult[1] || '0x0000000000000000000000000000000000000000',
    name: companyResult.name || companyResult[2] || '',
    description: companyResult.description || companyResult[3] || '',
    isActive: Boolean(companyResult.isActive !== undefined ? companyResult.isActive : companyResult[4]),
    createdAt: companyResult.createdAt || companyResult[5] || '0',
  };
}

// Uso en el código
const companyData = await ecommerceContract.getCompany(BigInt(companyId));
const normalizedCompany = normalizeCompany(companyData);
```

### 4. Problema con Llamadas a Funciones Asíncronas

**Descripción:**
Las llamadas a funciones del contrato pueden fallar por varias razones:
- Contrato no desplegado en la red
- Problemas de conectividad
- Parámetros incorrectos
- Problemas de gas

**Solución propuesta:**
Implementar manejo robusto de errores y validaciones:

```typescript
try {
  // Validar parámetros antes de la llamada
  if (!formData.address || !formData.name) {
    throw new Error('Missing required parameters');
  }
  
  // Validar formato de dirección
  if (!ethers.isAddress(formData.address)) {
    throw new Error('Invalid address format');
  }
  
  const tx = await ecommerceContract.registerCompany(
    formData.address,
    formData.name,
    formData.description
  );
  
  // Esperar confirmación con timeout
  const receipt = await Promise.race([
    tx.wait(),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Transaction timeout')), 30000)
    )
  ]);
  
  console.log('Transaction confirmed:', receipt);
} catch (error) {
  // Manejo específico de errores
  if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
    console.error('Gas estimation failed');
  } else if (error.code === 'INSUFFICIENT_FUNDS') {
    console.error('Insufficient funds');
  } else {
    console.error('Transaction failed:', error);
  }
  
  throw error;
}
```

## Soluciones Implementadas

### 1. Corrección de Layout

**Archivo:** `src/app/layout.tsx`

Se eliminaron las importaciones problemáticas de fuentes de Google y se simplificó el componente.

### 2. Mejora de Manejo de Direcciones

**Archivo:** `src/lib/contracts/addresses.ts`

Se agregaron valores por defecto y validaciones para las direcciones de contratos.

### 3. Normalización Robusta de Datos de Contratos

**Archivos:**
- `src/app/companies/page.tsx`
- `src/app/company/[id]/page.tsx`
- `src/lib/contractUtils.ts` (nuevo archivo)

Se implementó un sistema completo de normalización de datos con funciones especializadas:

```typescript
// Funciones de normalización centralizadas en contractUtils.ts
import { normalizeCompany, normalizeProduct, normalizeArrayResponse } from '../../lib/contractUtils';

// Uso en componentes
const companyIds = normalizeArrayResponse(companyIdsResult);
const normalizedCompany = normalizeCompany(companyResult, id);
const normalizedProduct = normalizeProduct(productResult, id);
```

### 4. Manejo de Errores Mejorado

Se agregó logging detallado y manejo de errores específico:

```typescript
try {
  // Código de llamada a contrato
  console.log('Loading companies...');
  const companyIdsResult = await ecommerceContract.getAllCompanies();
  console.log('Company IDs result:', companyIdsResult);
  // ...
} catch (err) {
  console.error('Error loading companies:', err);
  setError('Failed to load companies: ' + (err instanceof Error ? err.message : String(err)));
}
```

### 5. Centralización de Lógica

Se creó `src/lib/contractUtils.ts` para centralizar la lógica de normalización, eliminando código duplicado y mejorando la mantenibilidad.

## Recomendaciones Futuras

### 1. Testing
Implementar tests unitarios para las funciones de normalización de datos en `contractUtils.ts`.

### 2. Tipado Estricto
Crear interfaces TypeScript más específicas basadas en el ABI del contrato para mejorar el tipado.

### 3. Caching
Implementar un sistema de caching para datos que no cambian frecuentemente, como listas de empresas y productos.

### 4. Validación de Formularios
Agregar validación de formularios en el frontend antes de enviar transacciones para mejorar la UX.

### 5. Monitoreo de Errores
Implementar un sistema de monitoreo de errores más robusto para trackear problemas en producción.

## Conclusión

Los problemas identificados están principalmente relacionados con la interacción entre el frontend y los contratos inteligentes. La solución implica:

1. **Manejo robusto de datos:** Normalizar objetos retornados por contratos
2. **Validación de entradas:** Verificar direcciones y parámetros antes de enviar transacciones
3. **Mejora de UX:** Proporcionar feedback claro al usuario sobre el estado de las operaciones
4. **Manejo de errores:** Implementar estrategias de recuperación para diferentes tipos de errores

Con estas correcciones, la aplicación debería funcionar correctamente con los contratos desplegados en la red local de Anvil.