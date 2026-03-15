# Motor de Fixtures: Arquitectura y Funcionamiento

El motor de fixtures de este proyecto está diseñado para inicializar y poblar la red local de Solana (Surfpool) con datos de prueba (empresas y productos) de forma rápida, determinista y **completamente agnóstica al framework Anchor**.

Esta documentación explica la lógica interna de los scripts `run_fixture.sh` y `fixture-engine.ts`, detallando cómo se construyen las transacciones a bajo nivel utilizando `@solana/web3.js` y serialización Borsh.

---

## 1. El Wrapper Agnóstico (`run_fixture.sh`)

El script bash `run_fixture.sh` es el punto de entrada para los desarrolladores. Su propósito es orquestar la ejecución del motor de TypeScript sin necesidad de compilar el contrato inteligente de Rust cada vez que se cambian los datos.

### Flujo de Ejecución:
1. **Resolución de Rutas:** Identifica la ubicación del archivo de datos JSON por defecto (`fixture/ecommerce_data.json`) o acepta uno proporcionado por el usuario. También permite sobrescribir el `Program ID` mediante argumentos.
2. **Entorno de Ejecución:** Navega al directorio del motor (`solana-stablecoin/solana`) e instala las dependencias de Node.js (`npm install`) si es la primera vez que se ejecuta.
3. **Ejecución Directa:** Llama a `ts-node --transpile-only` para ejecutar `fixture-engine.ts`. El flag `--transpile-only` es crucial porque ignora la validación estricta de tipos de TypeScript, acelerando enormemente el arranque del script.

---

## 2. El Motor de Metaprogramación (`fixture-engine.ts`)

El archivo `scripts/fixture-engine.ts` es el núcleo del sistema. A diferencia de los tests típicos de Anchor que dependen fuertemente de un IDL (Interface Description Language) generado automáticamente, este motor construye las transacciones "a mano". Esto lo hace inmune a problemas de versiones entre el CLI de Anchor y las librerías cliente de React.

### 2.1. Inicialización y Conexión
El script comienza leyendo la configuración local del desarrollador utilizando el comando `solana config get`.
Extrae la **URL del RPC** (usualmente `http://127.0.0.1:8899`) y la **ruta del Keypair** (`~/.config/solana/id.json`).
Con esta información, crea una conexión a la red y define el `payer` (la wallet que pagará las comisiones de transacción y firmará las instrucciones).

### 2.2. Procesamiento del Archivo JSON (El Fixture)
El motor lee el archivo JSON paso a paso. Cada "paso" (step) representa una instrucción que debe enviarse al contrato de Solana.

Un paso típico se ve así:
```json
{
  "instruction": "add_product",
  "args": ["Laptop Pro", 120000, 50],
  "accounts": {
    "product": { "pda": ["product", "@company_pda", "Laptop Pro"] },
    "company": "@company_pda",
    "owner": "@wallet",
    "system_program": "11111111111111111111111111111111"
  }
}
```

### 2.3. Resolución Dinámica de Cuentas (PDAs)
Antes de enviar una transacción, Solana necesita saber exactamente qué cuentas (addresses) van a ser leídas o modificadas. El motor interpreta el objeto `"accounts"` del JSON y resuelve cada clave:

1. **Cuentas Estáticas:** Si el valor es una cadena estática como `"1111...1111"`, la asigna al `SystemProgram`.
2. **Referencias al Contexto (`@`)**: El motor mantiene un diccionario (`context`) en memoria. Si encuentra `@wallet`, inyecta la clave pública del `payer`. Si encuentra `@company_pda`, inyecta la clave que se generó en un paso anterior.
3. **Derivación de PDAs (Program Derived Addresses):** Si encuentra un objeto `"pda": [...]`, calcula la dirección dinámicamente usando `PublicKey.findProgramAddressSync`.
   - Transforma prefijos de string a buffers (ej. `"product"`).
   - Detecta referencias al contexto (ej. `@company_pda`).
   - **Manejo Numérico:** Si una semilla es un número en formato string (ej. `"1"`), la serializa como un `u64` en formato *Little Endian* (8 bytes), que es el estándar que Anchor espera para identificadores secuenciales.

Una vez calculada, guarda la PDA en el `context` para que instrucciones futuras (como añadir un producto a esa empresa) puedan referenciarla.

### 2.4. Inferencia de Privilegios (isSigner, isWritable)
Al no tener un IDL que le diga qué cuentas son mutables o requieren firma, el motor utiliza **heurísticas basadas en convenciones de nombres** de Anchor:
- Cuentas llamadas `system_program` o que incluyen la palabra `program` se marcan como `isWritable: false` y `isSigner: false`.
- Cuentas llamadas `owner`, `payer`, `admin`, `authority`, `user` o `signer` se marcan forzosamente como `isSigner: true`.
- **Forzado Crítico:** Si la clave pública resuelta coincide con la del `payer` (la wallet local que ejecuta el script), el motor **siempre** la marca como firmante. Esto previene el error común `AccountNotSigner (0xbc2)`.

### 2.5. Serialización Manual (Borsh y Discriminadores)
Para que el contrato de Rust entienda la instrucción, los datos deben enviarse en un formato binario específico.

1. **Discriminador de Anchor:** Anchor requiere que los primeros 8 bytes del payload sean un hash SHA256 de la firma de la función. El motor lo calcula dinámicamente: `sha256("global:nombre_de_la_instruccion")[0..8]`.
2. **Serialización de Argumentos:** El motor implementa funciones manuales para empaquetar los datos según el estándar Borsh:
   - `serializeBorshString`: 4 bytes indicando la longitud en *bytes* (no en caracteres), seguidos del buffer UTF-8 del texto.
   - `serializeBorshU64`: 8 bytes en formato *Little Endian*.

Dependiendo del nombre de la instrucción (`initialize`, `register_company`, `add_product`), el motor empaqueta los argumentos del JSON en el orden estricto que el contrato espera.

### 2.6. Construcción y Envío Robusto de la Transacción
Finalmente, el motor concatena el discriminador y los argumentos, creando el `data` de la `TransactionInstruction`.

Para evitar errores de validación previa en simuladores RPC locales:
1. Crea una nueva `Transaction`.
2. Asigna el `feePayer` a la wallet local.
3. Obtiene un blockhash reciente (`getLatestBlockhash`).
4. **Firma explícitamente** la transacción (`transaction.sign(payer)`) antes de enviarla.
5. Utiliza `connection.sendRawTransaction` con `skipPreflight: true` y luego espera la confirmación manual.

#### Manejo de Errores Resiliente (Idempotencia)
Si una instrucción falla (por ejemplo, intentar crear una empresa que ya existe), el motor captura el error `SendTransactionError`.
Analiza los logs devueltos por el validador en busca de frases como `"already in use"` o `"already initialized"` (código de error `0x0`). Si detecta que el fallo se debe a que el dato ya existe en la blockchain, ignora el error e imprime una advertencia (`⚠️ Cuenta o registro ya existente`), permitiendo que el bucle continúe con el siguiente producto o empresa del fixture.