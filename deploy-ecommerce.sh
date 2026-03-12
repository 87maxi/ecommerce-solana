#!/usr/bin/env bash
set -euo pipefail

ROOT=$PWD
RPC_URL="http://127.0.0.1:8545"
DEPLOYER_PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"

echo "============================================"
echo "🚀 Starting Ecommerce Deployment"
echo "============================================"

# Start Anvil local node if not running
if ! nc -z localhost 8545; then
    echo ""
    echo "🔧 Starting Anvil local blockchain..."
    anvil > /dev/null 2>&1 &
    ANVIL_PID=$!
    sleep 3
    
    # Cleanup function
    cleanup() {
        echo "🧹 Cleaning up..."
        if [ ! -z "${ANVIL_PID:-}" ] && kill -0 "$ANVIL_PID" 2>/dev/null; then
            kill $ANVIL_PID
        fi
    }
    
    # Trap to ensure cleanup on script exit
    trap cleanup EXIT
else
    echo ""
    echo "🔗 Using existing Anvil instance on localhost:8545"
fi

# Deploy Ecommerce Contract
echo ""
echo "📦 Deploying Ecommerce Contract..."
cd $ROOT/sc-ecommerce

# Compile contracts
echo "🎨 Compiling contracts..."
forge build --force > /dev/null 2>&1

# Deploy using script
echo "🚀 Deploying contracts..."
DEPLOY_OUTPUT=$(forge script script/DeployEcommerce.s.sol --rpc-url $RPC_URL --private-key $DEPLOYER_PRIVATE_KEY --broadcast --silent)

if [ $? -eq 0 ]; then
    echo "✅ Ecommerce contracts deployed successfully."
else
    echo "❌ Ecommerce deployment failed."
    exit 1;
fi

# Extract addresses from deployment files
ECOMMERCE_ADDRESS=$(jq -r '.transactions[] | select(.contractName == "Ecommerce") | .contractAddress' ./broadcast/DeployEcommerce.s.sol/31337/run-latest.json | tail -n 1)
ECOMMERCE_ABI_JSON=$(forge inspect "Ecommerce" abi --json)

# For the EuroToken, we need to find the ERC20Mock deployment
EUROTOKEN_ADDRESS=$(jq -r '.transactions[] | select(.contractName == "ERC20Mock") | .contractAddress' ./broadcast/DeployEcommerce.s.sol/31337/run-latest.json | tail -n 1)

echo "📍 Ecommerce Address: $ECOMMERCE_ADDRESS"
echo "📍 EuroToken Address: $EUROTOKEN_ADDRESS"

# Configure Web-Admin
echo ""
echo "⚙️  Configuring Web-Admin..."
cd $ROOT/web-admin
mkdir -p src/contracts/abis 2>/dev/null || true
echo $ECOMMERCE_ABI_JSON | jq '.' > src/contracts/abis/EcommerceABI.json

# Create or update .env.local file
cat > .env.local << EOF
NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS=$ECOMMERCE_ADDRESS
NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS=$EUROTOKEN_ADDRESS
NEXT_PUBLIC_CHAIN_ID=31337
EOF

echo "✅ Web-Admin configured with addresses:"
echo "   Ecommerce: $ECOMMERCE_ADDRESS"
echo "   EuroToken: $EUROTOKEN_ADDRESS"
echo ""
echo "⚠️  Make sure to restart your Next.js server to pick up the new .env changes!"
echo "💡 To run the web-admin, execute: cd web-admin && npm run dev"

# Print summary for easy copy-paste
echo ""
echo "============================================"
echo "📋 Configuration Summary"
echo "============================================"
echo "Add these to your web-admin/.env.local file:"
echo ""
echo "NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS=$ECOMMERCE_ADDRESS"
echo "NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS=$EUROTOKEN_ADDRESS"
echo "NEXT_PUBLIC_CHAIN_ID=31337"
echo ""
echo "Then restart your web-admin development server."
EOF