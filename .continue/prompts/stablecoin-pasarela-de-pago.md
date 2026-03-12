# Análisis del Proyecto stablecoin/pasarela-de-pago





## Intruciones para inicializar el projecto 
1. crea siempre el directorio     stablecoin/pasarela-de-pago, si no existe , este sera el workspace del projecto
2. inicializa el projecto con el comando npm init en el directorio stablecoin/pasarela-de-pago
3. usa en todo momento el directorio stablecoin/pasarela-de-pago como workspace para este desarrollo
4. usa siempre  las herramientas basadas en nextjs, react, ethersjs
5. usa siempre las convenciones de desarrollo de typescript
6. tienes que hacer los procesos para mantener la coherencia en el desarrollo y el codigo
7. presta especial atencion en los imports del codigo,
10. ejecuta los comandos que sean necesarios
11. crea los archivos necesarios para este projecto, siguiendo los estandares de nextjs


## Descripción General

Esta aplicación funciona como una pasarela de pago descentralizada que permite a comerciantes recibir pagos en EuroToken de sus clientes. La pasarela maneja todo el flujo de pago, desde la conexión de la billetera hasta la confirmación de la transacción en blockchain.


## Características

-  Conexión con MetaMask para autenticación Web3
-  Interfaz de pago intuitiva y responsiva
-  Validación de dirección de cliente
-  Verificación de saldo antes de procesar pagos
-  Confirmación visual de transacciones
-  Redirección automática después del pago
-  Soporte para integración mediante URL parameters
-  Comunicación con ventana padre via postMessage



## Flujo de Pago

1. **Validación de Parámetros:** La aplicación verifica que todos los parámetros requeridos estén presentes
2. **Conexión de Billetera:** El usuario conecta su MetaMask
3. **Validación de Dirección:** Se verifica que la dirección conectada coincida con `address_customer`
4. **Verificación de Saldo:** Se comprueba que el cliente tenga suficiente EURT
5. **Confirmación de Detalles:** El usuario revisa los detalles del pago
6. **Firma de Transacción:** El usuario firma la transacción en MetaMask
7. **Procesamiento:** La transacción se envía a la blockchain
8. **Confirmación:** Se muestra el resultado con el hash de transacción
9. **Redirección:** agregar este parametro en el .env.example, para luego configurar la redireccion


## Framework y Tecnologías

- **Framework:** Next.js 15.5.4 con App Router
- **Frontend:** React 19.1.0 + TypeScript
- **Estilos:** Tailwind CSS 4
- **Blockchain:** Ethers.js 6.15.0
- **Empaquetado:** Turbopack (para desarrollo)

La aplicación está optimizada para desarrollo rápido con hot-reload y es un ejemplo de dApp (aplicación descentralizada) para pagos con cripto.

## Estructura del Proyecto

```
pasarela-de-pago/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── PaymentGateway.tsx
│   │   │   └── PaymentGatewayDirect.tsx
│   │   ├── api/
│   │   │   └── process-payment/
│   │   │       └── route.ts
│   │   ├── test/
│   │   │   └── page.tsx
│   │   ├── page.tsx
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   └── favicon.ico
│   └── types/
│       └── ethereum.d.ts
├── public/
├── next.config.ts
├── tsconfig.json
├── tailwind.config.js
└── package.json
```

# Pasarela de Pago EuroToken

Una pasarela de pago Web3 construida con Next.js el projecto esta stablecoin/pasarela-de-pago este es el workspace que permite realizar pagos con el token EuroToken (EURT) en Ethereum utilizando MetaMask.

## Descripción

Esta aplicación funciona como una pasarela de pago descentralizada que permite a comerciantes recibir pagos en EuroToken de sus clientes. La pasarela maneja todo el flujo de pago, desde la conexión de la billetera hasta la confirmación de la transacción en blockchain.

## Características

- ✅ Conexión con MetaMask para autenticación Web3
- ✅ Interfaz de pago intuitiva y responsiva
- ✅ Validación de dirección de cliente
- ✅ Verificación de saldo antes de procesar pagos
- ✅ Confirmación visual de transacciones
- ✅ Redirección automática después del pago
- ✅ Soporte para integración mediante URL parameters
- ✅ Comunicación con ventana padre via postMessage


El servidor de desarrollo estará disponible en [http://localhost:3000](http://localhost:3000).

## Configuración

### Contrato EuroToken

El contrato EuroToken está configurado en [src/app/components/PaymentGateway.tsx:31](src/app/components/PaymentGateway.tsx#L31):

```typescript
const EUROTOKEN_CONTRACT_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
```



## Uso

### Parámetros URL Requeridos

La pasarela requiere los siguientes parámetros en la URL:

| Parámetro | Tipo | Descripción | Requerido |
|-----------|------|-------------|-----------|
| `merchant_address` | string | Dirección Ethereum del comerciante | ✅ |
| `address_customer` | string | Dirección Ethereum del cliente | ✅ |
| `amount` | string | Cantidad a pagar en EURT | ✅ |
| `invoice` | string | Número de factura o identificador | ✅ |
| `date` | string | Fecha de la transacción | ✅ |
| `redirect` | string | URL de retorno después del pago | ❌ |

### Ejemplo de URL

```
http://localhost:3000/?merchant_address=0x1234...&address_customer=0x5678...&amount=100.50&invoice=INV-001&date=2025-10-14&redirect=https://miapp.com/success
```



## Flujo de Pago

1. **Validación de Parámetros:** La aplicación verifica que todos los parámetros requeridos estén presentes
2. **Conexión de Billetera:** El usuario conecta su MetaMask
3. **Validación de Dirección:** Se verifica que la dirección conectada coincida con `address_customer`
4. **Verificación de Saldo:** Se comprueba que el cliente tenga suficiente EURT
5. **Confirmación de Detalles:** El usuario revisa los detalles del pago
6. **Firma de Transacción:** El usuario firma la transacción en MetaMask
7. **Procesamiento:** La transacción se envía a la blockchain
8. **Confirmación:** Se muestra el resultado con el hash de transacción
9. **Redirección:** (Opcional) Se redirige al usuario a la URL especificada


## API Endpoints

### POST /api/process-payment

Procesa la confirmación de un pago (endpoint de ejemplo para uso futuro).

**Request Body:**
```json
{
  "transactionHash": "0x...",
  "merchantAddress": "0x...",
  "customerAddress": "0x...",
  "amount": "100.50",
  "invoice": "INV-001",
  "date": "2025-10-14T12:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "transactionHash": "0x...",
  "paymentData": {
    "merchant_address": "0x...",
    "address_customer": "0x...",
    "amount": "100.50",
    "invoice": "INV-001",
    "date": "2025-10-14T12:00:00Z"
  },
  "processedAt": "2025-10-14T12:00:05Z",
  "status": "completed"
}
```

### GET /api/process-payment?transactionHash=0x...

Obtiene el estado de un pago por hash de transacción.

**Response:**
```json
{
  "transactionHash": "0x...",
  "status": "completed",
  "verifiedAt": "2025-10-14T12:00:05Z"
}
```




## Configuración

La pasarela se configura mediante variables de entorno y constantes en el código:
- `EUROTOKEN_CONTRACT_ADDRESS`: Dirección del contrato EuroToken
- `ECOMMERCE_CONTRACT_ADDRESS`: Dirección del contrato de comercio

Ambas direcciones deben actualizarse según la red de despliegue. La configuración utiliza la red local (anvil/hardhat) por defecto.

## Componente Principal: PaymentGateway.tsx

### Flujo de Pago

El componente gestiona todo el flujo de pago con 6 pasos principales:

1. **Validación de parámetros URL**
2. **Conexión con MetaMask**
3. **Validación de dirección de cliente**
4. **Verificación de saldo**
5. **Firma de transacción**
6. **Resultado y redirección**

### Parámetros URL Requeridos

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `merchant_address` | string | Dirección Ethereum del comerciante |
| `address_customer` | string | Dirección Ethereum del cliente |
| `amount` | string | Cantidad a pagar en EURT |
| `invoice` | string | Número de factura o identificador |
| `date` | string | Fecha de la transacción |
| `redirect` | string | URL de retorno (opcional) |

Ejemplo de URL:
```
http://localhost:3002/?merchant_address=0x1234...&address_customer=0x5678...&amount=100.50&invoice=INV-001&date=2025-10-14&redirect=https://miapp.com/success
```

El flujo incluye:
- Llamada al `approve` del contrato ERC-20
- Llamada al `processPayment` del contrato de comercio
- Redirección o envío de mensaje con resultado

## Componente Alternativo: PaymentGatewayDirect.tsx

Versión simplificada que solo muestra los parámetros recibidos, útil para pruebas y desarrollo.

## API Endpoint

### `api/process-payment/route.ts`

**POST /api/process-payment** - Procesa la confirmación de un pago

**Solicitud:**
```json
{
  "transactionHash": "0x...",
  "merchantAddress": "0x...",
  "customerAddress": "0x...",
  "amount": "100.50",
  "invoice": "INV-001",
  "date": "2025-10-14T12:00:00Z"
}
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "transactionHash": "0x...",
  "paymentData": {
    "merchant_address": "0x...",
    "address_customer": "0x...",
    "amount": "100.50",
    "invoice": "INV-001",
    "date": "2025-10-14T12:00:00Z"
  },
  "processedAt": "2025-10-14T12:00:05Z",
  "status": "completed"
}
```