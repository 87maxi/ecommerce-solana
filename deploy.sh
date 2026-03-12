#!/usr/bin/env bash
set -euo pipefail

ROOT=$PWD
RPC_URL="http://127.0.0.1:8545"
DEPLOYER_PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
OWNER_PRIVATE_KEY="0x70997970C51812dc3A010C7d01b50e0d17dc79C8" # Account 1 from Anvil

# Stripe Keys (decoded)
STRIPE_SK=$(echo "U1RSSVBFX1NFQ1JFVF9LRVk9c2tfdGVzdF81MVNXd2pJMk1JYkw0UG9GRk5pVDUyVDJzenZTU1pSa0xYbUcwODZvQjBwS0FxZkZsd2U0a3Fhc2loSmMwZFBOUkFMbFdrR2pmak90bkk2dWtXNWR6aTZoSTAwNktjSzFyQVMK" | base64 --decode);
STRIPE_PK=$(echo "TkVYVF9QVUJMSUNfU1RSSVBFX1BVQkxJU0hBQkxFX0tFWT1wa190ZXN0XzUxU1d3akkyTUliTDRQb0ZGR2haZHJEMjlEVElpWDFUSmRuM0hURndXV21ZNEVaZmtuY3lwZ253MG15dTN2Z2hvWVNGd1JuQlU4d2NFWHBlYkpUVW9sQmJvMDBGVEZ2VTVWawo=" | base64 --decode)

echo "============================================"
echo "🚀 Starting Automated Deployment"
echo "============================================"

# 1. Deploy Ecommerce Contract
echo ""
echo "📦 Deploying Ecommerce Contract..."
cd $ROOT/sc-ecommerce
rm -rf cache/* broadcast/*
DEPLOY_ECOMMERCE=$(forge script script/DeployEcommerce.s.sol --rpc-url $RPC_URL --private-key $DEPLOYER_PRIVATE_KEY --broadcast || exit 1);

if [ $? -eq 0 ]; then
    echo "✅ Ecommerce deployed successfully."
else
    echo "❌ Ecommerce deployment failed."
    exit 1;
fi

ECOMMERCE_ADDRESS=$(jq -r '.transactions[] | select(.contractName == "Ecommerce") | .contractAddress' ./broadcast/*/31337/run-latest.json | tail -n 1)
ECOMMERCE_ABI_JSON=$(forge inspect "Ecommerce" abi --json);
echo "📍 Ecommerce Address: $ECOMMERCE_ADDRESS"

# 2. Deploy EuroToken Contract
echo ""
echo "📦 Deploying EuroToken Contract..."
cd $ROOT/stablecoin/sc
rm -rf cache/* broadcast/*
DEPLOY_STABLECOIN=$(forge script script/DeployEuroToken.s.sol --rpc-url $RPC_URL --private-key $DEPLOYER_PRIVATE_KEY --broadcast || exit 1);

if [ $? -eq 0 ]; then
    echo "✅ EuroToken deployed successfully."
else
    echo "❌ EuroToken deployment failed."
    exit 1;
fi

EUROTOKEN_ADDRESS=$(jq -r '.transactions[] | select(.contractName == "EuroToken") | .contractAddress' ./broadcast/*/31337/run-latest.json | tail -n 1)
EUROTOKEN_ABI_JSON=$(forge inspect "EuroToken" abi --json);
echo "📍 EuroToken Address: $EUROTOKEN_ADDRESS"

# 3. Configure Web-Customer (Port 3030)
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

# 4. Configure Web-Admin (Port 3032)
echo ""
echo "⚙️  Configuring Web-Admin..."
cd $ROOT/web-admin
mkdir -p src/contracts/abis
echo $ECOMMERCE_ABI_JSON | jq '.' > src/contracts/abis/EcommerceABI.json

cat > .env.local << EOF
NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS=$ECOMMERCE_ADDRESS
NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS=$EUROTOKEN_ADDRESS
NEXT_PUBLIC_CHAIN_ID=31337
EOF

# Update addresses.ts if it exists
# if [ -f "src/lib/contracts/addresses.ts" ]; then
#     sed -i "s/ecommerce: .*,/ecommerce: process.env.NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS || '$ECOMMERCE_ADDRESS',/" src/lib/contracts/addresses.ts
#     sed -i "s/euroToken: .*,/euroToken: process.env.NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS || '$EUROTOKEN_ADDRESS',/" src/lib/contracts/addresses.ts
# fi
echo "✅ Web-Admin configured"

# 5. Configure Compra-Stablecoin (Port 3033)
echo ""
echo "⚙️  Configuring Compra-Stablecoin..."
cd $ROOT/stablecoin/compra-stablecoin
mkdir -p src/contracts/abis
echo $EUROTOKEN_ABI_JSON | jq '.' > src/contracts/abis/StableCoinABI.json

cat > .env << EOF
$STRIPE_PK
$STRIPE_SK
STRIPE_WEBHOOK_SECRET=whsec_test_secret
NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS=$EUROTOKEN_ADDRESS
OWNER_PRIVATE_KEY=$OWNER_PRIVATE_KEY
NEXT_PUBLIC_SITE_URL=http://localhost:3033
NEXT_PUBLIC_PASARELA_PAGO_URL=http://localhost:3034
NEXT_PUBLIC_NETWORK_NAME=anvil
NODE_ENV=development
EOF
echo "✅ Compra-Stablecoin configured"

# 6. Configure Pasarela-de-Pago (Port 3034)
echo ""
echo "⚙️  Configuring Pasarela-de-Pago..."
cd $ROOT/stablecoin/pasarela-de-pago
mkdir -p src/contracts/abis
echo $EUROTOKEN_ABI_JSON | jq '.' > src/contracts/abis/StableCoinABI.json

cat > .env << EOF
$STRIPE_PK
$STRIPE_SK
TURSO_DATABASE_URL=http://localhost:3032
NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS=$EUROTOKEN_ADDRESS
turso_AUTH_TOKEN=abc123
NEXT_PUBLIC_COMPRAS_STABLEBOIN_URL=http://localhost:3033
EOF
echo "✅ Pasarela-de-Pago configured"

echo ""
echo "============================================"
echo "🎉 Deployment & Configuration Complete!"
echo "============================================"
echo "Contracts:"
echo " - Ecommerce: $ECOMMERCE_ADDRESS"
echo " - EuroToken: $EUROTOKEN_ADDRESS"
echo ""
echo "Applications Configured:"
echo " - Web Customer: http://localhost:3030"
echo " - Web Admin:    http://localhost:3032"
echo " - Stablecoin:   http://localhost:3033"
echo " - Pasarela:     http://localhost:3034"
echo ""
echo "⚠️  Make sure to restart your Next.js servers to pick up the new .env changes!"