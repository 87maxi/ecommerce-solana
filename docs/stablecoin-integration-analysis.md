# Análisis de Integración entre @stablecoin/compra-stablecoin y @stablecoin/pasarela-de-pago

Este documento analiza la integración entre los dos proyectos principales del ecosistema stablecoin:

- `@stablecoin/compra-stablecoin`: Interfaz de usuario para que los usuarios compren EURT
- `@stablecoin/pasarela-de-pago`: Backend de pago que procesa transacciones y emite tokens

## Estructura de Proyectos

### @stablecoin/pasarela-de-pago

Este servicio actúa como el backend de pago centralizado que maneja:
- Creación de intenciones de pago con Stripe
- Verificación de transacciones
- Acuñación (minting) de tokens EURT
- Almacenamiento de órdenes
- Webhooks de Stripe

### @stablecoin/compra-stablecoin

Este servicio es la interfaz de usuario frontal que permite a los usuarios:
- Seleccionar cantidades a comprar
- Conectarse con MetaMask
- Navegar por un flujo de compra en pasos
- Redirigirse a la pasarela de pago

## Integración de Endpoints

### Endpoints Clave en @stablecoin/pasarela-de-pago

#### `POST /api/create-payment-intent`

**Descripción**: Crea una intención de pago en Stripe y almacena la orden en memoria.

**Request Body**:
```json
{
  "amount": 100,
  "walletAddress": "0x...
