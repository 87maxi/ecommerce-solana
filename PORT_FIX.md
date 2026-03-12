# Resumen de Correcciones - Puerto 3030

## ✅ Cambios Realizados

### 1. Puerto Correcto
- web-customer: **puerto 3030** (corregido de 3031)
- pasarela-de-pago: **puerto 3034**
- compra-stablecoin: **puerto 3033**

### 2. Flujo Actualizado

```
1. web-customer (localhost:3030)
   → Click "Buy Eurocoins"
   
2. Redirige a pasarela-de-pago (localhost:3034)
   → Selecciona cantidad
   → Conecta MetaMask
   → Paga con Stripe
   
3. Vuelve a web-customer (localhost:3030/payment-success)
   → Confirmación
```

### 3. Variables de Entorno

**pasarela-de-pago/.env:**
```env
NEXT_PUBLIC_WEB_CUSTOMER_URL=http://localhost:3030
COMPRA_STABLECOIN_URL=http://localhost:3033
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## 🚀 Para Probar

```bash
# Terminal 1 - Blockchain
anvil

# Terminal 2 - web-customer (puerto 3030)
cd web-customer
npm run dev

# Terminal 3 - pasarela-de-pago (puerto 3034)
cd stablecoin/pasarela-de-pago
npm run dev

# Terminal 4 - compra-stablecoin (puerto 3033)
cd stablecoin/compra-stablecoin
npm run dev

# Terminal 5 - Stripe Webhook
stripe listen --forward-to localhost:3034/api/webhook
```

## 📝 Verificar

1. Abre **http://localhost:3030**
2. Click en **"Buy Eurocoins"** en el menú
3. Deberías ver en **localhost:3034**:
   - Campo "Cantidad (€)"
   - Botón "Conectar MetaMask"
4. Selecciona cantidad → Conecta MetaMask
5. Aparece formulario de Stripe
6. Completa pago → Vuelve a localhost:3030/payment-success
