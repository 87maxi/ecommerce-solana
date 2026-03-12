# Environment Variables Configuration

## web-customer/.env.local

```env
# Pasarela de Pago URL (puerto 3034)
NEXT_PUBLIC_PASARELA_PAGO_URL=http://localhost:3034

# Ecommerce Contract Address
NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS=0x5fc8d32690cc91d4c39d9d3abcbd16989f875707

# Expected Chain ID (31337 for local Anvil)
NEXT_PUBLIC_EXPECTED_CHAIN_ID=31337
```

## pasarela-de-pago/.env

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Service URLs
COMPRA_STABLECOIN_URL=http://localhost:3033
NEXT_PUBLIC_WEB_CUSTOMER_URL=http://localhost:3031
```

## compra-stablecoin/.env

```env
# EuroToken Contract Address
NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS=0x...

# Owner/Minter Private Key (wallet that can mint tokens)
OWNER_PRIVATE_KEY=0x...
PRIVATE_KEY=0x...

# Blockchain RPC URL
RPC_URL=http://127.0.0.1:8545

# Expected Chain ID
NEXT_PUBLIC_EXPECTED_CHAIN_ID=31337
```

## How to Get Stripe Keys

1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy your **Publishable key** → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
3. Copy your **Secret key** → `STRIPE_SECRET_KEY`
4. For webhook secret:
   - Install Stripe CLI: `brew install stripe/stripe-cli/stripe` (Mac) or download from https://stripe.com/docs/stripe-cli
   - Run: `stripe listen --forward-to localhost:3034/api/webhook`
   - Copy the webhook signing secret → `STRIPE_WEBHOOK_SECRET`

## Testing the Flow

1. Start all three services:
   ```bash
   # Terminal 1 - web-customer
   cd web-customer && npm run dev
   
   # Terminal 2 - pasarela-de-pago
   cd stablecoin/pasarela-de-pago && npm run dev
   
   # Terminal 3 - compra-stablecoin
   cd stablecoin/compra-stablecoin && npm run dev
   
   # Terminal 4 - Stripe webhook listener
   stripe listen --forward-to localhost:3034/api/webhook
   
   # Terminal 5 - Local blockchain (Anvil)
   anvil
   ```

2. Open http://localhost:3031/buy-eurocoins
3. Connect MetaMask
4. Select amount
5. Pay with test card: `4242 4242 4242 4242` (any future date, any CVC)
6. Verify tokens in MetaMask
