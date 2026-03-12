#!/usr/bin/env bash
set -euo pipefail

ROOT=$PWD
RPC_URL="http://127.0.0.1:8545"
DEPLOYER_PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
OWNER_ADDRESS_KEY="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" # Account 1 from Anvil

# Stripe Keys (decoded)
STRIPE_SK=$(echo "U1RSSVBFX1NFQ1JFVF9LRVk9c2tfdGVzdF81MVNXd2pJMk1JYkw0UG9GRk5pVDUyVDJzenZTU1pSa0xYbUcwODZvQjBwS0FxZkZsd2U0a3Fhc2loSmMwZFBOUkFMbFdrR2pmak90bkk2dWtXNWR6aTZoSTAwNktjSzFyQVMK" | base64 --decode)
STRIPE_PK=$(echo "TkVYVF9QVUJMSUNfU1RSSVBFX1BVQkxJU0hBQkxFX0tFWT1wa190ZXN0XzUxU1d3akkyTUliTDRQb0ZGR2haZHJEMjlEVElpWDFUSmRuM0hURndXV21ZNEVaZmtuY3lwZ253MG15dTN2Z2hvWVNGd1JuQlU4d2NFWHBlYkpUVW9sQmJvMDBGVEZ2VTVWawo=" | base64 --decode)

echo "============================================"
echo "🚀 Starting Complete Automated Deployment"
echo "============================================"

# Start Anvil local node
echo ""
echo "🔧 Starting Anvil local blockchain..."
anvil > anvil.log &
ANVIL_PID=$!
sleep 3

# Cleanup function
cleanup() {
    echo "🧹 Cleaning up..."
    if [ ! -z "$ANVIL_PID" ] && kill -0 "$ANVIL_PID" 2>/dev/null; then
        kill $ANVIL_PID
    fi
}

# Trap to ensure cleanup on script exit
trap cleanup EXIT

# 1. Deploy Ecommerce Contract (which includes EuroToken)
echo ""
echo "📦 Deploying Ecommerce Contract with EuroToken..."
cd $ROOT/sc-ecommerce


# Deploy Ecommerce contract with EuroToken
echo "💸 Deploying Ecommerce contracts..."
DEPLOY_OUTPUT=$(forge script script/DeployEcommerce.s.sol --rpc-url $RPC_URL --private-key $DEPLOYER_PRIVATE_KEY --broadcast --silent)

if [ $? -eq 0 ]; then
    echo "✅ Ecommerce contracts deployed successfully."
else
    echo "❌ Ecommerce deployment failed."
    exit 1;
fi

# Extract addresses from deployment files

ECOMMERCE_ABI_JSON=$(forge inspect "Ecommerce" abi --json)

# Extract EuroToken address from the Ecommerce deployment (ERC20Mock)
ECOMMERCE_ADDRESS=$(jq -r '.transactions[] | select(.contractName == "Ecommerce") | .contractAddress' ./broadcast/DeployEcommerce.s.sol/31337/run-latest.json | tail -n 1)
echo "📍 Ecommerce Address: $ECOMMERCE_ADDRESS"

# Deploy EuroToken separately to get its ABI and address

cd $ROOT/stablecoin/sc



DEPLOY_OUTPUT=$(forge script script/DeployEuroToken.s.sol --rpc-url $RPC_URL --private-key $DEPLOYER_PRIVATE_KEY --broadcast --silent)


if [ $? -eq 0 ]; then
    echo "✅ EuroToken contracts deployed successfully."
else
    echo "❌ EuroToken deployment failed."
    exit 1;
fi


EUROTOKEN_ABI_JSON=$(forge inspect "EuroToken" abi --json)


EUROTOKEN_ADDRESS=$(jq -r '.transactions[] | select(.contractName == "EuroToken") | .contractAddress' ./broadcast/DeployEuroToken.s.sol/31337/run-latest.json | tail -n 1)

echo "📍 EuroToken Address: $EUROTOKEN_ADDRESS"

cd $ROOT
# Configure Applications with deployed contract addresses



# 2. Configure Web-Customer (Port 3030)
echo ""
echo "⚙️  Configuring Web-Customer..."
cd $ROOT/web-customer
mkdir -p src/contracts/abis
echo $ECOMMERCE_ABI_JSON | jq '.' > src/contracts/abis/EcommerceABI.json

cat > .env.local << EOF
NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS=$ECOMMERCE_ADDRESS
NEXT_PUBLIC_EXPECTED_CHAIN_ID=31337
NEXT_PUBLIC_PASARELA_PAGO_URL=http://localhost:3034
EOF
echo "✅ Web-Customer configured"

# 3. Configure Web-Admin (Port 3032)
echo ""
echo "⚙️  Configuring Web-Admin..."
cd $ROOT/web-admin
mkdir -p src/contracts/abis 2>/dev/null || true
echo $ECOMMERCE_ABI_JSON | jq '.' > src/contracts/abis/EcommerceABI.json

cat > .env.local << EOF
NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS=$ECOMMERCE_ADDRESS
NEXT_PUBLIC_CHAIN_ID=31337
EOF

echo "✅ Web-Admin configured with addresses:"
echo "   Ecommerce: $ECOMMERCE_ADDRESS"


# 4. Configure Compra-Stablecoin (Port 3033)


echo ""
echo "⚙️  Configuring Compra-Stablecoin..."
ROOT_STABLECOIN=$ROOT/stablecoin



# 5. Configure compra-stablecoin (Port 3033)


cd $ROOT_STABLECOIN/compra-stablecoin
rm -rf src/contracts/abis
mkdir -p src/contracts/abis 2>/dev/null || true

echo $EUROTOKEN_ABI_JSON | jq '.' > src/contracts/abis/EuroTokenABI.json

echo $EUROTOKEN_ABI_JSON

cat > .env.local << EOF
$STRIPE_PK
$STRIPE_SK
NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS=$EUROTOKEN_ADDRESS
DEPLOYER_PRIVATE_KEY=$DEPLOYER_PRIVATE_KEY
OWNER_ADDRESS_KEY=$OWNER_ADDRESS_KEY
RPC_URL=http://127.0.0.1:8545
NEXT_PUBLIC_NETWORK_NAME=localhost
NEXT_PUBLIC_SITE_URL=http://localhost:3033
NEXT_PUBLIC_PASARELA_PAGO_URL=http://localhost:3034
NEXT_PUBLIC_WEB_CUSTOMER_URL=http://localhost:3031

EOF
echo "✅ Compra-Stablecoin configured"

# 5. Configure Pasarela-de-Pago (Port 3034)
echo ""
echo "⚙️  Configuring Pasarela-de-Pago..."
cd $ROOT_STABLECOIN/pasarela-de-pago
mkdir -p src/contracts/abis 2>/dev/null || true
echo $EUROTOKEN_ABI_JSON | jq '.' > src/contracts/abis/EuroTokenABI.json

cat > .env.local << EOF
$STRIPE_PK
$STRIPE_SK
TURSO_DATABASE_URL=http://localhost:3032
NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS=$EUROTOKEN_ADDRESS
OWNER_ADDRESS_KEY=$OWNER_ADDRESS_KEY
TURSO_AUTH_TOKEN=abc123
NEXT_PUBLIC_COMPRAS_STABLECOIN_URL=http://localhost:3033
RPC_URL=http://127.0.0.1:8545
MERCHANT_WALLET_ADDRESS=$OWNER_ADDRESS_KEY
OWNER_PRIVATE_KEY=$DEPLOYER_PRIVATE_KEY
EOF



echo "✅ Pasarela-de-Pago configured"

echo ""
echo "============================================"
echo "🎉 Complete Deployment & Configuration Done!"
echo "============================================"
echo "Contracts:"
echo " - Ecommerce: $ECOMMERCE_ADDRESS"
echo " - EuroToken: $EUROTOKEN_ADDRESS"
echo "OWNER_ADDRESS_KEY = $OWNER_ADDRESS_KEY"
echo ""
echo "Applications Configured:"
echo " - Web Customer: http://localhost:3030"
echo " - Web Admin:    http://localhost:3032"
echo " - Stablecoin:   http://localhost:3033"
echo " - Pasarela:     http://localhost:3034"
echo ""
echo "⚠️  Make sure to restart your Next.js servers to pick up the new .env changes!"
echo "💡 To run the applications, execute:"
cd $ROOT;
