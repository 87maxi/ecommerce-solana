# Guía Detallada: Surfpool & TXTX

Esta guía explica qué es Surfpool, cómo funciona el lenguaje TXTX y cómo implementarlos para el desarrollo profesional en Solana.

## 1. ¿Qué es Surfpool?

**Surfpool** es la evolución del simulador local para Solana. Mientras que `solana-test-validator` ofrece un entorno vacío, Surfpool permite crear un **"Surfnet"**: una red local que puede importar el estado de cualquier cuenta de la **Mainnet** de forma instantánea (Just-in-Time).

### Características Principales:
- **Estado de Mainnet Local:** Puedes interactuar con cuentas de Jito, Pyth, Raydium o cualquier protocolo sin tener que desplegarlos manualmente.
- **Cheatcodes:** Permite manipular el tiempo del reloj (`clock`), forzar balances de tokens y realizar acciones imposibles en una red real para facilitar el testing.
- **Explorador Integrado:** Surfpool incluye un inspector visual de transacciones y logs mucho más detallado que el de la CLI estándar.

---

## 2. ¿Qué es TXTX?

**TXTX** es un lenguaje declarativo (DSL) diseñado para describir infraestructura y transacciones on-chain. Es similar a Terraform, pero especializado en el flujo de ejecución de la blockchain.

### ¿Para qué sirve?
- **Runbooks:** Son archivos `.txtx` que definen una secuencia de transacciones. Son ideales para despliegues complejos donde una transacción depende del resultado de la anterior.
- **Transacciones Legibles:** Transforma hexadecimales y datos crudos en descripciones entendibles por humanos ("Human-readable transactions").
- **Automatización Ética:** Permite simular exactamente qué pasará antes de enviar una transacción a producción.

---

## 3. Instalación y Configuración

Para instalar Surfpool en Linux/macOS:

```bash
curl -sL https://run.surfpool.run/ | bash
```

### Comandos Esenciales:
- `surfpool start`: Inicia tu red local inteligente (Surfnet).
- `surfpool run <file.txtx>`: Ejecuta un Runbook de TXTX.
- `surfpool mcp`: Activa la integración con asistentes de IA (Model Context Protocol).
- `surfpool cloud`: Gestiona entornos persistentes en la nube.

## 4. Ejemplos de Comandos y Uso Práctico

### A. Gestión de la Red Local (Surfnet)
Inicia un validador local inteligente que puede importar cuentas de Mainnet bajo demanda:
```bash
# Iniciar con configuración por defecto (detecta proyectos Anchor)
surfpool start

# Iniciar forzando una red específica como fuente de datos (Mainnet o Devnet)
surfpool start --url https://api.mainnet-beta.solana.com
```

### B. Ejecución de Runbooks (IaC)
Despliega y configura tu infraestructura usando archivos TXTX:
```bash
# Ejecutar un runbook de despliegue
surfpool run deploy.txtx

# Ejecutar un runbook pasando variables personalizadas
surfpool run deploy.txtx --args cluster="localnet" admin_key="$(solana-keygen pubkey)"
```

### C. Cheatcodes (Manipulación del Estado)
Si estás usando `surfpool mcp` o interactuando con Surfnet, puedes usar "cheatcodes" para facilitar las pruebas:
- **Airdrop masivo:** No hay límites de airdrop en local.
- **Warp time:** Adelantar el reloj de la red para probar bloqueos o expiraciones.
- **Acceso a Mainnet:** Simplemente consulta una cuenta que no existe en tu local y Surfpool la traerá de Mainnet automáticamente.

### D. Integración con IA (MCP)
Habilita que bots (como Antigravity) puedan ver e interactuar con tu red local:
```bash
surfpool mcp
```

### E. Explorador e Inspector
Surfpool genera un link de explorador en cada ejecución para ver detalles profundos:
- Ver logs de instrucciones fallidas.
- Comparar el estado de las cuentas antes y después de cada instrucción.
- Visualizar el árbol de llamadas (CPI) de transacciones complejas.

### F. Comandos Avanzados y Utilidades

#### Gestión de Instantáneas (Snapshots)
Guarda o carga el estado exacto de una red para reproducir escenarios:
```bash
# Iniciar cargando un estado previo desde un archivo JSON
surfpool start --snapshot ./scenarios/hack_repro.json

# (Vía RPC) Exportar el estado actual a un archivo
# surfnet_exportSnapshot -> snapshot.json
```

#### Persistencia de Datos
Asegura que el estado de tu Surfnet local sobreviva a reinicios:
```bash
# Usar una base de datos local (SQLite) para persistencia
surfpool start --db sqlite://data/surfnet.db
```

#### Gestión de Cuentas (Clonado y Pinning)
Aunque no hay un comando `pin` directo en la CLI, se hace mediante **Runbooks de TXTX** usando acciones específicas de la SVM:
```hcl
# Fragmento de un archivo .txtx para clonar una cuenta de Mainnet
action "clone_oracle" "svm::clone_program_account" {
  address = "CH31n... (Pyth Oracle)"
  network = "mainnet"
}
```

#### Surfpool Cloud
Despliega tu infraestructura a un entorno gestionado en la nube:
```bash
# Autenticarse en el servicio cloud
surfpool cloud login

# Desplegar tu configuración local a la nube instantáneamente
surfpool cloud start
```

#### Utilidades de Desarrollador
```bash
# Listar todas las instancias de Surfnet activas en tu máquina
surfpool ls

# Generar scripts de autocompletar para tu terminal (bash/zsh/fish)
surfpool completions zsh > ~/.oh-my-zsh/completions/_surfpool
```

---

## 5. Casos de Uso Reales

### A. Simulación de Liquidez (DeFi)
Si estás desarrollando un bot de trading o una plataforma DeFi, puedes usar Surfpool para importar los pools de Raydium de Mainnet a tu local y probar tus transacciones contra liquidez real sin gastar SOL real.

### B. Despliegues Multi-Fase (IaC)
En lugar de scripts de Bash o JS complejos, usa un **Runbook de TXTX** para:
1. Desplegar tu programa de Anchor.
2. Inicializar el estado global.
3. Crear los mints de tokens necesarios.
4. Repartir tokens de prueba.
Todo en un solo flujo reproducible y versionable.

### C. Depuración de producción (Mainnet Forking)
Si una transacción falló en Mainnet, puedes configurar Surfpool para que "forkee" el bloque exacto del fallo, importar las cuentas involucradas y re-ejecutar la transacción localmente para inspeccionar los logs y encontrar el bug.

### D. Gobernanza y DAO
Simular votaciones o ejecuciones de Tesorería complejas que requieren múltiples pasos y validaciones de seguridad antes de proponerlas formalmente.

---

## 5. Integración con Proyectos Existentes

Surfpool es compatible con proyectos de **Anchor** por defecto. Al ejecutar `surfpool start` dentro de una carpeta de Anchor, el sistema detecta automáticamente tu programa e intenta generar la configuración necesaria para pruebas inteligentes.

### Ejemplo de Runbook básico (txtx):
```hcl
action "deploy_program" "svm::deploy_program" {
  program_id = "..."
  space = 500000
}

action "initialize" "svm::call_instruction" {
  program = action.deploy_program.address
  instruction = "initialize"
  accounts = {
    admin = signer.main
  }
}
```

---
> [!TIP]
> Usa `surfpool mcp` para que asistentes como Antigravity puedan interactuar directamente con tu red de Surfpool, inspeccionar cuentas y ayudarte a programar de forma más eficiente.
