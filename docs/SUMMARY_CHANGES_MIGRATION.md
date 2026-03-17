# Resumen de Cambios: Migración de Ethereum a Solana

Este documento detalla las correcciones y ajustes realizados en el ecosistema de E-commerce para asegurar su correcto funcionamiento tras la migración de Smart Contracts de Ethereum (Solidity) a Solana (Rust/Anchor).

## 1. Cambios Estructurales (Solana vs. Ethereum)
*Derivados de la arquitectura de blockchain y el modelo de programación.*

### Manejo de Autoridades vía PDA
*   **Contexto:** En Ethereum, las funciones administrativas suelen restringirse a la dirección del `msg.sender` (el deployer).
*   **Cambio:** En Solana, se implementó el uso de **Program Derived Addresses (PDA)** como autoridad del Mint de EURT. Esto permite que el propio programa tenga autonomía para mintear tokens de forma segura, eliminando la dependencia de una clave privada centralizada para la operación del sistema.

### Modelo de Cuentas y SPL Token
*   **Contexto:** ERC20 en Ethereum mantiene un mapeo interno de balances. En Solana, se requiere una **Associated Token Account (ATA)** por cada usuario y cada token.
*   **Cambio:** Se ajustó la lógica en `pasarela-de-pago` y `web-customer` para verificar y crear automáticamente la ATA del usuario antes de cualquier operación de balance o transferencia.

### Compatibilidad de Firmantes (Wallet Adapter)
*   **Contexto:** El `AnchorProvider` de Solana requiere un objeto Wallet que implemente explícitamente `signTransaction` y `signAllTransactions`.
*   **Cambio:** Se corrigieron múltiples hooks en `web-admin` y `web-customer` que solo pasaban la `publicKey`, causando errores de tipo. Ahora se extrae el firmante completo desde el adaptador de wallet.

---

## 2. Errores de Definición Funcional y Lógica de Implementación
*Problemas detectados en el código TypeScript durante la integración.*

### Pérdida de Contexto en Llamadas a Métodos (`this`)
*   **Problema:** El código extraía métodos de `program.methods` (ej. `const { addToCart } = program.methods`) y los ejecutaba de forma aislada. Esto causaba un error de ejecución porque el método perdía la referencia interna a Anchor.
*   **Solución:** Se refactorizaron las llamadas para que se ejecuten siempre directamente sobre el objeto `methods`, preservando el contexto necesario para codificar instrucciones.

### Tratamiento de IDs Numéricos (El problema del ID = 0)
*   **Problema:** Los productos con `id: 0` eran evaluados como "falsos" por operadores lógicos (`||`), causando que el sistema saltara erróneamente a un valor por defecto (la PublicKey del producto). Esto impedía agregar los primeros productos al carrito.
*   **Solución:** Se implementó el operador de coalescencia nula (`??`) en todos los mapeos de datos para tratar el `0` como un ID válido.

### Sincronización de Nomenclatura (Snake vs. Camel Case)
*   **Problema:** Rust utiliza `snake_case` (ej. `add_to_cart`), mientras que el frontend esperaba `camelCase` (ej. `addToCart`).
*   **Solución:** Se agregaron comprobaciones condicionales en los hooks de contrato para soportar ambos formatos, asegurando compatibilidad total con el IDL autogenerado por Anchor 0.30+.

---

## 3. Configuración y Entorno (DevOps)
*Errores en la definición de variables de entorno y despliegue.*

### Diferenciación entre Program ID y Mint Address
*   **Problema:** Las variables de entorno (`NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS`) a menudo apuntaban al ID del programa de la stablecoin en lugar de apuntar a la dirección del **Token Mint** (la moneda real).
*   **Solución:** Se actualizaron los archivos `.env.local` y el script `deploy.sh` para distinguir claramente entre el ejecutable del contrato y el activo digital que representa el balance.

### Automatización del IDL
*   **Problema:** El frontend utilizaba copias manuales y obsoletas del IDL, lo que causaba fallos al intentar codificar argumentos de funciones que habían cambiado en Rust.
*   **Solución:** Se modificó `deploy.sh` para copiar automáticamente el archivo `solana.json` (IDL) a las carpetas `src/lib/` de los frontends cada vez que se compilan los contratos.

---

## Resumen Técnico de Archivos Afectados
1.  **`deploy.sh`**: Ahora centraliza la creación del Mint y la distribución del IDL.
2.  **`useContract.ts` (en ambos frontends)**: Refactorizado para manejo robusto de firmantes y llamadas a métodos.
3.  **`contracts.ts` (pasarela)**: Migrado de un IDL manual a una importación dinámica sincronizada con el contrato.
4.  **`.env.local`**: Corregidas las direcciones base para apuntar a los recursos correctos en Localnet.