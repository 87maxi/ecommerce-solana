# Reporte de Migración: De Ethereum a Solana (EuroToken y Pasarela de Pago)

## 1. Introducción
El presente documento detalla el proceso técnico, las decisiones arquitectónicas y los cambios de código realizados para migrar el ecosistema `stablecoin` (EuroToken) y sus interfaces de usuario de una red basada en la Ethereum Virtual Machine (EVM) hacia la blockchain de Solana.

El objetivo principal de esta transición fue adaptar la lógica existente de un token estable respaldado 1:1 con el Euro, manteniendo sus características fundamentales (como la precisión de 6 decimales), pero aprovechando las ventajas de alta velocidad y bajas comisiones que ofrece la red de Solana.

## 2. Transición del Smart Contract al Programa en Solana

### 2.1. De Solidity (ERC-20) a Rust (SPL Token con Anchor)
En la arquitectura original, el contrato `EuroToken.sol` heredaba de las implementaciones estándar de OpenZeppelin (`ERC20` y `Ownable`). La gestión de la emisión (mint) y la quema (burn) estaba controlada mediante verificaciones de `msg.sender` a través del modificador `onlyOwner`.

En Solana, la arquitectura cambia fundamentalmente. En lugar de almacenar balances dentro de un mapa en el contrato inteligente, Solana utiliza el programa oficial **SPL Token**. Por lo tanto, el nuevo programa (desarrollado con el framework **Anchor**) actúa principalmente como un controlador de la **Mint Authority** (Autoridad de Acuñación).

**Cambios clave realizados:**
- **Creación de un PDA (Program Derived Address):** En lugar de asignar la autoridad de minteo a una llave privada tradicional (como en EVM), se utilizó un PDA generado por el programa utilizando la semilla `b"mint_authority"`. Esto permite que solo nuestro programa de Anchor firme y apruebe operaciones de minteo, garantizando la seguridad.
- **Instrucciones de Programa:** Se desarrollaron las instrucciones `initialize`, `mint_tokens` y `burn_tokens` que realizan Cross-Program Invocations (CPI) al programa oficial de tokens de Solana (`token_program`).
- **Conservación de Decimales:** Al inicializar el Mint en Solana, se definió un parámetro explícito de `decimals = 6` para asegurar compatibilidad total con la lógica de negocio original que asume representaciones en céntimos de Euro.

## 3. Adaptación del Frontend (Pasarela de Pago y Compra de Stablecoin)

### 3.1. Reemplazo de Proveedores y Billeteras (Wallets)
En la red Ethereum, la conexión de billeteras dependía de bibliotecas como `ethers.js` y la inyección del objeto `window.ethereum` para MetaMask. 

Para Solana, este ecosistema fue reemplazado por completo:
- **Solana Wallet Adapter:** Se implementó el componente `AppWalletProvider.tsx` utilizando `@solana/wallet-adapter-react` y `@solana/wallet-adapter-react-ui`. Esto permite conectar billeteras nativas de Solana, siendo Phantom la principal.
- **Gestión de Estado de Red:** Se configuraron variables de entorno (`NEXT_PUBLIC_RPC_URL`) apuntando al endpoint local en lugar de los RPCs de Ethereum (como Anvil o Hardhat).

### 3.2. Refactorización de la Lógica On-Chain (`contracts.ts` y `eurt.ts`)
Toda la interacción con la blockchain debió ser rescrita en TypeScript utilizando `@solana/web3.js` y `@solana/spl-token`.

**Minteo de Tokens (`mintTokens`):**
- **Antes:** Se instanciaba un objeto `ethers.Contract` y se llamaba a `contract.mint()`.
- **Ahora:** El proceso involucra:
  1. Verificar o crear una Cuenta de Token Asociada (**ATA - Associated Token Account**) para el destinatario.
  2. Construir una instrucción serializada invocando la firma de Anchor (`global:mint_tokens`).
  3. Enviar una transacción que el programa Anchor procesa mediante CPI para generar los tokens SPL en la cuenta del cliente.

**Consulta de Saldos (`getBalance`):**
- **Antes:** Llamada a la función estática `balanceOf(address)`.
- **Ahora:** Se obtiene primero la dirección de la cuenta asociada (ATA) del usuario y luego se consulta mediante `connection.getTokenAccountBalance()`.

**Verificación de Transferencias y Pagos (`verifyTransfer`):**
- **Antes:** Se analizaban los registros de eventos (`logs`) generados por transacciones EVM buscando el evento `Transfer`.
- **Ahora:** Se utilizan transacciones parseadas (`getParsedTransaction`) de Solana. La verificación analiza los `preTokenBalances` y `postTokenBalances` de los metadatos de la transacción para comprobar efectivamente la diferencia exacta de saldo transferida a la cuenta comerciante y asegurar que provino del pagador.

## 4. Entorno de Pruebas y Despliegue Local

El entorno de validación fue adaptado para operar con las herramientas del ecosistema Solana:
- Se reemplazó el uso de Anvil (Ethereum) por el validador local de Solana. Las pruebas fueron diseñadas para correr utilizando una red de **Surfpool local** y `solana-test-validator`.
- El puerto RPC nativo cambió por defecto del `8545` de Ethereum al `8899` para la red local de Solana.
- Se configuraron pares de llaves mediante codificación `bs58` o matrices de bytes (`Uint8Array`) en lugar de strings hexadecimales que usa Ethereum como llaves privadas, actualizando así la inyección de las variables de entorno para que los scripts de minteo post-pago (webhook de Stripe) mantengan su funcionalidad automatizada.

## 5. Conclusión

La migración del proyecto `stablecoin/sc` y `stablecoin/pasarela-de-pago` ha resultado en una versión modernizada sobre la infraestructura de Solana, logrando mantener intacta la lógica de negocios y las validaciones de pagos, pasarelas de Stripe y control de facturas.

Al utilizar los estándares modernos de Solana (SPL Token y PDA con Anchor), el sistema está optimizado para procesar compras y pagos de EuroToken a fracciones de centavo en comisiones y confirmaciones casi instantáneas, brindando una base sólida, escalable y en un ambiente totalmente controlado de testnet/local para la etapa de desarrollo.