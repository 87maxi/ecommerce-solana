# Análisis de Pruebas Fallidas - CompanyRegistryTest

## Resumen

El test `testGetAllCompanies()` está fallando con el error:

```
[FAIL: assertion failed: 1 != 2] testGetAllCompanies() (gas: 369299)
```

Los otros 8 tests están pasando correctamente.


## Análisis Detallado del Fallo

### Problema en testGetAllCompanies()

El test `testGetAllCompanies()` falla porque hay una discrepancia entre el número esperado de empresas y el obtenido:


- **Resultado esperado**: `assertEq(companies.length, 2)`
- **Resultado actual**: `companies.length` es 1, no 2

### Causa Raíz

Al analizar el test, encontramos que:

1. El test registra dos empresas con IDs 2 y 3 (como se ve en los eventos CompanyRegistered)
2. Sin embargo, `getAllCompanies()` retorna un array con elementos `[1, 2]`
3. La longitud del array es 2, pero hay un problema con la aserción

Observando el contrato `CompanyLib.sol`, vemos que `getAllCompanies()` tiene un bug en la lógica:

```solidity
function getAllCompanies(ProductStorage storage self) 
    external view returns (uint256[] memory) 
{
    uint256[] memory allProducts = new uint256[](self.nextProductId - 1);
    uint256 count = 0;
    for (uint256 i = 1; i < self.nextProductId; i++) {
        if (self.products[i].id != 0) {
            allProducts[count] = i;
            count++;
        }
    }
    
    uint256[] memory result = new uint256[](count);
    for (uint256 i = 0; i < count; i++) {
        result[i] = allProducts[i];
    }
    return result;
}
```

El problema es doble:

1. **Error de nombre**: La función está en `ProductStorage` pero debería estar en `CompanyStorage`
2. **Lógica incorrecta**: Está iterando sobre `products` en lugar de `companies` y usando `nextProductId` en lugar de `nextCompanyId`


### Solución Propuesta

1. Mover la función `getAllCompanies()` al `CompanyStorage`
2. Corregir la implementación para usar las variables y estructuras correctas:

```solidity
function getAllCompanies(CompanyStorage storage self) 
    external view returns (uint256[] memory) 
{
    uint256[] memory allCompanies = new uint256[](self.nextCompanyId);
    uint256 count = 0;
    for (uint256 i = 0; i < self.nextCompanyId; i++) {
        if (self.companies[i].id != 0) {
            allCompanies[count] = i;
            count++;
        }
    }
    
    uint256[] memory result = new uint256[](count);
    for (uint256 i = 0; i < count; i++) {
        result[i] = allCompanies[i];
    }
    return result;
}
```

Esto debería corregir el problema y hacer que el test pase correctamente.