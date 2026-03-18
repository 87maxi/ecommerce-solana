# Retrospectiva Exhaustiva de Migración: Ethereum a Solana

Este documento detalla el análisis técnico commit por commit de la estabilización del ecosistema de E-commerce tras su migración de Ethereum (EVM) a Solana (SVM/Anchor).

## Introducción

La migración de un sistema de E-commerce de Ethereum a Solana no es solo un cambio de lenguaje (Solidity a Rust), sino una reestructuración total del modelo mental de persistencia. En Ethereum, los datos viven "dentro" del contrato. En Solana, el contrato es lógica pura que opera sobre "Cuentas" externas. Esta retrospectiva documenta los desafíos encontrados al intentar aplicar patrones EVM en una infraestructura SVM.

---

   **Lección**: La consistencia en el esquema de datos entre microservicios (Next.js API vs Frontend) es vital para la experiencia del usuario final en Web3.

---

## Referencias Técnicas para la Consistencia en Solana

Para lograr que el sistema sea consistente y funcional tras la migración, se implementaron los siguientes cambios técnicos críticos que garantizan la integridad de los datos entre la web y la blockchain:

---

### 1. Derivación Determinística de Cuentas (PDAs)
En Solana, las cuentas no se buscan por un índice en un array, sino que se derivan.
- **Cambio**: Se actualizaron las funciones `getCompany`, `updateProduct` y `toggleProductStatus` en `web-admin` para usar `PublicKey.findProgramAddressSync`.
- **Seeds utilizados**:
  - Empresa: `[Buffer.from("company"), company_id.toLeBytes(8)]`
  - Producto: `[Buffer.from("product"), product_id.toLeBytes(8)]`
- **Impacto**: Esto resolvió el error `Invalid public key input` al permitir que el sistema "encuentre" la cuenta correcta partiendo de un ID numérico secuencial.

### 2. Sincronización de Tipos de Datos (u64 vs BigNumber)
- **Problema**: Los IDs en el contrato de Solana son `u64` (64 bits, Little Endian), pero en JavaScript los números grandes pierden precisión o fallan al parsearse como direcciones.
- **Solución**: Implementación sistemática de `new BN(id)` para todos los parámetros numéricos y validación mediante RegEx (`/^\d+$/`) para evitar errores de "Invalid character" al procesar direcciones Base58.

### 3. Reactividad del Signer en el Provider de Anchor
- **Cambio**: Rediseño completo del hook `useContract` para que el objeto `program` sea reactivo. Si el usuario conecta su wallet, el `AnchorProvider` se reconstruye inmediatamente con el nuevo `signer`.
- **Impacto**: Eliminó el error de simulación que ocurría cuando el sistema intentaba "pagar" una transacción con la wallet pública por defecto en lugar de la wallet real del usuario.

### 4. Normalización de la Interfaz del Contrato (IDL/ABI)
- **Cambio**: Inclusión de la nueva instrucción `toggle_product_status` en el programa Rust y sincronización forzada del archivo `EcommerceABI.json` en los tres subproyectos (`web-admin`, `web-customer`, `pasarela`).
- **Importancia**: En Solana, si el IDL no coincide exactamente con el programa desplegado, las instrucciones fallarán silenciosamente o con errores de discriminador.

### 5. Resiliencia de Minting (Mecanismo de Auto-Sanación)
- **Cambio**: El endpoint `/api/verify-minting` de la pasarela de pago ahora valida la inconsistencia entre Stripe y Solana. Si el pago es exitoso pero no hay registro de minteo (por fallo de webhook), el sistema dispara `mintTokens` de forma automática.
- **Impacto**: Garantiza la consistencia final del sistema; el usuario siempre recibe sus EURT aunque falle la infraestructura de notificaciones de Stripe.

---

## Análisis Detallado por Commit

### 1. `9d3050cec` - feat(contract): add toggle_product_status and update IDLs
*   **Contexto**: Se detectó que el contrato original no permitía despublicar productos sin eliminarlos físicamente (lo cual es costoso en términos de gestión de PDAs).
*   **Cambios técnicos**:
    *   **Rust**: Implementación de la instrucción `toggle_product_status`.
    *   **Seguridad**: Se definió el contexto `UpdateProductStatus` con restricciones de `owner` para asegurar que solo el dueño de la empresa pueda modificar sus productos.
    *   **Sincronización**: Regeneración de IDLs y actualización manual de `EcommerceABI.json` en los subproyectos `web-admin` y `web-customer`.
*   **Lección**: Las operaciones administrativas en Solana requieren una definición explícita de "Cuentas" involucradas en el contexto (instrucción), a diferencia del acceso global a mappings en EVM.

### 2. `f6cb2f8cb` - fix(tooling): fix AddProduct args in fixture-tool and update data
*   **Contexto**: La herramienta nativa en Rust para cargar datos iniciales fallaba por una discrepancia entre la estructura del JSON y lo que esperaba el programa de Solana.
*   **Cambios técnicos**:
    *   Corrección del índice de argumentos en `fixture-tool/src/main.rs`.
    *   Inclusión del campo `description` que había quedado huérfano en la lógica de metaprogramación.
*   **Lección**: Las herramientas de CLI en Rust requieren una sincronización perfecta con los tipos definidos en el programa Anchor, especialmente al manejar strings de longitud dinámica.

### 3. `7e10eaca5` - refactor(web-admin): use Anchor .all() for fetching and improve role detection
*   **Contexto**: El uso de `getProgramAccounts` con filtros manuales de discriminadores estaba causando errores `Internal Error` en el RPC.
*   **Cambios técnicos**:
    *   Migración masiva de llamadas RPC al método `.all()` de Anchor.
    *   Refactorización del mapeo de datos para preservar tanto la **PDA** (dirección real) como el **ID numérico** (lógica secuencial).
*   **Lección**: El método `.all()` de Anchor es significativamente más robusto que las peticiones manuales al RPC, ya que gestiona automáticamente el offset de los discriminadores de cuenta.

### 4. `0d24dac05` - feat(web-admin): add Orders/Ventas page with IPFS local Kubo links
*   **Contexto**: Falta de visibilidad de las transacciones históricas y los recibos legales (PDF).
*   **Cambios técnicos**:
    *   Creación de la ruta `/orders`.
    *   Integración del gateway local de **Kubo (IPFS)**: `http://localhost:8080/ipfs/`.
    *   Implementación de lógica de filtrado por rol para que las empresas solo vean sus propias ventas.
*   **Lección**: La descentralización efectiva requiere integrar el almacenamiento de contenido (IPFS) con el estado de la cadena (Solana), usando el CID como puente.

### 5. `541350f23` - fix(web-admin): fix numeric ID filtering and customer page permissions
*   **Contexto**: Error crítico donde los productos "desaparecían" de la vista de inventario porque el frontend filtraba por dirección PDA en lugar de ID numérico.
*   **Cambios técnicos**:
    *   Ajuste en `useUserRole` para capturar `companyNumericId`.
    *   Actualización de los permisos en `RoleGuard` para permitir que los dueños de empresas vean los detalles de sus clientes.
*   **Lección**: El ruteo en web suele ser mejor con direcciones Base58 (PDAs), pero la lógica de negocio on-chain a menudo depende de identificadores numéricos eficientes (`u64`). Es necesario mantener ambos en el estado del frontend.

### 6. `e86d85122` - fix(web-customer): fix wallet init race condition and improve payment robustness
*   **Contexto**: Al conectar la wallet, la aplicación intentaba realizar transacciones usando una cuenta ficticia (`1111...`) en lugar de la wallet real del usuario (Phantom/Backpack), causando errores de saldo.
*   **Cambios técnicos**:
    *   Refactorización del hook `useContract` para ser totalmente reactivo al `signer`.
    *   Adición de verificaciones de seguridad antes de disparar `sendTransaction` para asegurar que el pagador coincide con el firmante actual.
*   **Lección**: En Solana, la gestión de proveedores (Providers) debe ser dinámica. No se puede instanciar el programa una sola vez al cargar la página si el usuario aún no ha conectado su wallet.

### 7. `dbe2659f4` - fix(pasarela): add self-healing minting logic for successful payments without webhooks
*   **Contexto**: En entornos locales, los webhooks de Stripe suelen fallar, dejando al usuario con el pago realizado pero sin tokens EURT en su wallet.
*   **Cambios técnicos**:
    *   Implementación de lógica de **Auto-Recuperación**: El endpoint de verificación ahora consulta a Stripe y, si el pago es exitoso pero no hay registro de minteo, dispara el proceso de `mintTokens` on-chain inmediatamente.
*   **Lección**: No se debe confiar ciegamente en las notificaciones asíncronas (webhooks) para procesos críticos. Un sistema resiliente debe ser capaz de reconciliar el estado mediante consultas directas a la fuente de verdad (Stripe API).

### 8. `b5aa42610` - fix(stablecoin): correct transaction hash property mapping in success page
*   **Contexto**: El enlace al explorador de Solana no funcionaba porque el frontend buscaba `transactionHash` y el backend devolvía `txHash`.
*   **Cambios técnicos**: Normalización del mapeo de propiedades en la página de éxito.
*   **Lección**: La consistencia en el esquema de datos entre microservicios (Next.js API vs Frontend) es vital para la experiencia del usuario final en Web3.

### 9. `1247e5f76` - fix(wallet): remove explicit wallet adapters to avoid duplicate keys warning
*   **Contexto**: Error visual y de consola indicando duplicidad de llaves (MetaMask) en el modal de selección de wallet.
*   **Cambios técnicos**: Refactorización de los proveedores de wallet para delegar en el "Solana Wallet Standard".
*   **Lección**: Minimizar la configuración manual de adaptadores mejora la compatibilidad y evita conflictos con extensiones que inyectan sus propios proveedores.

### 10. `[LATEST]` - feat(contract): allow global admin to manage all businesses
*   **Contexto**: Error `Unauthorized (6000)` cuando la wallet administradora intentaba gestionar productos de terceros.
*   **Cambios técnicos**:
    *   **Contrato**: Actualización de los contextos de Anchor para validar al firmante contra el dueño de la empresa O el administrador global definido en `GlobalState`.
    *   **Frontend**: Inclusión del PDA de `global-state` en todas las instrucciones de actualización.
*   **Lección**: En Solana, los permisos "SuperAdmin" deben ser codificados explícitamente en el contexto de la instrucción, pasando la cuenta de estado que contiene la autoridad global.

---

## Referencias Técnicas para la Consistencia en Solana

Para lograr que el sistema sea consistente y funcional tras la migración, se implementaron los siguientes cambios técnicos críticos que garantizan la integridad de los datos entre la web y la blockchain:

### 1. Derivación Determinística de Cuentas (PDAs)
En Solana, las cuentas no se buscan por un índice en un array, sino que se derivan.
- **Cambio**: Se actualizaron las funciones `getCompany`, `updateProduct` y `toggleProductStatus` en `web-admin` para usar `PublicKey.findProgramAddressSync`.
- **Seeds utilizados**:
  - Empresa: `[Buffer.from("company"), company_id.toLeBytes(8)]`
  - Producto: `[Buffer.from("product"), product_id.toLeBytes(8)]`
- **Impacto**: Esto resolvió el error `Invalid public key input` al permitir que el sistema "encuentre" la cuenta correcta partiendo de un ID numérico secuencial.

### 2. Sincronización de Tipos de Datos (u64 vs BigNumber)
- **Problema**: Los IDs en el contrato de Solana son `u64` (64 bits, Little Endian), pero en JavaScript los números grandes pierden precisión o fallan al parsearse como direcciones.
- **Solución**: Implementación sistemática de `new BN(id)` para todos los parámetros numéricos y validación mediante RegEx (`/^\d+$/`) para evitar errores de "Invalid character" al procesar direcciones Base58.

### 3. Reactividad del Signer en el Provider de Anchor
- **Cambio**: Rediseño completo del hook `useContract` para que el objeto `program` sea reactivo. Si el usuario conecta su wallet, el `AnchorProvider` se reconstruye inmediatamente con el nuevo `signer`.
- **Impacto**: Eliminó el error de simulación que ocurría cuando el sistema intentaba "pagar" una transacción con la wallet pública por defecto en lugar de la wallet real del usuario.

### 4. Normalización de la Interfaz del Contrato (IDL/ABI)
- **Cambio**: Inclusión de la nueva instrucción `toggle_product_status` en el programa Rust y sincronización forzada del archivo `EcommerceABI.json` en los tres subproyectos (`web-admin`, `web-customer`, `pasarela`).
- **Importancia**: En Solana, si el IDL no coincide exactamente con el programa desplegado, las instrucciones fallarán silenciosamente o con errores de discriminador.

### 5. Resiliencia de Minting (Mecanismo de Auto-Sanación)
- **Cambio**: El endpoint `/api/verify-minting` de la pasarela de pago ahora valida la inconsistencia entre Stripe y Solana. Si el pago es exitoso pero no hay registro de minteo (por fallo de webhook), el sistema dispara `mintTokens` de forma automática.
- **Impacto**: Garantiza la consistencia final del sistema; el usuario siempre recibe sus EURT aunque falle la infraestructura de notificaciones de Stripe.

### 6. Jerarquía de Permisos (Admin Overrides)
- **Problema**: El diseño original de Anchor restringía las modificaciones únicamente al `owner` directo de la cuenta, bloqueando al administrador global.
- **Solución**: Implementación de lógica de permisos dual en las macros `#[account]`: `constraint = company.owner == owner.key() || global_state.owner == owner.key()`.
- **Importancia**: Permite que el administrador mantenga la salud del ecosistema (desactivar productos fraudulentos, etc.) sin necesidad de poseer las llaves privadas de cada empresa.

### 7. Estandarización de Wallets (Wallet Standard)
- **Cambio**: Eliminación de adaptadores manuales por un array vacío `[]` en el `WalletProvider`.
- **Impacto**: Las wallets modernas se auto-detectan, eliminando errores de llaves duplicadas en React y garantizando compatibilidad futura con nuevas billeteras sin cambiar el código.

---

## Conclusiones de la Migración

1.  **Modelo de Cuentas**: Solana requiere una gestión proactiva de las PDAs. El paso de IDs secuenciales (Ethereum) a direcciones derivadas por semillas es el cambio más complejo pero el que ofrece mayor escalabilidad.
2.  **Reactividad de Wallet**: Las aplicaciones Solana deben ser construidas alrededor del estado de la wallet. El "lazy loading" del proveedor de Anchor es una necesidad, no una opción.
3.  **Resiliencia Off-chain**: Debido a la velocidad de Solana, los procesos off-chain (como la generación de PDFs o el minteo tras pago con tarjeta) deben tener mecanismos de respaldo manual o automático para no romper la experiencia de usuario.
4.  **IPFS Local**: El uso de Kubo simplifica el desarrollo pero requiere una configuración de gateways consistente en todos los hooks de la aplicación.

Este ecosistema ahora se encuentra en un estado estable, con ruteo correcto, seguridad de roles verificada y un flujo de pagos EURT capaz de auto-repararse ante fallos de infraestructura.
