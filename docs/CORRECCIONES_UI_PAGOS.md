# Registro de Correcciones: Interfaz de Usuario y Pasarela de Pagos (EURT)

Este documento detalla los problemas críticos encontrados en la interfaz de usuario (`web-customer` y `web-admin`) y el flujo de pagos, así como las soluciones implementadas para garantizar la estabilidad y la correcta interacción con la blockchain de Solana.

## 1. Problemas de Renderizado en Next.js (SSR vs. CSR)

### 1.1. Errores de Hidratación (Hydration Mismatch)
**Problema:**
La aplicación experimentaba fallos consistentes con el mensaje `Hydration failed because the server rendered HTML didn't match the client`. Esto ocurría porque componentes clave (`Header`, `Sidebar`, `BuyEuroTokenButton`, y el carrito de compras) intentaban renderizar información basada en el estado de la billetera (conectada/desconectada) o el balance de tokens durante el renderizado del lado del servidor (SSR). Dado que el servidor no tiene acceso al objeto `window` ni a las extensiones de billetera, generaba un HTML asumiendo que la billetera estaba desconectada. Al llegar al cliente, si la billetera se autoconectaba, el estado cambiaba inmediatamente, causando que el árbol de React del cliente difiriera del HTML original del servidor.

**Solución Implementada:**
Se creó e implementó el custom hook `useIsMounted()`.
- **Lógica:** Este hook devuelve `false` inicialmente y cambia a `true` dentro de un `useEffect` (que solo se ejecuta en el cliente).
- **Aplicación:** Todos los componentes que dependen de datos de la billetera (como `EuroTokenBalance`, `WalletConnectHeader` o botones dinámicos) ahora verifican `if (!isMounted)`. Si el componente no está montado, renderizan un estado "esqueleto" o una versión desconectada segura que coincide exactamente con lo que el servidor generó.

### 1.2. Bucles de Renderizado Infinito (Maximum update depth exceeded)
**Problema:**
En `web-admin`, las páginas de gestión (ej. `/companies`, `/products`) y los hooks como `useUserRole` causaban el bloqueo total del navegador (especialmente notorio en Brave). Esto sucedía porque se pasaba un objeto nuevo en cada renderizado (como `{ publicKey }`) al hook `useContract`, lo que forzaba la recreación de la instancia del contrato. Esta nueva instancia disparaba los `useEffect` de carga de datos, los cuales actualizaban el estado, provocando un nuevo renderizado y creando un bucle infinito.

**Solución Implementada:**
Se estabilizaron todas las dependencias utilizando la API nativa de React:
- **Memorización del Signer:** Se utilizó `useMemo` para asegurar que el objeto `signer` solo cambie si la dirección de la billetera (convertida a string mediante `toBase58()`) cambia realmente.
- **Dependencias Estables:** Se ajustaron los arrays de dependencias en los `useEffect` y `useCallback` para evitar re-evaluaciones innecesarias, rompiendo así el ciclo de renderizado infinito.

## 2. Refactorización del Flujo de Pagos (Pasarela Web3 a Transferencia Nativa)

**Problema Original:**
El flujo de checkout en el carrito (`web-customer/src/app/cart/page.tsx`) estaba diseñado para redirigir al usuario a una pasarela externa simulada (`web-admin` actuando como pasarela de Stripe) en lugar de utilizar la billetera de Solana del usuario para transferir los tokens de la compra. Esto rompía el paradigma de un e-commerce verdaderamente descentralizado.

**Solución Implementada:**
Se reconstruyó completamente el proceso de pago para que sea 100% on-chain utilizando tokens SPL (EuroToken - EURT).

1.  **Transferencia Directa (`processPayment` en `useContract.ts`):**
    - Se implementó la función `createTransferCheckedInstruction` de `@solana/spl-token` para enviar EURT directamente desde la cuenta ATA (Associated Token Account) del usuario a la ATA del vendedor (`NEXT_PUBLIC_MERCHANT_ADDRESS`).
    - Se incluyó la validación de decimales dinámicos (6 decimales para EURT).

2.  **Validación de Saldos y Cuentas (Robustez):**
    - **Balance del Usuario:** Antes de iniciar la transacción, el sistema verifica que el usuario posea una ATA válida para el Mint de EURT y que tenga saldo suficiente. Si falla, muestra un mensaje de alerta claro, previniendo errores de transacción (`InvalidAccountData`).
    - **ATA del Vendedor:** Si el vendedor (merchant) aún no tiene una ATA inicializada para recibir EURT, el script automáticamente pre-pendiza una instrucción `createAssociatedTokenAccountInstruction` en una transacción separada antes del pago, evitando el error `AccountNotInitialized`.

3.  **Feedback Visual de UI:**
    - Al añadir productos al carrito, el botón ahora cambia a un estado visual de "¡Añadido!" (color esmeralda con check) durante 2 segundos para mejorar la experiencia del usuario, evitando clics duplicados.
    - Se integró un estado de `isPaying` con un *spinner* durante la confirmación de la transacción en la red.

## 3. Resolución de Inconsistencias de Contrato y Mints

**Problema:**
El código del frontend intentaba interactuar con instrucciones que no existían en el contrato desplegado (ej. intentar leer una cuenta `global_state` para enumerar productos, cuando el contrato real en Surfpool utilizaba un enfoque basado en PDAs derivadas de la clave pública del vendedor). Además, se estaba utilizando el Program ID del e-commerce como si fuera la dirección del Mint del token EURT.

**Solución Implementada:**
- **Sincronización de Lógica de Productos:** Se actualizó `getAllProducts` para utilizar el método nativo de Anchor `.all()` (`program.account.product.all()`), permitiendo listar todos los productos sin depender de un contador global secuencial.
- **Identificadores Estables:** Se modificó el carrito de compras para que utilice la clave pública de la cuenta del producto (`publicKey.toBase58()`) como identificador único (`id`), en lugar de un número entero.
- **Corrección del Mint:** Se identificó la verdadera dirección del Mint de EURT en la red local (`AKWdemYgbmSujB1jTMm8q6q3fKTtcxr5XXp8tSSoDekC`) y se configuró correctamente en la variable de entorno `NEXT_PUBLIC_EUROTOKEN_MINT`, resolviendo definitivamente los fallos en las transferencias de pago.