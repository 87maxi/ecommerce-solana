# Análisis del Proyecto stablecoin/sc

## Descripción General

El proyecto `stablecoin/sc` contiene la implementación del contrato inteligente para un token estable (EuroToken - EURT), diseñado para mantener una paridad 1:1 con el Euro. Este contrato permite la emisión (mint) y quema (burn) de tokens, así como la transferencia y verificación de saldos.


## Intruciones para inicializar el projecto 
1. crea siempre el directorio     sc-ecommerce, si no existe , este sera el workspace del projecto
2. inicializa el projecto con el comando npm init en el directorio sc-ecommerce
3. usa en todo momento el directorio sc-ecommerce como workspace para este desarrollo
4. usa siempre  las herramientas basadas en anvil y foundry
5. usa siempre las convenciones de desarrollo de solidity
6. tienes que hacer los procesos para mantener la coherencia en el desarrollo y el codigo
7. presta especial atencion en los imports del codigo,
10. ejecuta los comandos que sean necesarios
11. crea los archivos necesarios para este projecto, siguiendo los estandares de solidity




## Implementacion

   1. Implementar el contrato EuroToken
      -  Heredar de OpenZeppelin ERC20
      -  Configurar decimales en 6
      -  Implementar función mint con control de acceso
      -  Agregar eventos para auditoría

   2. Escribir tests
      -  Test de deploy
      -  Test de mint por owner
      -  Test de mint por no-owner (debe fallar)
      -  Test de transferencias entre cuentas

   3. Script de deploy
      -  Crear script DeployEuroToken.s.sol
      -  Deployar en red local (Anvil)
      -  Hacer mint inicial de 1,000,000 tokens








## Framework y Herramientas

- **Lenguaje:** Solidity (^0.8.13)
- **Framework:** Foundry
- **Estándar:** ERC-20 (utilizando OpenZeppelin)

El uso de Foundry permite realizar pruebas rápidas con manipulación de tiempo y estado mediante `vm.prank()` y `vm.startBroadcast()`, facilitando el desarrollo y testing.

## Estructura del Proyecto

```
stablecoin/sc
├── foundry.toml
├── script/
│   └── DeployEuroToken.s.sol
├── src/
│   └── EuroToken.sol
└── test/
    └── (no presente)
```

## Configuración

El archivo `foundry.toml` configura el proyecto con configuración estándar de Foundry:

```toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
```

## Contrato Principal: EuroToken.sol

### Imports

```solidity
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
```

El contrato hereda de:
- `ERC20` para funcionalidad básica de token (transferencias, balances)
- `Ownable` para controlar el acceso a funciones sensibles (mint, owner)

### Constructor

```solidity
constructor(address initialOwner) ERC20("EuroToken", "EURT") Ownable(initialOwner) {
  // Contract starts with 0 tokens - tokens are minted on demand when purchased
}
```

El contrato inicia con un suministro de 0 tokens. Los tokens se acuñan bajo demanda cuando los usuarios los compran mediante el frontend `compra-stableboin`.

### Decimales

```solidity
uint8 private _decimals = 6;

function decimals() public view virtual override returns (uint8) {
  return _decimals;
}
```

El token utiliza 6 decimales para precisión, permitiendo representar céntimos de euro (1 euro = 1,000,000 unidades base).

### Funciones Clave

#### `mint(address to, uint256 amount) public onlyOwner`

Permite al propietario del contrato acuñar nuevos tokens y asignarlos a una dirección.

**Parámetros:**
- `to`: Dirección destino para recibir los tokens
- `amount`: Cantidad de tokens a acuñar (en unidades base)

**Restricción:** Solo puede ser llamado por el propietario (`onlyOwner`).

#### `burn(uint256 amount) public`

Permite a cualquier titular de tokens quemar sus propios tokens, reduciendo el suministro total.

**Parámetros:**
- `amount`: Cantidad de tokens a quemar

**Nota:** Los usuarios pueden quemar sus propios tokens, pero no los de otros.

#### `burnFrom(address account, uint256 amount) public`

Permite quemar tokens de otra cuenta, consumiendo primero la provisión de gasto permitida.

```solidity
_spentAllowance(account, msg.sender, amount);
_burn(account, amount);
```

Esto utiliza el mecanismo estándar de `allowance` de ERC-20 para permitir que terceros quemen tokens previamente aprobados.

## Script de Despliegue

### DeployEuroToken.s.sol

Despliega el contrato `EuroToken` y muestra información de despliegue.

```solidity
function run() public {
  vm.startBroadcast();

  // Deploy EuroToken with deployer as initial owner
  euroToken = new EuroToken(msg.sender);

  console.log("EuroToken deployed at:", address(euroToken));
  console.log("Owner:", euroToken.owner());
  console.log("Total Supply:", euroToken.totalSupply());
  console.log("Name:", euroToken.name());
  console.log("Symbol:", euroToken.symbol());
  console.log("Decimals:", euroToken.decimals());

  vm.stopBroadcast();
}
```

El script establece al desplegador (`msg.sender`) como propietario inicial del contrato.

## Interacción con Otros Componentes

- El contrato es desplegado por `DeployEuroToken.s.sol` y su dirección será utilizada por:
  - `compra-stableboin` para mint de tokens tras pagos
  - `sc/` como medio de pago para compras
  - Pasarelas de pago para transferencias

## Consideraciones de Seguridad

- **Acceso controlado:** Uso de `Ownable` para restringir el mint a una cuenta autorizada
- **Sin pausa:** No incluye mecanismo de pausa en emergencias
- **Sin límites de mint:** El propietario puede acuñar cualquier cantidad
- **Sin verificación regulatoria:** No incluye requisitos KYC/AML

## Mejoras Potenciales

1. Implementar un módulo de pausa (Pausable)
2. Agregar límites de mint por periodo
3. Incluir mecanismos de autorización multicuenta
4. Extender con funciones de permit para transacciones sin gas
5. Agregar eventos personalizados para seguimiento de operaciones

Este contrato proporciona la base funcional para una stablecoin euro, siendo simple, seguro y compatible con estándares ERC-20.