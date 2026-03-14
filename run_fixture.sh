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
ANCHOR_DIR="$SCRIPT_DIR/solana-stablecoin/solana"

# 3. Entrar al directorio del motor (donde están las dependencias de TS)
cd "$ANCHOR_DIR"

# Instalar dependencias si no existen
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias necesarias..."
    npm install --legacy-peer-deps
fi

# 4. Ejecutar el motor de fixtures directamente con ts-node
# Usamos --transpile-only para saltar la validación de tipos profunda de Anchor
echo "🚀 Ejecutando motor de metaprogramación..."
# Pasamos el Program ID como un segundo argumento al script TS si está definido
if [ -n "$OVERRIDE_PROGRAM_ID" ]; then
    npx ts-node --transpile-only -P ./tsconfig.json scripts/fixture-engine.ts "$FIXTURE_FILE" "$OVERRIDE_PROGRAM_ID"
else
    npx ts-node --transpile-only -P ./tsconfig.json scripts/fixture-engine.ts "$FIXTURE_FILE"
fi

if [ $? -eq 0 ]; then
    echo ""
    echo "✨ Importación completada con éxito."
else
    echo ""
    echo "💥 Error durante la importación."
    exit 1
fi
