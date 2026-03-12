# API Endpoints Documentation

## Endpoints Activos

### 1. Create Payment Intent
**POST** `/api/create-payment-intent`

Crea un Stripe PaymentIntent e inicializa una orden para seguimiento.

**Request Body:**
```json
{
  "amount": number,
  "walletAddress": string,
  "invoice": string
}
```

**Response:**
```json
{
  "clientSecret": string,
  "paymentIntentId": string,
  "orderId": string
}
```

### 2. Get Balance
**GET** `/api/balance/{address}`

Retrieva el balance de tokens EURT para una dirección de wallet.

**Response:**
```json
{
  "address": string,
  "balance": string
}
```

### 3. Verify Minting
**GET** `/api/verify-minting?invoice={invoice}&wallet={wallet}`

Verifica si se mintearon tokens para una orden específica.

**Response:**
```json
{
  "minted": boolean,
  "status": string,
  "txHash": string,
  "amount": number,
  "wallet": string,
  "invoice": string,
  "timestamp": string
}
```

### 4. Stripe Webhook
**POST** `/api/webhook`

Maneja eventos de webhook de Stripe para confirmación de pago y dispara el minteo de tokens.

**Request Headers:**
- `stripe-signature`: Firma del webhook para verificación

**Response:**
```json
{
  "received": boolean,
  "success": boolean,
  "transactionHash": string,
  "message": string
}
```

## Endpoints Obsoletos

Los siguientes endpoints han sido marcados como obsoletos y deben eliminarse:

- `POST /api/eurt/create-order`
- `POST /api/eurt/execute-purchase`
- `GET /api/eurt/order/{orderId}`
- `GET /api/eurt/price`
- `GET /api/eurt/verify-transaction`
- `POST /api/process-payment`

> **Nota:** Esta documentación ha sido actualizada para reflejar el estado actual del sistema después del análisis de refactorización.