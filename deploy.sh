#!/usr/bin/env bash
set -euo pipefail

ROOT=$PWD
# Local Surfpool Solana RPC URL
RPC_URL="http://127.0.0.1:8899"

# Stripe Keys (decoded) - Keep these for pasarela/compra-stablecoin setup
STRIPE_SK=$(echo "U1RSSVBFX1NFQ1JFVF9LRVk9c2tfdGVzdF81MVNXd2pJMk1JYkw0UG9GRk5pVDUyVDJzenZTU1pSa0xYbUcwODZvQjBwS0FxZkZsd2U0a3Fhc2loSmMwZFBOUkFMbFdrR2pmak90bkk2dWtXNWR6aTZoSTAwNktjSzFyQVMK" | base64 --decode)
STRIPE_PK=$(echo "TkVYVF9QVUJMSUNfU1RSSVBFX1BVQkxJU0hBQkxFX0tFWT1wa190ZXN0XzUxU1d3akkyTUliTDRQb0ZGR2haZHJEMjlEVElpWDFUSmRuM0hURndXV21ZNEVaZmtuY3lwZ253MG15dTN2Z2hvWVNGd1JuQlU4d2NFWHBlYkpUVW9sQmJvMDBGVEZ2VTVWawo=" | base64 --decode)

echo "============================================"
echo "🚀 Starting Full Solana E-Commerce Deployment (Surfpool Local)"
echo "============================================"

# Ensure the solana CLI is using local network
solana config set --url localhost

# Generate local wallet if it doesn't exist
if [ ! -f ~/.config/solana/id.json ]; then
    echo "🔑 Generating local solana keypair..."
    solana-keygen new --no-bip39-passphrase --silent
fi

# Request airdrop on local testnet
echo "💰 Requesting airdrop for deployment wallet..."
solana airdrop 10 || true

# 1. Build and Deploy E-Commerce Anchor Program
echo ""
echo "📦 Building and Deploying E-Commerce Program..."
cd $ROOT/solana-ecommerce

echo "Compiling Anchor program..."
anchor build

PROGRAM_KEYPAIR="target/deploy/solana_ecommerce-keypair.json"
ECOMMERCE_PROGRAM_ADDRESS=$(solana address -k $PROGRAM_KEYPAIR)
echo "📍 E-Commerce Program ID: $ECOMMERCE_PROGRAM_ADDRESS"

echo "Deploying to local Surfpool cluster..."
anchor deploy

if [ $? -eq 0 ]; then
    echo "✅ E-Commerce program deployed successfully."
else
    echo "❌ E-Commerce program deployment failed."
    exit 1;
fi

IDL_JSON=$(cat target/idl/solana_ecommerce.json)

# 2. Create the EURT SPL Token Mint
echo ""
echo "🪙 Creating EURT SPL Token Mint..."
# The output of `create-token` is "Creating token <MINT_ADDRESS>", so we extract it.
MINT_OUTPUT=$(spl-token create-token --decimals 6)
EUROTOKEN_MINT_ADDRESS=$(echo $MINT_OUTPUT | awk '{print $3}')
echo "📍 EURT Mint Address: $EUROTOKEN_MINT_ADDRESS"

# Create an account for the new token so the deployer can mint from it
echo "Creating account for EURT mint..."
spl-token create-account $EUROTOKEN_MINT_ADDRESS
echo "✅ EURT token and account created."

# 3. Configure Web-Customer (Port 3030)
echo ""
echo "⚙️  Configuring Web-Customer..."
cd $ROOT/web-customer
mkdir -p src/contracts/abis
echo $IDL_JSON > src/contracts/abis/EcommerceABI.json

cat > .env.local << EOF
NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS=$ECOMMERCE_PROGRAM_ADDRESS
NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS=$EUROTOKEN_MINT_ADDRESS
NEXT_PUBLIC_RPC_URL=$RPC_URL
NEXT_PUBLIC_SITE_URL=http://localhost:3030
NEXT_PUBLIC_PASARELA_PAGO_URL=http://localhost:3034
NEXT_PUBLIC_COMPRAS_STABLEBOIN_URL=http://localhost:3034
EOF
echo "✅ Web-Customer configured"

# 4. Configure Web-Admin (Port 3032)
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

# 5. Configure Compra-Stablecoin (Port 3033)
echo ""
echo "⚙️  Configuring Compra-Stablecoin..."
cd $ROOT/solana-stablecoin/compra-stablecoin
# No IDL needed here as it's a frontend for the pasarela

cat > .env.local << EOF
$STRIPE_PK
$STRIPE_SK
STRIPE_WEBHOOK_SECRET=whsec_test_secret
NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS=$EUROTOKEN_MINT_ADDRESS
NEXT_PUBLIC_SITE_URL=http://localhost:3033
NEXT_PUBLIC_PASARELA_PAGO_URL=http://localhost:3034
NEXT_PUBLIC_RPC_URL=$RPC_URL
NODE_ENV=development
EOF
echo "✅ Compra-Stablecoin configured"

# 6. Configure Pasarela-de-Pago (Port 3034)
echo ""
echo "⚙️  Configuring Pasarela-de-Pago..."
cd $ROOT/solana-stablecoin/pasarela-de-pago
# No IDL needed here directly, but the mint function needs the mint address

cat > .env.local << EOF
$STRIPE_PK
$STRIPE_SK
STRIPE_WEBHOOK_SECRET=whsec_... # Replace with your `stripe listen` secret
NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS=$EUROTOKEN_MINT_ADDRESS
OWNER_PRIVATE_KEY='$(cat ~/.config/solana/id.json)'
RPC_URL=$RPC_URL
EOF
echo "✅ Pasarela-de-Pago configured"

echo ""
echo "============================================"
echo "🎉 Solana Deployment & Configuration Complete!"
echo "============================================"
echo "Solana E-Commerce Program:"
echo " - Program ID: $ECOMMERCE_PROGRAM_ADDRESS"
echo ""
echo "Solana EURT SPL Token:"
echo " - Mint Address: $EUROTOKEN_MINT_ADDRESS"
echo ""
echo "Network:"
echo " - RPC URL: $RPC_URL (Local Surfpool)"
echo ""
echo "Applications Configured:"
echo " - Web Customer: http://localhost:3030"
echo " - Web Admin:    http://localhost:3032"
echo " - Stablecoin:   http://localhost:3033"
echo " - Pasarela:     http://localhost:3034"
echo ""
echo "⚠️  ACTION REQUIRED: Copy the webhook secret from 'stripe listen' into pasarela-de-pago/.env.local"
echo "⚠️  Restart your Next.js servers to pick up the new .env.local changes!"
