# Quick Start Guide - EuroToken Purchase Flow

## 🚀 Start All Services

```bash
# Terminal 1 - Blockchain (Anvil)
anvil

# Terminal 2 - web-customer (puerto 3031)
cd web-customer
npm run dev

# Terminal 3 - pasarela-de-pago (puerto 3034)
cd stablecoin/pasarela-de-pago
npm run dev

# Terminal 4 - compra-stablecoin (puerto 3033)
cd stablecoin/compra-stablecoin
npm run dev

# Terminal 5 - Stripe Webhook Listener
stripe listen --forward-to localhost:3034/api/webhook
```

## 📋 Environment Variables Checklist

### web-customer/.env.local
- [ ] `NEXT_PUBLIC_PASARELA_PAGO_URL=http://localhost:3034`
- [ ] `NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS=0x...`
- [ ] `NEXT_PUBLIC_EXPECTED_CHAIN_ID=31337`

### pasarela-de-pago/.env
- [ ] `STRIPE_SECRET_KEY=sk_test_...`
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...`
- [ ] `STRIPE_WEBHOOK_SECRET=whsec_...` (from Stripe CLI)
- [ ] `COMPRA_STABLECOIN_URL=http://localhost:3033`
- [ ] `NEXT_PUBLIC_WEB_CUSTOMER_URL=http://localhost:3031`

### compra-stablecoin/.env
- [ ] `NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS=0x...`
- [ ] `OWNER_PRIVATE_KEY=0x...`
- [ ] `RPC_URL=http://127.0.0.1:8545`

## 🧪 Test Flow

1. Open http://localhost:3031/buy-eurocoins
2. Connect MetaMask (network: localhost:8545)
3. Select amount (e.g., 100 EUR)
4. Click "Proceder al Pago"
5. Pay with test card: `4242 4242 4242 4242`
6. Verify success page shows transaction hash
7. Check MetaMask for EURT tokens

## 🔍 Verify Each Step

### Step 1: MetaMask Connection
- ✅ Wallet address displayed
- ✅ "Conectado" status shown

### Step 2: Redirect to Pasarela
- ✅ URL contains: `amount`, `walletAddress`, `invoice`, `redirect`
- ✅ Payment form shows correct amount and wallet

### Step 3: Stripe Payment
- ✅ Payment Intent created (check Stripe CLI logs)
- ✅ Payment successful

### Step 4: Webhook Processing
- ✅ Webhook received (check Stripe CLI: `payment_intent.succeeded`)
- ✅ pasarela-de-pago logs: "Calling mint-tokens API"
- ✅ compra-stablecoin logs: "Tokens minted successfully"

### Step 5: Redirect to Success
- ✅ URL contains: `success=true`, `tokens`, `invoice`, `tx`
- ✅ Transaction hash displayed
- ✅ Amount shown correctly

### Step 6: Blockchain Verification
- ✅ Open MetaMask
- ✅ Add custom token: EURT contract address
- ✅ Balance shows correct amount

## 🐛 Troubleshooting

### MetaMask not connecting
- Install MetaMask extension
- Switch to localhost:8545 network
- Import an Anvil test account

### Payment fails
- Check Stripe keys are correct
- Verify Stripe CLI is running
- Use test card: 4242 4242 4242 4242

### Tokens not minted
- Check compra-stablecoin logs for errors
- Verify OWNER_PRIVATE_KEY has minting permissions
- Ensure Anvil is running
- Check contract address is correct

### Webhook not received
- Verify Stripe CLI is running
- Check STRIPE_WEBHOOK_SECRET matches CLI output
- Ensure pasarela-de-pago is on port 3034

## 📊 Architecture Overview

```
Usuario
  ↓
web-customer:3031 (/buy-eurocoins)
  ↓ [MetaMask + Amount]
pasarela-de-pago:3034 (Stripe Payment)
  ↓ [Webhook]
compra-stablecoin:3033 (/api/mint-tokens)
  ↓ [Blockchain]
Tokens EURT → Wallet
  ↓ [Redirect]
web-customer:3031 (/payment-success)
```

## 📝 Key Files Modified

- `web-customer/src/app/buy-eurocoins/page.tsx` - MetaMask + redirect
- `web-customer/src/components/MetaMaskConnect.tsx` - NEW
- `pasarela-de-pago/src/app/api/create-payment-intent/route.ts` - NEW
- `pasarela-de-pago/src/app/api/webhook/route.ts` - NEW
- `compra-stablecoin/src/app/api/mint-tokens/route.ts` - Modified

## 🎯 Success Criteria

- [ ] User can connect MetaMask
- [ ] User can select amount
- [ ] Payment processes successfully
- [ ] Tokens appear in MetaMask
- [ ] Transaction hash is visible
- [ ] All logs show success messages
