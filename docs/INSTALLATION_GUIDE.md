# Guía Detallada de Instalación y Configuración

Este documento proporciona instrucciones paso a paso para configurar el entorno de desarrollo y desplegar el ecosistema completo de E-commerce en Solana.

---

## 📋 Prerrequisitos del Sistema

Antes de comenzar, asegúrate de tener instaladas las siguientes herramientas en tu sistema (preferiblemente Linux o macOS):

### 1. Entorno de Rust
Solana y Anchor dependen de Rust.
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustc --version
```

### 2. Solana CLI
Instala la suite de herramientas de Solana.
```bash
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
solana --version
```

### 3. Anchor Framework (AVM)
Anchor es el framework utilizado para el Smart Contract (Programa).
```bash
cargo install --sealed anchor-cli --version 0.30.1 # Versión recomendada
anchor --version
```

### 4. Node.js y Gestión de Paquetes
Recomendado Node.js v18.x o superior.
```bash
node --version
npm --version
```

### 5. Surfpool (Opcional pero recomendado)
Utilizado para la gestión de la red local de pruebas.
```bash
# Sigue las instrucciones de instalación de Surfpool si no lo tienes
surfpool --version
```

---

## 🚀 Proceso de Instalación

### Paso 1: Clonar el Repositorio
```bash
git clone <url-del-repositorio>
cd ecommerce-solana
```

### Paso 2: Preparar la Red Local
En una terminal independiente, inicia el validador local de Solana. Esto actuará como tu blockchain privada de pruebas.
```bash
# Opción A: Usando Surfpool
surfpool

# Opción B: Usando el validador estándar de Solana
solana-test-validator
```

### Paso 3: Configuración y Despliegue del Programa Anchor
Regresa a la terminal principal en la raíz del proyecto. El script `deploy.sh` es una herramienta de automatización que realiza lo siguiente:
1. Compila el programa Rust.
2. Genera un nuevo Program ID si es necesario.
3. Despliega el código en la red local.
4. Extrae el IDL (interfaz) y lo distribuye a las aplicaciones frontend.
5. Crea los archivos `.env.local` con las direcciones correctas.

Ejecuta el script:
```bash
/bin/bash deploy.sh
```

### Paso 4: Instalación de Dependencias de Frontend
El proyecto utiliza una arquitectura de micro-frontends. Debes instalar las dependencias en cada subdirectorio. Puedes usar este comando rápido:

```bash
for dir in web-admin web-customer solana-stablecoin/compra-stablecoin solana-stablecoin/pasarela-de-pago; do
  echo "📦 Instalando en $dir..."
  (cd "$dir" && npm install --legacy-peer-deps)
done
```

---

## ⚙️ Configuración de Variables de Entorno

Aunque el script `deploy.sh` genera la mayoría de las variables, asegúrate de revisar los siguientes archivos si necesitas personalización:

### `solana-stablecoin/compra-stablecoin/.env.local`
Necesitas configurar tus claves de Stripe para el funcionamiento de la pasarela:
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Tu clave pública de Stripe.
- `STRIPE_SECRET_KEY`: Tu clave secreta de Stripe.
- `NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS`: (Generado automáticamente por el script).

### `solana-stablecoin/pasarela-de-pago/.env.local`
- `OWNER_PRIVATE_KEY`: La clave privada que tiene autoridad para mintear EURT (el script inyecta la de tu validador local).

---

## 🛠️ Ejecución del Ecosistema

Para iniciar todos los servicios simultáneamente, abre terminales separadas para cada uno:

1. **Tienda (Customer):**
   ```bash
   cd web-customer && npm run dev
   # Acceso: http://localhost:3030
   ```
2. **Administración (Admin):**
   ```bash
   cd web-admin && npm run dev
   # Acceso: http://localhost:3032
   ```
3. **Compra de Tokens (Stripe):**
   ```bash
   cd solana-stablecoin/compra-stablecoin && npm run dev
   # Acceso: http://localhost:3033
   ```
4. **Pasarela de Pago:**
   ```bash
   cd solana-stablecoin/pasarela-de-pago && npm run dev
   # Acceso: http://localhost:3034
   ```

---

## 🔍 Solución de Problemas Comunes

### 1. Error "Non-base58 character"
Este error ocurre si una dirección de Solana en el archivo `.env.local` tiene espacios o caracteres inválidos. 
- **Solución:** Revisa que `NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS` no tenga espacios al final. El sistema ahora incluye validación automática, pero verifica el log `[VALIDATION]` en la consola del navegador.

### 2. Error de CORS en la Pasarela de Pago
Si el fetch a `verify-minting` falla:
- **Solución:** Asegúrate de que `pasarela-de-pago` esté corriendo. Hemos añadido cabeceras CORS en los endpoints, pero ambos servicios (puerto 3033 y 3034) deben estar activos.

### 3. Problemas con la Billetera (Phantom/Backpack)
Si la billetera no se conecta o no firma:
- **Solución:** Asegúrate de que tu extensión de billetera esté configurada en modo "Localhost" o "Custom RPC" apuntando a `http://localhost:8899`.

---

## 🔗 Enlaces Relacionados
- [Regresar al README Principal](../README.md)
- [Informe de Migración ETH a SOL](./migracion-ethereum-a-solana.md)
- [Log de Errores Críticos](./FIX_LOG_STABLECOIN_ERRORS.md)