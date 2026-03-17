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

# --- 1. Build and Deploy Stablecoin Program ---
echo ""
echo "📦 Building and Deploying Stablecoin Program..."
cd "$ROOT/solana-stablecoin/solana"
anchor build

STABLECOIN_SO_PATH="$ROOT/solana-stablecoin/solana/target/deploy/solana.so"
STABLECOIN_KEYPAIR_PATH="$ROOT/solana-stablecoin/solana/target/deploy/solana-keypair.json"
STABLECOIN_PROGRAM_ADDRESS=$(solana-keygen pubkey "$STABLECOIN_KEYPAIR_PATH")
echo "📍 Stablecoin Program ID: $STABLECOIN_PROGRAM_ADDRESS"

solana program deploy \
    --url $RPC_URL \
    --keypair "$DEPLOYER_KEYPAIR" \
    --program-id "$STABLECOIN_KEYPAIR_PATH" \
    --commitment $COMMITMENT \
    "$STABLECOIN_SO_PATH"

# --- 1b. Build and Deploy Ecommerce Program ---
echo ""
echo "📦 Building and Deploying Ecommerce Program..."
cd "$ROOT/solana-ecommerce"
anchor build

# Obtenemos el Program ID de Ecommerce desde Anchor.toml o el keypair generado
ECOMMERCE_PROGRAM_ADDRESS="5vC8pVqZguD8NB4qrrULXkXoN5ebfdsZLitYLmqpJAQj"
echo "📍 Ecommerce Program ID: $ECOMMERCE_PROGRAM_ADDRESS"

# Desplegamos si es necesario
echo "🚀 Deploying Ecommerce Program binary to localnet..."
solana program deploy \
    --url $RPC_URL \
    --keypair "$DEPLOYER_KEYPAIR" \
    --program-id "$ROOT/solana-ecommerce/target/deploy/solana_ecommerce-keypair.json" \
    --commitment $COMMITMENT \
    "$ROOT/solana-ecommerce/target/deploy/solana_ecommerce.so"

IDL_JSON=$(cat "$ROOT/solana-stablecoin/solana/target/idl/solana.json")
ECOMMERCE_IDL_JSON=$(cat "$ROOT/solana-ecommerce/target/idl/solana_ecommerce.json")

# Inyectar el Program ID desplegado en el archivo de fixture
echo "⚙️  Injecting Program ID into fixture file..."
FIXTURE_FILE="$ROOT/fixture/ecommerce_data.json"
if [ -f "$FIXTURE_FILE" ]; then
    # Usar un archivo temporal para una edición segura con jq
    tmp_file=$(mktemp)
    jq --arg program_id "$ECOMMERCE_PROGRAM_ADDRESS" '.programId = $program_id' "$FIXTURE_FILE" > "$tmp_file" && mv "$tmp_file" "$FIXTURE_FILE"
    echo "✅ Fixture updated with Program ID: $ECOMMERCE_PROGRAM_ADDRESS"
else
    echo "⚠️  Warning: Fixture file not found, skipping Program ID injection."
fi

# --- 2. Initialize EURT Stablecoin ---
echo ""
echo "🪙 Initializing EURT Stablecoin..."
cd "$ROOT/solana-stablecoin/solana"
npx ts-node scripts/init_stablecoin.ts

if [ -f "mint_address.txt" ]; then
    EUROTOKEN_MINT_ADDRESS=$(cat mint_address.txt)
    echo "📍 EURT Mint Address: $EUROTOKEN_MINT_ADDRESS"
else
    echo "❌ Failed to find mint_address.txt"
    exit 1
fi

echo "Creating an account for the new EURT mint..."
spl-token create-account "$EUROTOKEN_MINT_ADDRESS" --url $RPC_URL --fee-payer "$DEPLOYER_KEYPAIR" || true
echo "✅ EURT token and account created via Smart Contract."

# --- 3. Configure Web-Customer (Port 3030) ---
echo ""
echo "⚙️  Configuring Web-Customer..."
cd "$ROOT/web-customer"
mkdir -p src/contracts/abis
echo "$ECOMMERCE_IDL_JSON" > src/contracts/abis/EcommerceABI.json

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
echo "$ECOMMERCE_IDL_JSON" > src/contracts/abis/EcommerceABI.json

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
NEXT_PUBLIC_STABLECOIN_PROGRAM_ADDRESS=$STABLECOIN_PROGRAM_ADDRESS
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
cp "$ROOT/solana-stablecoin/solana/target/idl/solana.json" ./src/lib/solana_idl.json

cat > .env.local << EOF
$STRIPE_PK
$STRIPE_SK
STRIPE_WEBHOOK_SECRET=whsec_f53ada13441cce710f702f6bd03babe1668d4f99a476c00d61aa6696563484f4
NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS=$EUROTOKEN_MINT_ADDRESS
NEXT_PUBLIC_STABLECOIN_PROGRAM_ADDRESS=$STABLECOIN_PROGRAM_ADDRESS
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
