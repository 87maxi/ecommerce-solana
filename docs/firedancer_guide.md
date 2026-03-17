# Guía de Implementación: Firedancer & Frankendancer

Esta guía detalla qué es Firedancer, su arquitectura revolucionaria, cómo instalarlo en Linux y su estrecha vinculación con el ecosistema de Jito.

## 1. ¿Qué es Firedancer?

**Firedancer** es un cliente validador de Solana de próxima generación, desarrollado íntegramente en **C** por **Jump Crypto**. Es la primera implementación independiente del protocolo Solana que no hereda el código base original en Rust de Agave (Solana Labs).

### Objetivos Principales:
- **Rendimiento Masivo**: Diseñado para alcanzar más de **1 millón de transacciones por segundo (1M+ TPS)**.
- **Diversidad de Red**: Al tener un segundo cliente independiente, Solana se vuelve inmune a fallos que solo afecten a la implementación de Rust.
- **Optimización de Bajo Nivel**: Aprovecha al máximo el hardware moderno mediante el "bypass" del kernel de Linux y el uso de instrucciones AVX-512.

---

## 2. Características de la Arquitectura

Firedancer no funciona como un proceso único monolítico, sino como una red de **"Tiles"** (baldosas):

- **Arquitectura de Tiles**: Cada función (networking, verificación de firmas, ejecución) corre en un núcleo de CPU dedicado, comunicándose mediante colas de memoria compartida de ultra-baja latencia.
- **Zero-Copy**: Los datos fluyen entre los tiles sin ser copiados en memoria, reduciendo drásticamente el uso de CPU y la latencia.
- **Hardware Agnostic (pero optimizado)**: Aunque corre en hardware estándar, brilla en CPUs con soporte para **AVX-512** y tarjetas de red que soportan **XDP** o **DPDK**.

---

## 3. Instalación en Entornos Linux (Ubuntu/Debian)

### Requisitos de Sistema:
- **Kernel**: 4.18 o superior.
- **CPU**: Se recomiendan 24+ núcleos (8 dedicados solo a la red).
- **RAM**: 256GB+.
- **Sistema**: Ubuntu 22.04 LTS es la plataforma de pruebas estándar.

### Pasos de Compilación:
1. **Clonar el repositorio y submódulos**:
   ```bash
   git clone --recurse-submodules https://github.com/firedancer-io/firedancer.git
   cd firedancer
   ```

2. **Instalar dependencias y preparar el entorno**:
   ```bash
   ./deps.sh
   ```

3. **Compilar el controlador y el validador**:
   ```bash
   make -j fdctl solana
   ```
   *Los binarios se generarán en `./build/native/gcc/bin/`.*

---

## 4. Frankendancer vs Firedancer

| Versión | Descripción | Estado |
| :--- | :--- | :--- |
| **Frankendancer** | Híbrido: Red de Firedancer (C) + Ejecución de Agave (Rust). | **Listo para Mainnet/Testnet** |
| **Firedancer** | Implementación 100% C (Networking + Ejecución). | En desarrollo activo (Alpha) |

### Cómo ejecutar Frankendancer:
1. **Inicializar la configuración**:
   ```bash
   sudo ./build/native/gcc/bin/fdctl configure init all --config config.toml
   ```
2. **Lanzar el validador**:
   ```bash
   ./build/native/gcc/bin/fdctl run --config config.toml
   ```

---

## 5. Vinculación con Jito Foundation

Firedancer y Jito no son excluyentes; de hecho, están diseñados para trabajar juntos en validadores de alto rendimiento.

### Puntos de Integración:
- **Bundle Tile**: Firedancer incluye un "tile" específico para procesar los **Bundles de MEV** de Jito. Esto permite que un validador que use Firedancer siga participando en las subastas de Jito.
- **Soporte Shredstream**: Firedancer puede consumir el stream de "shreds" (pedazos de bloques) de Jito para optimizar la construcción de bloques antes de que lleguen por la red estándar.
- **MEV Tips**: El motor de Frankendancer está preparado para manejar el programa de distribución de propinas de Jito, asegurando que los delegadores no pierdan recompensas.

---

## 6. Ventajas de la Implementación

1. **Escalabilidad Horizontal**: Firedancer permite a Solana escalar a medida que el hardware mejora, sin los cuellos de botella del runtime actual.
2. **Seguridad Mejorada**: Su arquitectura "Sandboxed" aísla los componentes de red de los de ejecución, protegiendo al validador contra exploits remotos.
3. **Eficiencia Energética**: Al procesar transacciones con menos ciclos de CPU, el costo por transacción y el impacto ambiental se reducen.

> [!TIP]
> Si eres un operador de nodos pequeño, `Frankendancer` es el punto de entrada ideal para experimentar la estabilidad y eficiencia del ecosistema Firedancer hoy mismo.
