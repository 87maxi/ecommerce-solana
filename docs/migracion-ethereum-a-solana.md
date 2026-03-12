# Informe de Migración: E-Commerce de Ethereum a Solana

Este documento narra el proceso técnico, las decisiones arquitectónicas y los desafíos superados durante la migración de un ecosistema de e-commerce desde una base de Ethereum/Solidity hacia Solana/Rust.

## 1. Introducción y Objetivos

El objetivo principal fue transformar una plataforma funcional en Ethereum para aprovechar las ventajas de Solana: transacciones casi instantáneas, comisiones drásticamente más bajas y una mayor escalabilidad. Esto implicó una reescritura completa de la capa de contratos inteligentes y una refactorización profunda de todas las interfaces de usuario (UI).

### Arquitectura Original (Ethereum/Solidity)

*   **Smart Contracts:**
    *   `EuroToken.sol`: Un contrato estándar `ERC-20` (basado en OpenZeppelin) para una stablecoin con 6 decimales, donde la acuñación (`mint`) estaba restringida a una única cuenta propietaria (`onlyOwner`).
    *   `Ecommerce.sol`: Contrato que gestionaba la lógica de negocio como el registro de empresas, productos y clientes.
*   **Interfaces de Usuario (Next.js):**
    *   **Interacción Blockchain:** Se basaba en la librería `ethers.js` y el objeto `window.ethereum` inyectado por billeteras como MetaMask.
    *   **Validación de Red:** La lógica dependía del `chainId` para asegurar que los usuarios estuvieran conectados a la red correcta (ej. Anvil `31337`).
*   **Entorno:** El despliegue y las pruebas se realizaban con `forge` y `anvil`.

### Nueva Arquitectura (Solana/Rust)

*   **Programa Anchor:**
    *   Se unificó la lógica en un solo programa Rust utilizando el framework Anchor. A diferencia de Ethereum, donde el token es un contrato en sí mismo, en Solana el programa interactúa con el **programa oficial de tokens SPL**.
*   **Interfaces de Usuario (Next.js):**
    *   **Interacción Blockchain:** Se migró al ecosistema de `@solana/web3.js` y `@coral-xyz/anchor`. La gestión de billeteras se centralizó con el **Solana Wallet Adapter**.
    *   **Validación de Red:** La dependencia del `chainId` se eliminó, y la conexión ahora se valida únicamente a través del `RPC_URL`.
*   **Entorno:** El despliegue y las pruebas se realizan con `anchor` y un validador local (Surfpool).

## 2. Fase 1: Migración del Contrato a Programa Anchor

La lógica del backend fue la primera en ser transformada.

### De `ERC-20` a `SPL Token`

*   **Función que Cumplía:** El contrato `EuroToken.sol` definía el token, sus reglas (nombre, símbolo, decimales) y almacenaba los balances de los usuarios en un `mapping`.
*   **Adaptación a Solana:** En Solana, las propiedades del token se definen en una cuenta especial llamada **Mint Account**. Los balances de los usuarios se almacenan en **Cuentas de Token Asociadas (ATA)**. El programa Anchor no almacena balances; su función es actuar como una autoridad que controla el *Mint Account*.
*   **Implementación:** Se creó una instrucción `initialize` que crea el *Mint Account* del `EURT` con 6 decimales y asigna su autoridad de acuñación.

### De `onlyOwner` a `PDA Authority`

*   **Función que Cumplía:** En Solidity, el modificador `onlyOwner` restringía la función `mint` al `msg.sender` que desplegó el contrato, es decir, a una clave privada.
*   **Adaptación a Solana:** Este patrón no es seguro ni ideal en Solana. Se reemplazó por un **Program Derived Address (PDA)**. Un PDA es una dirección controlada por el propio programa, derivada de unas semillas (en nuestro caso, `b"mint_authority"`).
*   **Implementación:** La autoridad del *Mint Account* se asignó a este PDA. Ahora, la única forma de acuñar nuevos tokens es que nuestro programa firme la transacción usando sus semillas. Esto garantiza que ninguna clave privada externa pueda emitir `EURT`, solo el programa a través de su lógica interna.

### De `Funciones` a `Instrucciones`

*   **Función que Cumplían:** Las funciones `mint(address to, uint amount)` y `burn(uint amount)` de Solidity ejecutaban la lógica de acuñación y quema.
*   **Adaptación a Solana:** En Anchor, estas se convierten en `instrucciones` (`mint_tokens` y `burn_tokens`). Estas instrucciones no implementan la lógica del token desde cero. En su lugar, realizan una **Invocación Entre Programas (CPI - Cross-Program Invocation)** al programa oficial SPL Token de Solana, pasándole la autoridad (el PDA) para que este ejecute la acuñación o quema de forma segura y estandarizada.

## 3. Fase 2: Refactorización de las Interfaces de Usuario (UI)

Esta fue la fase más crítica, donde se reemplazó toda la capa de comunicación con la blockchain.

### Gestión de Billeteras: De `ethers.js` a `Solana Wallet Adapter`

*   **Función que Cumplía:** Se utilizaba un `hook` personalizado `useWallet.tsx` que envolvía `ethers.js` para conectar con MetaMask, obtener el `signer` y el `provider`, y gestionar el estado de la conexión.
*   **El Problema:** Este enfoque resultó ser la causa principal del error `Maximum call stack size exceeded`. La capa de abstracción personalizada entraba en conflicto con el ciclo de vida de React y las dependencias de Solana.
*   **Adaptación a Solana:**
    1.  **Eliminación del Hook Personalizado:** Se borró `useWallet.tsx` por completo.
    2.  **Adopción de Hooks Oficiales:** Todos los componentes fueron refactorizados para importar y usar directamente los hooks oficiales: `useWallet` y `useConnection` de `@solana/wallet-adapter-react`.
    3.  **Proveedor Global Estándar:** Se creó un componente `AppWalletProvider.tsx` que configura los proveedores (`ConnectionProvider`, `WalletProvider`, `WalletModalProvider`) y una lista curada de billeteras compatibles (Phantom, Backpack, Solflare), eliminando paquetes genéricos que causaban conflictos.
    4.  **Componentes Nativos:** Se reemplazaron los botones de conexión manuales por el componente `WalletMultiButton`, que gestiona toda la UI y lógica de conexión de forma nativa.

### Interacción con el Programa: De `Contract` a `Program`

*   **Función que Cumplía:** El hook `useContract` instanciaba un objeto `ethers.Contract` con la dirección, el ABI y el `signer`.
*   **Adaptación a Solana:** El hook se reescribió para instanciar un objeto `Program` de Anchor. Este recibe el **IDL** (el "ABI" de Solana, generado en formato JSON), el ID del programa y un `AnchorProvider` (que combina la `connection` y la `wallet`).

### Depuración de Errores Críticos

1.  **Errores de Compilación de Anchor (`E0277`, `E0599`):** El compilador de Rust se quejaba de `traits` no implementados. Tras varios intentos, se descubrió que la solución requería una combinación específica de:
    *   Usar el tipo `Account` (en lugar de `InterfaceAccount`).
    *   Importar los tipos `Mint` y `TokenAccount` desde la ruta `anchor_spl::token`.
    *   Habilitar la característica `idl-build` en el `Cargo.toml`.

2.  **Error `Maximum call stack size exceeded`:** La causa final fue una dependencia de servidor (`pino`) importada por `walletconnect`, que a su vez era traída por el paquete genérico `@solana/wallet-adapter-wallets`. La solución fue:
    *   Eliminar el paquete genérico y añadir solo los adaptadores de billetera específicos.
    *   Añadir una configuración de `webpack` en `next.config.mjs` para excluir explícitamente las librerías de Node.js del paquete del cliente.

## 4. Automatización del Despliegue (`deploy.sh`)

*   **Función que Cumplía:** El script original usaba `forge script` para desplegar los contratos de Solidity en Anvil.
*   **Adaptación a Solana:** El script fue reescrito desde cero para orquestar el despliegue en un entorno de Solana local (Surfpool):
    1.  Ejecuta `anchor build` y `anchor deploy`.
    2.  Extrae el **Program ID** del programa desplegado.
    3.  Lee el **IDL** (`target/idl/solana.json`).
    4.  **Genera dinámicamente los archivos `.env.local`** para todas las UIs, inyectando el Program ID y el RPC_URL, garantizando que todo el ecosistema esté sincronizado.

## 5. Conclusión

La migración fue un éxito. Se reemplazó una arquitectura monolítica de Ethereum por un sistema más modular y de alto rendimiento en Solana. El proceso de depuración fue clave para entender las sutilezas del ecosistema de Anchor y Next.js. El resultado es una plataforma moderna, escalable y con una experiencia de usuario significativamente más rápida, lista para operar en un entorno de pruebas local.