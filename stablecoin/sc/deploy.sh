#!/bin/bash
# Script para ejecutar tests, reportes de gas y despliegue de EuroToken

set -e

export PROJECT_ROOT="${PWD}"

echo "Iniciando proceso de desarrollo y despliegue..."

echo ""
echo "[1/3] Ejecutando pruebas funcionales y de seguridad..."
cd "$PROJECT_ROOT"
forge test --force


echo ""
echo "[2/3] Generando reporte detallado de consumo de gas..."
cd "$PROJECT_ROOT"
forge test --gas-report > "$PROJECT_ROOT/reports/gas-report.txt"

echo ""
echo "[3/3] Desplegando contrato en anvil local..."

# Iniciar anvil en segundo plano
anvil &
ANVIL_PID=$!
sleep 2

# Desplegar contrato
forge script script/DeployEuroToken.s.sol:DeployEuroTokenScript --rpc-url http://localhost:8545 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --broadcast

# Limpiar procesos
kill $ANVIL_PID 2>/dev/null || true

echo ""
echo "✅ Proceso completado:"
echo "   - Pruebas ejecutadas"
echo "   - Reporte de gas generado en reports/gas-report.txt"
echo "   - Contrato desplegado localmente"

echo ""
echo "Siguientes pasos:"
echo "1. Revisar reports/gas-report.txt"
echo "2. Conectar Metamask a http://localhost:8545"
echo "3. Usar dirección del contrato desplegado"

exit 0
