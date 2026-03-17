#!/bin/bash

# Solana Fixture Execution Engine (Agnostic Wrapper)
# Este script importa datos a la red de forma agnóstica utilizando ts-node directamente.
# No realiza builds del programa para agilizar la carga de datos.

set -e

# 1. Obtener la ruta absoluta del archivo de fixture
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEFAULT_FIXTURE="$SCRIPT_DIR/fixture/ecommerce_data.json"

# 1. Obtener la ruta absoluta del archivo de fixture y el Program ID opcional
# Argumento 1: Ruta al archivo de fixture (obligatorio)
# Argumento 2: Program ID (opcional, sobrescribe el del fixture)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEFAULT_FIXTURE="$SCRIPT_DIR/fixture/ecommerce_data.json"

FIXTURE_FILE=""
OVERRIDE_PROGRAM_ID=""

if [ -n "$1" ]; then
    # Si el primer argumento es un archivo, lo asignamos como FIXTURE_FILE
    if [ -f "$1" ]; then
        FIXTURE_FILE="$(realpath "$1")"
        if [ -n "$2" ]; then
            OVERRIDE_PROGRAM_ID="$2"
        fi
    # Si no es un archivo, asumimos que es el Program ID y usamos el fixture por defecto
    else
        OVERRIDE_PROGRAM_ID="$1"
        FIXTURE_FILE="$DEFAULT_FIXTURE"
    fi
else
    FIXTURE_FILE="$DEFAULT_FIXTURE"
fi

# 2. Verificar existencia del fixture
if [ ! -f "$FIXTURE_FILE" ]; then
    echo "❌ Error: No se encontró el archivo de fixture en: $FIXTURE_FILE"
    exit 1
fi

echo "🔎 Iniciando importación de datos en Solana..."
ECOMMERCE_DIR="$SCRIPT_DIR/solana-ecommerce"

# 3. Entrar al directorio de solana-ecommerce
cd "$ECOMMERCE_DIR"

# 4. Ejecutar el motor de fixtures escrito en Rust
echo "🚀 Ejecutando motor de metaprogramación (Rust Native)..."

# Construimos los argumentos para el fixture-tool
ARGS=("--fixture" "$FIXTURE_FILE")
if [ -n "$OVERRIDE_PROGRAM_ID" ]; then
    ARGS+=("--program-id" "$OVERRIDE_PROGRAM_ID")
fi

# Ejecutamos con cargo
cargo run -q -p fixture-tool -- "${ARGS[@]}"

if [ $? -eq 0 ]; then
    echo ""
    echo "✨ Importación completada con éxito."
else
    echo ""
    echo "💥 Error durante la importación."
    exit 1
fi
