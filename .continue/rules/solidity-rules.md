---
name: rules-solidity
description: smart contract solidity con foundry
invokable: true
---
# Reglas de uso de solidity



## Intruciones para inicializar el projecto 
1. inicia el projecto en el directorio stablecoin/sc, este sera el workspace del projecto
2. inicializa el projecto con el comando foundry en el directorio stablecoin/sc
3. usa en todo momento el directorio stablecoin/sc como workspace para este desarrollo
4. usa siempre  las herramientas basadas en foundry
5. usa siempre las convenciones de desarrollo de solidity
6. tienes que hacer los procesos para mantener la coherencia en el desarrollo y el codigo
7. presta especial atencion en los imports de los contratos, en esta version de solidity son de la siguiente manera 
9. tienes que tener en cuenata que la forma los **imports** , cambio, para versiones actuales de solidity.
10. ejecuta los comandos que sean necesarios
11. crea los archivos necesarios para este projecto, siguiendo los estandares de solidity


**esta es la referencia de como son los import**
```solidity
// incorrecto
import "forge-std/Test.sol";

// correcto
import {Test} from "forge-std/Test.sol";

//corecto 
import {Test, console} from "forge-std/Test.sol";

// corecto 
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";


```







## criterios a utilizar en el proyecto
  1. inisializa anvil y siempre usa anvil para las cuentas de la wallet, para los test
  2. siempre ten encuenta la forma mas eficiente de implementacion para optimizar gas
  3. el desarrollo al estar en modo de prueba usa foundry para las comprobasiones
  4. el licensiamiento va a ser siempre **SPDX-License-Identifier: MIT**
  5. tienes que tener en cuenata que la forma de importar, cambio, para versiones actuales de solidity.
  6. realiza test de **funcionalidad**
  7. realiza test de **seguridad exhaustivo**, Fuzzing Reentrancy
   
## reportes
 - crea una carpeta reportes, y todos los reportes que generes que sean en markdown
 - usa siempre el criterio de ser especifico y detallado en los reportes
 - genera reportes de uso de gas, por funcion y de todo de la ejecucion de todo el contrato 
 - genera los reportes bien formateados
 - describe la estructura del contrato en un uml
 - describe cada archivo generado y el contrato y las funcionalidades que fueron definidas 

 


## razonamiento de desarrollo e implementacion
 
  - siempre manten el criterio de que estas desarrollando y tienes que comprobar lo que realizas
  - usa siempre los criterios de desarrollo en solidity 0.8.19
  - usa el comando **forge test --force** para hscer test del projecto
  - Crea los test para el contrato definido enfocate en la funcionalidad 
  - crea test de seguridad Fuzzing Reentrancy
  - se muy exaustivo en la generacion de test tanto funcionales como de seguridad
  - no omitas los ningun tipo de advertencia/warning en los test
  - crea un script en bash deploy.sh que ejecute todos los test, ejecute reportes de consumo de gas y realice el deploy sobre anvil, chequea que todo funcione correctamente, y resulve cualquier tipo de inconsistencia que se provoque


  

### Anvil

```shell
$ anvil
```

### Deploy

```shell
$ forge script script/Counter.s.sol:CounterScript --rpc-url <your_rpc_url> --private-key <your_private_key>
```

### Cast

```shell
$ cast <subcommand>
```

### Help

```shell
$ forge --help
$ anvil --help
$ cast --help

