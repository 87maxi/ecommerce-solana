# Motor de Fixtures Nativo para Solana (Agnóstico)

Este documento detalla la arquitectura, los cambios implementados y las dependencias necesarias para el nuevo sistema de importación de datos de prueba (Fixtures) en la red local de Solana. 

El objetivo principal de este sistema es ser **completamente agnóstico y resiliente a las versiones de Anchor**. Tras enfrentar múltiples errores de compatibilidad con la generación y lectura de IDLs (`Cannot read properties of undefined (reading 'size')`, errores de `proc_macro2`, y `build-bpf`), se diseñó un motor que interactúa con la blockchain de la forma más pura y estándar posible: utilizando serialización cruda y constructores de transacciones nativos.

---

## 1. Cambios en el Programa Anchor (`lib.rs`)

Para que el fixture tuviera un propósito práctico y reflejara la lógica del e-commerce, se añadieron las siguientes funcionalidades al programa inteligente en Rust:

### Nuevas Cuentas (State)
*   **`Company`**: Almacena la información de una empresa (`owner`, `name`, `description`, `is_active`).
*   **`Product`**: Almacena la información de un producto asociado a una empresa (`company`, `name`, `price`, `stock`).

### Nuevas Instrucciones
*   **`register_company`**: Inicializa un PDA para una empresa basado en la clave pública del creador (`owner`).
*   **`add_product`**: Inicializa un PDA para un producto utilizando la clave de la empresa y el nombre del producto como semillas.

Estas instrucciones permitieron probar la resolución dinámica de PDAs desde el frontend/script.

---

## 2. Dependencias del Sistema

El motor de fixtures (`fixture-engine.ts`) fue reescrito para eliminar la dependencia conflictiva del cliente Typescript de Anchor (`@coral-xyz/anchor`). Ahora utiliza dependencias estándar:

*   **`@solana/web3.js`**: Para la conexión a la red (RPC), manejo de Keypairs, resolución de PDAs y envío de transacciones crudas (`TransactionInstruction`).
*   **`js-sha256`**: Necesario para calcular manualmente los **discriminadores** de 8 bytes que Anchor exige al inicio de cada instrucción.
*   **`ts-node` & `typescript`**: Para ejecutar el motor sin necesidad de compilación previa, utilizando el flag `--transpile-only` para máxima velocidad.

---

## 3. Gestión de Archivos JSON (Fixtures)

Los datos de prueba se desacoplaron del código y se alojaron en archivos JSON (ej. `fixture/ecommerce_data.json`). El formato fue diseñado para permitir "metaprogramación" y resolución dinámica:

### Estructura del JSON
```json
{
  "programId": "4ourUpEhfq64WVb1gRwR7fxkWbKZnMPmbx6D6dFwvGCq",
  "steps": [
    {
      "description": "Registrar Empresa de Electrónica",
      "instruction": "register_company",
      "args": ["TechStore", "Venta de hardware"],
      "accounts": {
        "company": { "pda": ["company", "@wallet"] },
        "owner": "@wallet",
        "system_program": "11111111111111111111111111111111"
      }
    }
  ]
}
```

### Funcionalidades del Formato
1.  **`programId` Dinámico**: El archivo especifica el ID del programa objetivo. El script `deploy.sh` fue actualizado para que, cada vez que se despliega el contrato, **inyecte automáticamente el nuevo `Program ID`** en este JSON.
2.  **Referencias de Contexto (`@`)**: El token `@wallet` se reemplaza en tiempo de ejecución por la clave pública del usuario que ejecuta el script.
3.  **Generación de PDAs on-the-fly**: El objeto `{ "pda": ["semilla1", "semilla2"] }` le dice al motor que calcule la dirección derivada del programa antes de enviar la transacción.
4.  **Caché de Pasos Anteriores**: Si en el paso 1 se resuelve la cuenta `"company"`, en el paso 2 se puede usar la referencia `@company_pda` para apuntar a ella.

---

## 4. Funcionalidades del Motor de Fixtures (`fixture-engine.ts`)

El script TypeScript actúa como un "compilador en tiempo de ejecución" que traduce el JSON en transacciones binarias de Solana:

### A. Autoconfiguración
No requiere variables de entorno explícitas. El motor ejecuta el comando de sistema `solana config get` para averiguar a qué clúster RPC apuntar y qué Keypair usar para pagar las transacciones.

### B. Cálculo de Discriminadores (Estilo Anchor)
Anchor identifica qué función de Rust ejecutar leyendo los primeros 8 bytes de los datos de la transacción. El motor calcula esto replicando el comportamiento interno de Anchor:
```typescript
const hash = createHash("sha256");
hash.update(`global:${instructionNameSnakeCase}`);
const discriminator = hash.digest().slice(0, 8);
```

### C. Serialización Manual Borsh (Bulletproof)
Para evitar los errores de `InstructionDidNotDeserialize` causados por librerías de terceros o longitudes de strings UTF-8 mal calculadas, el motor empaqueta los bytes manualmente:
*   **Strings**: Escribe un `u32` (Little Endian) indicando la longitud en *bytes* (no caracteres) del string, seguido del buffer UTF-8.
*   **Enteros (u64)**: Convierte los números grandes en `BigInt` y los escribe en un buffer de 8 bytes (Little Endian).

### D. Construcción de Transacciones Nativas
El motor itera sobre las cuentas definidas en el JSON, infiere quién debe firmar (`isSigner`) y qué cuentas son mutables (`isWritable`) basándose en convenciones estándar, junta el discriminador con los argumentos serializados, y envía la `TransactionInstruction` directamente vía `@solana/web3.js`.

---

## 5. Script de Ejecución (`run_fixture.sh`)

Para mantener la simplicidad de uso, se creó un wrapper en Bash. Su función es:
1. Asegurar que las dependencias de Node (`npm install`) estén presentes.
2. Obtener la ruta absoluta del archivo JSON de fixtures.
3. Ejecutar el motor usando `npx ts-node --transpile-only`.
4. (Opcional) Aceptar un `Program ID` como parámetro por terminal para sobrescribir temporalmente el que está en el JSON.

**Uso general:**
```bash
./run_fixture.sh fixture/ecommerce_data.json
```
