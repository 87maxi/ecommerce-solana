# Compra de EuroToken (EURT) con Stripe

Aplicación web que permite a los usuarios comprar tokens **EuroToken (EURT)** con tarjeta de crédito a través de **Stripe**, y recibirlos directamente en su billetera **MetaMask**.

## Características

- ✅ Compra de EURT con tarjeta de crédito (Stripe)
- ✅ Conexión segura con MetaMask
- ✅ 1 EUR = 1 EURT (canje directo)
- ✅ Minteo automático de tokens tras pago exitoso
- ✅ Webhook de Stripe para procesar pagos
- ✅ Full-stack con Next.js App Router

## Tecnologías

- **Framework**: Next.js 15 + App Router
- **Frontend**: React 19 + TypeScript + Tailwind CSS
- **Pagos**: Stripe Elements + Webhooks
- **Blockchain**: Ethers.js + MetaMask + Anvil

## Configuración

1. Clona el repositorio
2. Crea un archivo `.env` basado en `.env.example`
3. Instala dependencias:

```bash
npm install
```

4. Inicia el servidor de desarrollo:

```bash
npm run dev
```

## Variables de Entorno

| Variable | Descripción |
|--------|-------------|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Clave pública de Stripe |
| `STRIPE_SECRET_KEY` | Clave secreta de Stripe |
| `STRIPE_WEBHOOK_SECRET` | Clave secreta del webhook |
| `NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS` | Dirección del contrato EURT |
| `OWNER_PRIVATE_KEY` | Clave privada del minter (⚠️ cuidado) |
| `NEXT_PUBLIC_SITE_URL` | URL del sitio (para webhooks) |

## Flujo de Pago

1. Usuario selecciona monto y conecta MetaMask
2. Frontend redirige a `pasarela-de-pago` con parámetros (amount, walletAddress, invoice, redirect)
3. `pasarela-de-pago` crea `PaymentIntent` en Stripe y procesa el pago
4. Webhook recibe `payment_intent.succeeded` en pasarela-de-pago
5. Servidor de pasarela-de-pago llama a API para mintear EURT al usuario
6. Redirección automática a URL de éxito

> **Nota Importante**: Esta aplicación es un **frontend** que recolecta información del usuario y redirige a `pasarela-de-pago` para el procesamiento real del pago. No contiene rutas API propias.

## Estructura del Proyecto

```
src/
├── app/
│   ├── components/
│   │   ├── AmountSelector.tsx      # Selector de cantidad de EURT
│   │   ├── EuroTokenPurchase.tsx   # Componente principal de compra
│   │   ├── MetaMaskConnect.tsx     # Conexión con MetaMask
│   │   ├── PaymentSummary.tsx      # Resumen de pago
│   │   └── PurchaseSteps.tsx       # Indicador de pasos
│   ├── success/
│   │   └── page.tsx                # Página de éxito (con redirección)
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── contracts/
│   └── abis/
│       └── EuroTokenABI.json       # ABI del contrato EuroToken
└── lib/
    └── EuroTokenABI.ts             # TypeScript types para el ABI
```

## Configuración Automatizada

Este proyecto forma parte de un sistema multi-aplicación. Para configurarlo correctamente:

1. **Desde la raíz del proyecto ecommerce**, ejecuta el script de deployment:
   ```bash
   cd /ruta/a/ecommerce
   ./deploy.sh
   ```

2. El script automáticamente:
   - Despliega los contratos inteligentes (Ecommerce y EuroToken)
   - Genera el archivo `.env` con todas las variables necesarias
   - Copia los ABIs de los contratos a las ubicaciones correctas
   - Configura todas las aplicaciones del ecosistema

3. Una vez completado, inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

## Integración con Pasarela de Pago

Esta aplicación está diseñada para interoperar con `stablecoin/pasarela-de-pago`, permitiendo:

- **Parámetros compatibles**: Soporte para `invoice` y `redirectUrl`
- **Flujo unificado**: Redirección tras pago exitoso a URLs personalizadas
- **Metadata compartida**: El campo `invoice` se propaga a través del sistema
- **Seguimiento**: El mismo `clientSecret` y parámetros se mantienen coherentes entre servicios

### Uso Combinado

1. `pasarela-de-pago` inicia el proceso con parámetros estructurados
2. `compra-stableboin` procesa el pago y mantiene la trazabilidad
3. Redirección automática al sitio original con resultados

Este enfoque permite una experiencia de pago seamless entre aplicaciones mientras se mantiene la seguridad y trazabilidad.