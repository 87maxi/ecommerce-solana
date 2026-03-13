#!/usr/bin/env bash
set -euo pipefail

# --- Configuration ---
ROOT=$PWD
RPC_URL="http://127.0.0.1:8899"
DEPLOYER_KEYPAIR="$HOME/.config/solana/id.json"
COMMITMENT="confirmed"

# Decoded Stripe Keys for .env file generation
STRIPE_SK=$(echo "U1RSSVBFX1NFQ1JFVF9LRVk9c2tfdGVzdF81MVNXd2pJMk1JYkw0UG9GRk5pVDUyVDJzenZTU1pSa0xYbUcwODZvQjBwS0FxZkZsd2U0a3Fhc2loSmMwZFBOUkFMbFdrR2pmak90bkk2dWtXNWR6aTZoSTAwNktjSzFyQVMK" | base64 --decode)
STRIPE_PK=$(echo "TkVYVF9QVUJMSUNfU1RSSVBFX1BVQkxJU0hBQkxFX0tFWT1wa190ZXN0XzUxU1d3akkyTUliTDRQb0ZGR2haZHJEMjlEVElpWDFUSmRuM0hURndXV21ZNEVaZmtuY3lwZ253MG15dTN2Z2hvWVNGd1JuQlU4d2NFWHBlYkpUVW9sQmJvMDBGVEZ2VTVWawo=" | base64 --decode)

echo "============================================"
echo "🚀 Starting Full Solana E-Commerce Deployment (Localnet)"
echo "============================================"

# --- Pre-flight Checks ---
echo "Setting Solana CLI to use localnet RPC: $RPC_URL"
solana config set --url $RPC_URL

if [ ! -f "$DEPLOYER_KEYPAIR" ]; then
    echo "🔑 Generating local Solana keypair at $DEPLOYER_KEYPAIR..."
    solana-keygen new --no-bip39-passphrase --silent
fi

echo "💰 Requesting airdrop for deployer wallet..."
solana airdrop 10 --url $RPC_URL --commitment $COMMITMENT || true
echo "Deployer balance:"
solana balance --url $RPC_URL

# --- 1. Build and Deploy E-Commerce Anchor Program ---
echo ""
echo "📦 Building and Deploying E-Commerce Program..."
cd "$ROOT/solana-ecommerce"
anchor build

PROGRAM_SO_PATH="$ROOT/solana-ecommerce/target/deploy/solana_ecommerce.so"
PROGRAM_KEYPAIR_PATH="$ROOT/solana-ecommerce/target/deploy/solana_ecommerce-keypair.json"
ECOMMERCE_PROGRAM_ADDRESS=$(solana-keygen pubkey "$PROGRAM_KEYPAIR_PATH")
echo "📍 E-Commerce Program ID: $ECOMMERCE_PROGRAM_ADDRESS"

echo "Deploying program binary to localnet... (This may take a moment)"
solana program deploy \
    --url $RPC_URL \
    --keypair "$DEPLOYER_KEYPAIR" \
    --program-id "$PROGRAM_KEYPAIR_PATH" \
    --commitment $COMMITMENT \
    "$PROGRAM_SO_PATH"

if [ $? -eq 0 ]; then
    echo "✅ E-Commerce program deployed successfully."
else
    echo "❌ E-Commerce program deployment failed."
    exit 1
fi

IDL_JSON=$(cat target/idl/solana_ecommerce.json)

# --- 2. Create the EURT SPL Token Mint ---
echo ""
echo "🪙 Creating EURT SPL Token Mint..."
MINT_OUTPUT=$(spl-token create-token --decimals 6 --url $RPC_URL --fee-payer "$DEPLOYER_KEYPAIR")
EUROTOKEN_MINT_ADDRESS=$(echo "$MINT_OUTPUT" | awk '{print $3}')
echo "📍 EURT Mint Address: $EUROTOKEN_MINT_ADDRESS"

echo "Creating an account for the new EURT mint..."
spl-token create-account "$EUROTOKEN_MINT_ADDRESS" --url $RPC_URL --fee-payer "$DEPLOYER_KEYPAIR"
echo "✅ EURT token and account created."

# --- 3. Configure Web-Customer (Port 3030) ---
echo ""
echo "⚙️  Configuring Web-Customer..."
cd "$ROOT/web-customer"
mkdir -p src/contracts/abis
echo "$IDL_JSON" > src/contracts/abis/EcommerceABI.json

cat > .env.local << EOF
NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS=$ECOMMERCE_PROGRAM_ADDRESS
NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS=$EUROTOKEN_MINT_ADDRESS
NEXT_PUBLIC_RPC_URL=$RPC_URL
NEXT_PUBLIC_SITE_URL=http://localhost:3030
NEXT_PUBLIC_PASARELA_PAGO_URL=http://localhost:3034
NEXT_PUBLIC_COMPRAS_STABLEBOIN_URL=http://localhost:3034
EOF
echo "✅ Web-Customer configured"

# --- 4. Configure Web-Admin (Port 3032) ---
echo ""
echo "⚙️  Configuring Web-Admin..."
cd "$ROOT/web-admin"
mkdir -p src/contracts/abis
echo "$IDL_JSON" > src/contracts/abis/EcommerceABI.json

cat > .env.local << EOF
NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS=$ECOMMERCE_PROGRAM_ADDRESS
NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS=$EUROTOKEN_MINT_ADDRESS
NEXT_PUBLIC_RPC_URL=$RPC_URL
EOF
echo "✅ Web-Admin configured"

# --- 5. Configure Compra-Stablecoin (Port 3033) ---
echo ""
echo "⚙️  Configuring Compra-Stablecoin..."
cd "$ROOT/solana-stablecoin/compra-stablecoin"

cat > .env.local << EOF
$STRIPE_PK
$STRIPE_SK
NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS=$EUROTOKEN_MINT_ADDRESS
NEXT_PUBLIC_SITE_URL=http://localhost:3033
NEXT_PUBLIC_PASARELA_PAGO_URL=http://localhost:3034
NEXT_PUBLIC_RPC_URL=$RPC_URL
NODE_ENV=development
EOF
echo "✅ Compra-Stablecoin configured"

# --- 6. Configure Pasarela-de-Pago (Port 3034) ---
echo ""
echo "⚙️  Configuring Pasarela-de-Pago..."
cd "$ROOT/solana-stablecoin/pasarela-de-pago"

cat > .env.local << EOF
$STRIPE_PK
$STRIPE_SK
STRIPE_WEBHOOK_SECRET=whsec_f53ada13441cce710f702f6bd03babe1668d4f99a476c00d61aa6696563484f4
NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS=$EUROTOKEN_MINT_ADDRESS
OWNER_PRIVATE_KEY='$(cat "$DEPLOYER_KEYPAIR")'
RPC_URL=$RPC_URL
EOF
echo "✅ Pasarela-de-Pago configured"

# --- Final Summary ---
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
echo " - RPC URL: $RPC_URL (Localnet)"
echo ""
echo "Applications Configured:"
echo " - Web Customer: http://localhost:3030"
echo " - Web Admin:    http://localhost:3032"
echo " - Stablecoin:   http://localhost:3033"
echo " - Pasarela:     http://localhost:3034"
echo ""
echo "⚠️  ACTION REQUIRED: Copy the webhook secret from \'stripe listen --forward-to localhost:3034/api/webhook\' into the STRIPE_WEBHOOK_SECRET variable in the .env.local files for \'compra-stablecoin\' and \'pasarela-de-pago\'. You will get a new secret every time you run \'stripe listen\'."
echo "⚠️  Remember to restart your Next.js servers to apply the new .env.local changes!"
