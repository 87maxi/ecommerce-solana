#!/bin/bash

# Script de despliegue para el panel de administración

set -e

echo "Iniciando despliegue del panel de administración..."

# Verificar que estamos en el directorio correcto
cd "$(dirname "$0")/.."

# Verificar dependencias
if ! command -v node &> /dev/null; then
  echo "Error: Node.js no está instalado"
  exit 1
fi

if ! command -v npm &> /dev/null; then
  echo "Error: npm no está instalado"
  exit 1
fi

# Instalar dependencias
echo "Instalando dependencias..."
npm ci

# Ejecutar tests
echo "Ejecutando tests..."
npm test

# Construir la aplicación
echo "Construyendo la aplicación..."
npm run build

# Verificar que la construcción fue exitosa
if [ ! -d ".next" ]; then
  echo "Error: La construcción falló"
  exit 1
fi

echo "Despliegue completado exitosamente!"

echo "Para iniciar la aplicación en producción:"
echo "  npm start"
