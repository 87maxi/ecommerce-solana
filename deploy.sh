#!/usr/bin/env bash
set -euo pipefail

ROOT=$PWD
# Local Surfpool Solana RPC URL
RPC_URL="http://127.0.0.1:8899"

# Stripe Keys (decoded)
STRIPE_SK=$(echo "U1RSSVBFX1NFQ1JFVF9LRVk9c2tfdGVzdF81MVNXd2pJMk1JYkw0UG9GRk5pVDUyVDJzenZTU1pSa0xYbUcwODZvQjBwS0FxZkZsd2U0a3Fhc2loSmMwZFBOUkFMbFdrR2pmak90bkk2dWtXNWR6aTZoSTAwNktjSzFyQVMK" | base64 --decode)
STRIPE_PK=$(echo "TkVYVF9QVUJMSUNfU1RSSVBFX1BVQkxJU0hBQkxFX0tFWT1wa190ZXN0XzUxU1d3akkyTUliTDRQb0ZGR2haZHJEMjlEVElpWDFUSmRuM0hURndXV21ZNEVaZmtuY3lwZ253MG15dTN2Z2hvWVNGd1JuQlU4d2NFWHBlYkpUVW9sQmJvMDBGVEZ2VTVWawo=" | base64 --decode)

echo "============================================"
echo "🚀 Starting Automated Solana Deployment (Surfpool Local)"
echo "============================================"

# Ensure the solana CLI is using local network
solana config set --url localhost

# Generate local wallet if it doesn't exist
if [ ! -f ~/.config/solana/id.json ]; then
    echo "🔑 Generating local solana keypair..."
    solana-keygen new --no-bip39-passphrase --silent
fi

# Request airdrop on local testnet
echo "💰 Requesting airdrop for deployment..."
solana airdrop 10 || true

# 1. Build and Deploy Anchor Programs
echo ""
echo "📦 Building and Deploying Solana Anchor Program..."
cd $ROOT/solana-stablecoin/solana

echo "Compiling Anchor program..."
anchor build

PROGRAM_KEYPAIR="target/deploy/solana-keypair.json"
PROGRAM_ID=$(solana address -k $PROGRAM_KEYPAIR)
echo "📍 Program ID: $PROGRAM_ID"

echo "Deploying to local Surfpool cluster..."
anchor deploy

if [ $? -eq 0 ]; then
    echo "✅ Solana program deployed successfully."
else
    echo "❌ Solana program deployment failed."
    exit 1;
fi

IDL_JSON=$(cat target/idl/solana.json)

# For now, we'll use the Program ID for both, as they are unified in one program.
EUROTOKEN_MINT_ADDRESS=$PROGRAM_ID
ECOMMERCE_PROGRAM_ADDRESS=$PROGRAM_ID

# 2. Configure Web-Customer (Port 3030)
echo ""
echo "⚙️  Configuring Web-Customer..."
cd $ROOT/web-customer
mkdir -p src/contracts/abis
echo $IDL_JSON > src/contracts/abis/EcommerceABI.json

cat > .env.local << EOF
NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS=$ECOMMERCE_PROGRAM_ADDRESS
NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS=$EUROTOKEN_MINT_ADDRESS
NEXT_PUBLIC_RPC_URL=$RPC_URL
NEXT_PUBLIC_PASARELA_PAGO_URL=http://localhost:3034
EOF
echo "✅ Web-Customer configured"

# 3. Configure Web-Admin (Port 3032)
echo ""
echo "⚙️  Configuring Web-Admin..."
cd $ROOT/web-admin
mkdir -p src/contracts/abis
echo $IDL_JSON > src/contracts/abis/EcommerceABI.json

cat > .env.local << EOF
NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS=$ECOMMERCE_PROGRAM_ADDRESS
NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS=$EUROTOKEN_MINT_ADDRESS
NEXT_PUBLIC_RPC_URL=$RPC_URL
EOF
echo "✅ Web-Admin configured"

# 4. Configure Compra-Stablecoin (Port 3033)
echo ""
echo "⚙️  Configuring Compra-Stablecoin..."
cd $ROOT/solana-stablecoin/compra-stablecoin
mkdir -p src/contracts/abis
echo $IDL_JSON > src/contracts/abis/StableCoinABI.json

cat > .env.local << EOF
$STRIPE_PK
$STRIPE_SK
STRIPE_WEBHOOK_SECRET=whsec_test_secret
NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS=$EUROTOKEN_MINT_ADDRESS
OWNER_PRIVATE_KEY='$(cat ~/.config/solana/id.json)'
NEXT_PUBLIC_SITE_URL=http://localhost:3033
NEXT_PUBLIC_PASARELA_PAGO_URL=http://localhost:3034
NEXT_PUBLIC_RPC_URL=$RPC_URL
NODE_ENV=development
EOF
echo "✅ Compra-Stablecoin configured"

# 5. Configure Pasarela-de-Pago (Port 3034)
echo ""
echo "⚙️  Configuring Pasarela-de-Pago..."
cd $ROOT/solana-stablecoin/pasarela-de-pago
mkdir -p src/contracts/abis
echo $IDL_JSON > src/contracts/abis/StableCoinABI.json

cat > .env.local << EOF
$STRIPE_PK
$STRIPE_SK
TURSO_DATABASE_URL=http://localhost:3032
NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS=$EUROTOKEN_MINT_ADDRESS
turso_AUTH_TOKEN=abc123
NEXT_PUBLIC_COMPRAS_STABLEBOIN_URL=http://localhost:3033
OWNER_PRIVATE_KEY='$(cat ~/.config/solana/id.json)'
RPC_URL=$RPC_URL
EOF
echo "✅ Pasarela-de-Pago configured"

echo ""
echo "============================================"
echo "🎉 Solana Deployment & Configuration Complete!"
echo "============================================"
echo "Solana Anchor Program:"
echo " - Program ID: $PROGRAM_ID"
echo " - Network: $RPC_URL (Local Surfpool)"
echo ""
echo "Applications Configured:"
echo " - Web Customer: http://localhost:3030"
echo " - Web Admin:    http://localhost:3032"
echo " - Stablecoin:   http://localhost:3033"
echo " - Pasarela:     http://localhost:3034"
echo ""
echo "⚠️  Make sure to restart your Next.js servers to pick up the new .env.local changes!"
