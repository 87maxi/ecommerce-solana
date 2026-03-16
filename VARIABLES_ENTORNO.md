# Guía de Variables de Entorno - E-Commerce Solana & EURT

Este documento detalla todas las variables de entorno utilizadas en las diferentes interfaces del proyecto para garantizar la correcta comunicación entre el frontend, los smart contracts de Solana y la pasarela de pagos.

## 1. Web Customer (Puerto 3030)
*Ubicación: `/web-customer/.env.local`*

Interfaz principal para los clientes donde pueden ver productos, gestionar el carrito y realizar compras.

| Variable | Descripción | Valor Típico |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_RPC_URL` | Endpoint principal del nodo Solana (Local o Devnet). | `http://127.0.0.1:8899` |
| `NEXT_PUBLIC_SOLANA_RPC_HOST` | Nombre alternativo para el endpoint RPC (Soportado por compatibilidad). | `http://127.0.0.1:8899` |
| `NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS` | Dirección del programa (Contract) de E-commerce. | (PDA del programa) |
| `NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS` | Dirección del Mint del token EURT. | `3BLCK7...` |
| `NEXT_PUBLIC_EUROTOKEN_MINT` | Alias para la dirección del Mint (usada en hooks y fallbacks). | `3BLCK7...` |
| `NEXT_PUBLIC_COMPRA_STABLECOIN_URL` | URL del servicio para adquirir tokens (Puerto 3033). | `http://localhost:3033` |
| `NEXT_PUBLIC_PASARELA_PAGO_URL` | URL de la pasarela de pagos con Stripe (Puerto 3034). | `http://localhost:3034` |
| `NEXT_PUBLIC_SITE_URL` | URL base de la propia interfaz customer. | `http://localhost:3030` |

> **Nota:** El script `deploy.sh` genera por defecto `NEXT_PUBLIC_COMPRAS_STABLEBOIN_URL` (con una errata). El código actual soporta tanto la versión correcta como la del script.

---

## 2. Web Admin (Puerto 3032)
*Ubicación: `/web-admin/.env.local`*

Panel de gestión para que el administrador cree productos y gestione el inventario.

| Variable | Descripción | Valor Típico |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_RPC_URL` | Endpoint del nodo Solana. | `http://127.0.0.1:8899` |
| `NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS` | Dirección del programa de E-commerce. | (Mismo que Customer) |
| `NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS` | Dirección del Mint del token EURT. | (Mismo que Customer) |

---

## 3. Compra-Stablecoin (Puerto 3033)
*Ubicación: `/solana-stablecoin/compra-stablecoin/.env.local`*

Servicio para que los usuarios compren EURT utilizando dinero fiat (tarjeta) mediante Stripe.

| Variable | Descripción | Valor Típico |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Clave pública de Stripe para el frontend. | `pk_test_...` |
| `STRIPE_SECRET_KEY` | Clave secreta de Stripe para el backend. | `sk_test_...` |
| `NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS` | Dirección del Mint del token EURT. | (Mismo que Customer) |
| `NEXT_PUBLIC_RPC_URL` | Endpoint del nodo Solana. | `http://127.0.0.1:8899` |
| `NEXT_PUBLIC_SITE_URL` | URL base de este servicio. | `http://localhost:3033` |

---

## 4. Pasarela-de-Pago (Puerto 3034)
*Ubicación: `/solana-stablecoin/pasarela-de-pago/.env.local`*

Pasarela que gestiona la transferencia on-chain de los tokens una vez confirmado el pago con Stripe.

| Variable | Descripción | Valor Típico |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Clave pública de Stripe. | `pk_test_...` |
| `STRIPE_SECRET_KEY` | Clave secreta de Stripe. | `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Secreto para validar eventos de Stripe. | `whsec_...` |
| `NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS` | Dirección del Mint del token EURT. | (Mismo que Customer) |
| `OWNER_PRIVATE_KEY` | Array de bytes de la clave privada que firma las transferencias. | `[12, 45, ...]` |
| `RPC_URL` | Endpoint del nodo Solana (Utilizado en el backend). | `http://127.0.0.1:8899` |

---

## Notas de Sincronización Importantes

1. **Doble Nombramiento RPC**: Para evitar errores de conexión, el sistema ahora busca tanto `NEXT_PUBLIC_RPC_URL` como `NEXT_PUBLIC_SOLANA_RPC_HOST`. Se recomienda definir ambas o al menos la primera.
2. **Mint de EURT**: Es fundamental que todas las aplicaciones compartan el mismo `NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS`. Si se vuelve a crear el token mediante el CLI de Solana, esta dirección debe actualizarse en todos los archivos `.env`.
3. **Persistencia**: Los archivos `.env.local` no se suben al repositorio. Si realizas un nuevo despliegue con `deploy.sh`, estos archivos se sobreescribirán con los nuevos valores generados por el script.