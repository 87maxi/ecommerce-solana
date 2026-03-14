# Registro de Correcciones Críticas - E-Commerce Solana

Este documento detalla los errores más relevantes encontrados y corregidos durante la fase de estabilización de las aplicaciones web y la integración con los programas de Solana.

## 1. Bucles Infinitos de Renderizado (web-admin & web-customer)

- **Error**: El objeto `signer` (que envuelve la `publicKey`) se recreaba como una nueva instancia en cada ciclo de renderizado. Este objeto se pasaba como dependencia a hooks de contrato y efectos de carga de datos.
- **Efecto**: Error "Maximum update depth exceeded" en la consola. El navegador (especialmente Brave) se bloqueaba o "frizaba" debido a la saturación del hilo principal por miles de actualizaciones por segundo.
- **Solución**: Se implementó `useMemo` para estabilizar el `signer` utilizando `publicKey?.toBase58()` (un string estable) como dependencia. Además, se envolvieron las funciones del contrato en `useCallback`.

## 2. Fallos de Hidratación (Hydration Mismatch)

- **Error**: Se intentaba renderizar información dependiente de la billetera (balances, estados de conexión, contadores del carrito) durante el renderizado en el servidor (SSR). En el servidor, la wallet siempre es nula, mientras que en el cliente puede estar conectada.
- **Efecto**: Error "Hydration failed because the server rendered HTML didn't match the client". Los componentes se regeneraban bruscamente en el cliente, causando parpadeos o fallos en la interactividad.
- **Solución**: Se creó e implementó el hook `useIsMounted`. Ahora, cualquier contenido que dependa del estado del navegador o de la wallet solo se renderiza una vez que el componente se ha montado formalmente en el cliente.

## 3. Errores de Sintaxis y Parsing (web-customer/src/hooks/useContract.ts)

- **Error**: Presencia de arrays de dependencias mal colocados al final de funciones asíncronas internas y desajustes en el anidamiento de llaves/paréntesis.
- **Efecto**: Error crítico de compilación: "Parsing ecmascript source code failed". La aplicación no lograba iniciar o se rompía al intentar cargar el catálogo de productos.
- **Solución**: Se realizó una re-escritura total del archivo `useContract.ts`, limpiando la estructura de los hooks y asegurando el cumplimiento estricto de las reglas de React (Rules of Hooks).

## 4. Claves Duplicadas en el Árbol de React (web-admin)

- **Error**: La importación de estilos de la librería de wallets de Solana en múltiples niveles provocaba que componentes como el modal de conexión generaran hijos con la misma clave (ej: `MetaMask`).
- **Efecto**: Advertencia "Encountered two children with the same key" y comportamiento inconsistente en la lista de selección de billeteras.
- **Solución**: Se centralizó la importación de estilos CSS de `@solana/wallet-adapter-react-ui` exclusivamente en el `layout.tsx` raíz, eliminando duplicados en proveedores y barras laterales.

## 5. Módulo no encontrado (web-admin/src/app/customers/page.tsx)

- **Error**: Ruta de importación incorrecta para el hook `useWallet`. El archivo buscaba un hook personalizado inexistente en lugar de la librería oficial.
- **Efecto**: Error de compilación "Module not found" al intentar acceder a la sección de Gestión de Clientes.
- **Solución**: Se corrigió la importación para usar `@solana/wallet-adapter-react` y se adaptó el código para usar las propiedades correctas (`connected`, `publicKey`) de la API de Solana.

## 6. Bloqueo por Carga Infinita (Configuración)

- **Error**: Ausencia del archivo `.env` configurado con las direcciones reales de los programas desplegados en Surfpool/Localhost.
- **Efecto**: La aplicación se quedaba en estado de "Loading" permanente sin mostrar errores, ya que las llamadas a la blockchain fallaban silenciosamente por falta de dirección de destino.
- **Solución**: Se creó el archivo `.env` con el `NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS` correcto y se añadieron logs de diagnóstico en el flujo de inicialización para facilitar el rastreo de problemas de red.