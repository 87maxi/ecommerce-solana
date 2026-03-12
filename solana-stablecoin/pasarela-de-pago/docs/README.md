# Pasarela de Pago con Stripe

Este proyecto es una pasarela de pago integrada con **Stripe**, basada en la estructura técnica de la pasarela Web3, pero adaptada para pagos en **fiat**.

## Características

- Integración con Stripe Checkout
- Manejo de parámetros URL (`amount`, `invoice`, `redirect`)
- Redirección segura post-pago
- Frontend en Next.js 15 + React 19 + TypeScript
- Estilos con Tailwind CSS

## Variables de Entorno

Crear `.env` basado en `.env.example`:

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
TURSO_DATABASE_URL=...
turso_AUTH_TOKEN=...
```

## Scripts

```bash
# Desarrollo
npm run dev

# Producción
npm run build
npm start
```

## Flujo de Pago

1. Cliente visita: `/?amount=100&invoice=INV-001&redirect=https://tutienda.com/exito`
2. Se carga Stripe Checkout
3. Al pagar, se redirige a `/confirmation?payment_status=succeeded`
4. Redirección automática a la tienda tras 3 segundos

## Estructura

```
src/
├── app/
│   ├── components/PaymentForm.tsx
│   ├── confirmation/page.tsx
│   ├── api/create-payment-intent/route.ts
│   ├── layout.tsx
│   └── page.tsx
```