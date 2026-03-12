# Análisis del Proyecto pasarela-de-pago

## Estado Actual de los Endpoints

### Endpoints Activos

1. **POST `/api/create-payment-intent`**
   - Crea un PaymentIntent de Stripe
   - Inicializa una orden para seguimiento
   - Respuesta contiene clientSecret, paymentIntentId y orderId

2. **GET `/api/balance/{address}`**
   - Obtiene el balance de tokens EURT para una dirección de wallet
   - Utiliza el contrato EuroToken para consultar el balance

3. **GET `/api/verify-minting`**
   - Verifica si se mintearon tokens para una orden específica
   - Requiere parámetros invoice y wallet
   - Retorna estado de minting, hash de transacción, monto, etc.

4. **POST `/api/webhook`**
   - Maneja eventos de webhook de Stripe
   - Verifica la firma del webhook
   - Confirma pagos y dispara el minteo de tokens

### Endpoints Obsoletos (a eliminar)

Los siguientes endpoints fueron identificados como obsoletos y deben eliminarse:

- `POST /api/eurt/create-order`
- `POST /api/eurt/execute-purchase`
- `GET /api/eurt/order/{orderId}`
- `GET /api/eurt/price`
- `GET /api/eurt/verify-transaction`
- `POST /api/process-payment`

## Código Obsoleto Detectado

### Directorios a eliminar:

- `/src/app/api/eurt/` - Contiene todos los endpoints obsoletos relacionados con EURT (Ya eliminado)
- `/src/app/api/process-payment/` - Endpoint deprecated para procesamiento de pagos (Ya eliminado)

### Archivos librería con funcionalidad parcialmente obsoleta:

- `src/lib/eurt.ts`: 
  - Contiene funciones `verifyTransfer` y `getTransactionDetails` que podrían ser útiles
  - La función `burnTokens` parece no estar siendo utilizada por los endpoints activos

- `src/lib/contracts.ts`:
  - Contiene funciones esenciales `mintTokens` y `getBalance` que son utilizadas por los endpoints activos
  - Esta funcionalidad debe mantenerse

- `src/lib/orderStorage.ts`:
  - Almacena órdenes en memoria
  - Necesita mejoras para producción (almacenamiento persistente)

## Análisis de Dependencias

Package.json muestra dependencias adecuadas para un proyecto Next.js con Stripe:

- **Principales dependencias**:
  - `@stripe/react-stripe-js` y `@stripe/stripe-js` para integración con Stripe
  - `ethers` para interacción con la blockchain
  - `next`, `react`, `react-dom` como base del framework
  - `stripe` para el backend de pagos

- **Dependencias de desarrollo**:
  - Configuración estándar de TypeScript y herramientas de desarrollo (eslint, prettier, tailwindcss)

No se identificaron dependencias obsoletas o innecesarias.

## Observaciones Técnicas

1. **Almacenamiento en memoria**: El sistema actual utiliza `Map` en `orderStorage.ts` para mantener las órdenes. Esto es adecuado para desarrollo pero no para producción, ya que las órdenes se perderán al reiniciar el servidor.

2. **Seguridad**: El sistema maneja correctamente la clave privada del owner para mintear tokens, pero debería considerar usar un servicio más seguro como AWS KMS o Hashicorp Vault en producción.

3. **Logging**: El código incluye buenos mensajes de log con timestamp, lo que facilita la depuración y monitoreo.

4. **Configuración**: Usa variables de entorno adecuadamente para configurar RPC_URL, direcciones de contratos y claves privadas.

## Recomendaciones Inmediatas

1. Eliminar todos los endpoints obsoletos del directorio `/src/app/api/eurt/` (VERIFICADO: No existen)
2. Eliminar el endpoint `/src/app/api/process-payment/` (VERIFICADO: No existente)
3. Verificar si la función `burnTokens` en `eurt.ts` es necesaria o puede eliminarse
4. Actualizar la documentación de API para reflejar solo los endpoints activos
5. Considerar la migración del storage de órdenes a una base de datos persistente para producción

Este análisis servirá como base para el plan de refactorización detallado.