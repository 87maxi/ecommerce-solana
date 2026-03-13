# Guía de Migración: De Smart Contracts (Ethereum/Solidity) a Anchor (Solana/Rust)

Este documento describe el proceso técnico detallado, las herramientas utilizadas y las decisiones de arquitectura tomadas durante la migración del ecosistema de E-Commerce de Ethereum a Solana utilizando el framework Anchor.

## 1. Análisis del Origen (Ethereum/Solidity)
El proyecto original en `sc-ecommerce` utilizaba un patrón de librerías en Solidity para gestionar la persistencia y la lógica. Las entidades principales eran:
- **CompanyLib**: Registro y gestión de empresas.
- **ProductLib**: CRUD de productos y control de stock.
- **CustomerLib**: Registro de clientes y estadísticas.
- **ShoppingCartLib**: Gestión de carritos de compra on-chain.
- **Ecommerce.sol**: Contrato principal que orquestaba las llamadas y gestionaba la facturación (`Invoice`).

## 2. Proceso de Migración a Solana Anchor

### Paso 1: Diseño del Estado y Cuentas (PDA)
A diferencia de Solidity, donde el estado vive dentro de un único contrato, en Solana el estado se distribuye en cuentas. Implementamos el modelo **PDA (Program Derived Addresses)** para garantizar la integridad:

- **GlobalState**: Reemplaza las variables globales de Solidity. Almacena el `owner` de la plataforma y los contadores (`next_id`) para empresas, productos y facturas.
- **Company Account**: Semilla: `[b"company", company_id]`. Almacena datos del propietario y metadatos de la empresa.
- **Product Account**: Semilla: `[b"product", product_id]`. Almacena precio, stock y estado de activación.
- **Customer Account**: Semilla: `[b"customer", wallet_pubkey]`. Vincula estadísticas de compra a una clave pública.
- **ShoppingCart Account**: Semilla: `[b"shopping-cart", user_pubkey]`. Permite persistencia del carrito por usuario.
- **Invoice Account**: Semilla: `[b"invoice", invoice_id]`. Registro inmutable de transacciones y estados de pago.

### Paso 2: Implementación de la Lógica en Rust
Migramos las funciones de las librerías de Solidity a instrucciones de Anchor:

1.  **Registro de Empresas**: Traducido de `registerCompany` a `register_company`. Se añadió la lógica de incremento de ID global en una sola transacción atómica.
2.  **Gestión de Productos**: Las funciones `addProduct` y `updateStock` se adaptaron para manejar la creación de cuentas dinámicas y la validación de firmas de los propietarios de empresas.
3.  **Carrito de Compras**: Implementado usando `Vec<CartItem>` dentro de la cuenta del carrito. Se habilitó `init_if_needed` para inicializar el carrito automáticamente al agregar el primer ítem.
4.  **Procesamiento de Facturas**: La lógica de `createInvoice` ahora cierra el ciclo del carrito (lo limpia) y genera una nueva cuenta de factura pendiente de pago.

### Paso 3: Manejo de Errores
Se creó un módulo `errors.rs` definiendo un enum `EcommerceError`. Esto reemplaza los strings de `require()` en Solidity por códigos de error numéricos eficientes en Solana, facilitando el debugging en el frontend.

### Paso 4: Adaptación de la Interfaz de Compra (compra-stablecoin)
Se eliminó la dependencia de `ethers.js` y `MetaMask` para adoptar un enfoque agnóstico a la billetera:
- **Conectividad**: Migración a `@solana/wallet-adapter-react`, permitiendo el uso de Phantom, Backpack y Solflare.
- **Detección de Balance**: Implementación de lógica de polling en la página de éxito para detectar tokens minteados una vez confirmado el pago por Stripe.
- **Estandarización de Parámetros**: Se unificaron las redirecciones usando el parámetro `amount` en lugar de `tokens` para mayor consistencia en el ecosistema.

## 3. Librerías y Herramientas Implementadas

| Herramienta | Rol en la Migración |
|-------------|---------------------|
| **Anchor Framework (0.32.1)** | Gestión de seguridad, serialización (Borsh) y generación de IDL. |
| **anchor-lang (init-if-needed)** | Característica clave para simplificar el flujo de usuario al registrar clientes o carritos. |
| **Borsh** | Serialización binaria eficiente para el almacenamiento en cuentas. |
| **Solana web3.js (1.98)** | Interacción desde las UIs (Admin y Customer) con el programa migrado. |
| **Solana Wallet Adapters** | Conectividad agnóstica a billeteras (Phantom, Solflare, etc.). |
| **@solana/spl-token** | Gestión de balances y cuentas asociadas (ATA) de EURT. |
| **Surfpool** | Entorno de desarrollo local para simular la red de Solana. |

## 4. Funcionalidades Cumplidas tras la Migración

1.  **Arquitectura Multitenant**: Múltiples empresas pueden registrarse y gestionar su inventario de forma aislada bajo sus propios PDAs.
2.  **Garantía de Stock**: El programa en Rust verifica atómicamente que haya stock disponible antes de emitir una factura (`Invoice`).
3.  **Ciclo de Pago Cerrado**: Integración con el sistema de stablecoin para que, al detectar un pago exitoso, la instrucción `process_payment` actualice el estado de la factura y las estadísticas del cliente.
4.  **Escalabilidad**: Al distribuir el estado en cuentas individuales por empresa/producto/cliente, el sistema evita los límites de gas y congestión típicos de un contrato monolítico en Ethereum.

## 5. Pruebas de Consistencia
Se ejecutaron tests automatizados en TypeScript (`tests/solana-ecommerce.ts`) que verifican:
- Inicialización correcta del estado global.
- Seguridad en la creación de productos (solo el dueño de la empresa puede agregar).
- Persistencia y remoción de ítems en el carrito.
- Transición de estados de facturas (Pending -> Paid).

---
*Este documento fue generado para documentar la transición exitosa del ecosistema ecommerce al entorno de alto rendimiento de Solana.*