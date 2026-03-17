# Guía Exhaustiva: Jito Foundation en Solana

Esta guía detalla la infraestructura de Jito, sus funcionalidades únicas, proceso de instalación en Linux, ejecución y herramientas complementarias.

## 1. ¿Qué es Jito Foundation?

Jito es una infraestructura de alto rendimiento diseñada para optimizar el **MEV (Maximal Extractable Value)** en Solana. Su objetivo es mitigar los efectos negativos del spam de transacciones y mejorar la rentabilidad tanto para validadores como para delegadores (stakers).

### ¿Qué agrega a un entorno normal de Solana?
En una red estándar de Solana, las transacciones se procesan principalmente por orden de llegada (o priorizadas por fees crudos). Jito introduce:
- **Bundles (Paquetes):** Permite agrupar múltiples transacciones que se ejecutan de forma atómica (todas o ninguna) y secuencial.
- **Subastas de MEV:** Los "Searchers" (buscadores) compiten en una subasta por el derecho de que sus paquetes se incluyan en los bloques, pagando una "propina" (tip) al validador.
- **Protección contra Spam:** Al mover estas subastas fuera de la red principal de confirmación, se reduce la carga de spam en la red principal.
- **Liquid Staking mejorado (JitoSOL):** Delegar SOL a validadores que corren Jito permite obtener recompensas adicionales provenientes del MEV.

---

## 2. Componentes de la Arquitectura

### A. Jito-Solana
Es un fork del cliente oficial de Solana (Agave) que incluye el código necesario para comunicarse con el **Block Engine** de Jito y ejecutar paquetes de transacciones de forma atómica.

### B. Block Engine (Motor de Bloques)
Actúa como un coordinador global. Recibe transacciones y paquetes de los searchers, realiza subastas de 50ms y envía los flujos de paquetes ganadores a los validadores.

### C. Jito-Relayer
Funciona como un proxy para la unidad de procesamiento de transacciones (TPU). Protege al validador contra ataques DDoS y filtra transacciones, enviándolas tanto al validador como al Block Engine de forma eficiente.

### D. ShredStream
Permite a los searchers recibir actualizaciones de bloques (shreds) con latencia extremadamente baja, permitiéndoles reaccionar instantáneamente a cambios en el estado de la red.

---

## 3. Instalación en Entornos Linux

Para correr un validador Jito-Solana desde el código fuente, sigue estos pasos:

### Requisitos Previos:
- **CPU:** 12+ núcleos (se recomiendan 16+).
- **RAM:** 128GB+ (256GB para Mainnet).
- **Disco:** NVMe de alto rendimiento (~2TB).

### Instalación de Dependencias:
```bash
sudo apt-get update
sudo apt-get install -p libssl-dev libudev-dev pkg-config zlib1g-dev llvm clang cmake make libprotobuf-dev protobuf-compiler
```

### Instalación de Rust:
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
rustup update
```

### Compilación de Jito-Solana:
```bash
# Clonar repositorio
git clone https://github.com/jito-foundation/jito-solana.git --recurse-submodules
cd jito-solana

# Cambiar a la versión estable de Jito (ejemplo v1.18.x-jito)
git checkout tags/v1.18.15-jito 
git submodule update --init --recursive

# Compilar
cargo build --release
```

---

## 4. Pasos de Ejecución

Para iniciar el validador con soporte Jito, debes agregar argumentos específicos a tu comando `solana-validator`.

### Argumentos Clave:
```bash
solana-validator \
  --identity ~/validator-keypair.json \
  --vote-account ~/vote-account-keypair.json \
  --ledger /mnt/ledger \
  --rpc-port 8899 \
  --dynamic-port-range 8000-8020 \
  --entrypoint entrypoint.mainnet-beta.solana.com:8001 \
  # --- ARGUMENTOS JITO ---
  --block-engine-url https://mainnet.block-engine.jito.wtf \
  --tip-payment-program-pubkey T1pyH... \
  --tip-distribution-program-pubkey 4R3W... \
  --commission-bps 1000 \ # 10% de comisión MEV
  --relayer-url http://localhost:8100 # Si usas relayer local
  # ... otros argumentos estándar
```

---

## 5. Herramientas Acoplables y su Implementación

### 1. Jito Searcher SDK
Utilizado para crear bots de MEV que envían paquetes al Block Engine.
- **Implementación:** Disponible en Rust, Python y TypeScript.
- **Uso:** Requiere una `Auth Keypair` registrada con Jito para autenticar las llamadas gRPC.

### 2. Jito Relayer (Stand-alone)
Se puede correr en un servidor separado para mejorar la seguridad del validador.
- **Implementación:** Se descarga y compila desde su propio repositorio. Se configura para escuchar en los puertos de la TPU y reenviar al validador interno.

### 3. Geyser Plugins
Jito es compatible con plugins de Geyser (como el de Jito Labs o Holaplex) para transmitir datos de cuentas e instrucciones en tiempo real a bases de datos externas (PostgreSQL/gRPC).

---

## 6. Proyectos Clave del Ecosistema Jito

A continuación, se listan los proyectos vigentes más importantes de Jito Foundation y Jito Labs, organizados por su función en el ecosistema.

### Infraestructura Principal (Jito Foundation)

- **[jito-solana](https://github.com/jito-foundation/jito-solana)**: El componente principal. Es el fork del cliente Agave/Solana que permite a los validadores ejecutar paquetes (bundles) y recibir propinas MEV.
- **[jito-relayer](https://github.com/jito-foundation/jito-relayer)**: Proxy para la TPU de los validadores. Filtra transacciones y las reenvía eficientemente al Block Engine, protegiendo al validador de spam y DDoS.
- **[jito-programs](https://github.com/jito-foundation/jito-programs)**: Contiene los programas on-chain que gestionan el flujo de propinas (tips) y su distribución a los validadores y delegadores.
- **[geyser-grpc-plugin](https://github.com/jito-foundation/geyser-grpc-plugin)**: Un plugin de alto rendimiento para Geyser que transmite datos de cuentas y slots mediante gRPC, esencial para bots que requieren baja latencia.
- **[jito-tip-router](https://github.com/jito-foundation/jito-tip-router)**: Sistema encargado de enrutar y distribuir las propinas acumuladas on-chain de forma transparente.

### Herramientas para Desarrolladores (Jito Labs)

- **[jito-js-rpc](https://github.com/jito-labs/jito-js-rpc) / [jito-rust-rpc](https://github.com/jito-labs/jito-rust-rpc)**: SDKs oficiales en TypeScript y Rust que facilitan la interacción con el Block Engine, permitiendo el envío de bundles y consulta de estados sin lidiar con gRPC directamente.
- **[mev-bot](https://github.com/jito-labs/mev-bot)**: Ejemplo funcional de un bot de arbitraje tipo "backrun". Es una excelente referencia técnica para entender cómo detectar una transacción en el mempool y enviar un bundle para aprovechar el arbitraje.
- **[block_engine_simple](https://github.com/jito-labs/block_engine_simple)**: Una implementación simplificada del Block Engine para que los desarrolladores puedan testear sus bundles localmente con `jito-solana` sin depender de la red de producción.
- **[shredstream-proxy](https://github.com/jito-foundation/shredstream-proxy)**: Herramienta para obtener shreds (datos de bloques en construcción) directamente del Block Engine, permitiendo a los bots reaccionar a cambios en el estado antes que nadie.

---

## Conclusión

Jito transforma el entorno de Solana de un modelo puramente FIFO a uno de **subastas de prioridad atómica**. Esto permite:
1. **Atómica Reverts:** Si una transacción del paquete falla, todo el paquete falla (ideal para arbitraje).
2. **Ingresos Adicionales:** Los validadores ganan SOL real por procesar MEV.
3. **Eficiencia en el Bloque:** Reduce las transacciones fallidas que de otro modo saturarían la red.

> [!IMPORTANT]
> Correr Jito requiere hardware de servidor de alta gama y una conexión de red con latencia mínima (<50ms) hacia los Block Engines regionales (Ámsterdam, Tokyo, NY, Frankfurt).
