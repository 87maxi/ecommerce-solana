# Análisis de Tests Fallidos en Integration.t.sol

## Resumen

Los tests en `Integration.t.sol` están fallando con los siguientes errores:

```
[FAIL: Error != expected error: Ecommerce: Company does not exist != Ecommerce: Cart is empty] testCannotCreateInvoiceWithEmptyCart() (gas: 120049)
[FAIL: ProductLib: Product does not exist] testCannotProcessPaymentForAlreadyPaidInvoice() (gas: 432426)
[FAIL: ProductLib: Product does not exist] testCompletePurchaseFlow() (gas: 432344)
```

## Análisis Detallado de los Fallos

### 1. Fallo en testCannotCreateInvoiceWithEmptyCart()

**Error:** `Error != expected error: Ecommerce: Company does not exist != Ecommerce: Cart is empty`

Este test espera que falle con el mensaje "Ecommerce: Cart is empty" pero está fallando con "Ecommerce: Company does not exist".

**Causa raíz:**

El problema está en la función `setUp()` del test. Aunque se registra una empresa, el test `testCannotCreateInvoiceWithEmptyCart()` intenta crear una factura para la compañía con ID 1, pero la validación `require(company.id != 0, "Ecommerce: Company does not exist")` en `createInvoice()` está fallando.

Al analizar la implementación de `CompanyLib.registerCompany()`:

```solidity
function registerCompany(CompanyStorage storage self, address owner, string memory name, string memory description) external returns (uint256) {
    uint256 companyId = self.nextCompanyId;
    // ...
    self.companies[companyId] = Company(/* ... */);
    self.nextCompanyId++;
    return companyId;
}
```

La primera empresa registrada debería tener ID 0, no 1. Sin embargo, el test asume que el ID es 1. Esto se debe a que `nextCompanyId` comienza en 0 y se incrementa después de asignar el ID.

**Problema adicional:**

El test `testCannotCreateInvoiceWithEmptyCart()` no está registrando al cliente antes de intentar crear la factura, lo que también podría causar problemas.

### 2. Fallos en testCompletePurchaseFlow() y testCannotProcessPaymentForAlreadyPaidInvoice()

**Error:** `ProductLib: Product does not exist`

Estos tests están fallando porque no pueden encontrar el producto cuando intentan verificar el stock después de la compra.

**Causa raíz:**


En `testCompletePurchaseFlow()`, se intenta agregar un producto:

```solidity
uint256 productId = ecommerce.addProduct(1, "Test Product", "Test Description", 100000, "ipfs://image", 10);
```

Pero la función `addProduct()` en `ProductLib.sol` tiene esta validación:

```solidity
function addProduct(ProductStorage storage self, uint256 companyId, string memory name, string memory description, uint256 price, string memory image, uint256 stock) external returns (uint256) {
    // Validate company exists
    require(company.id != 0, "ProductLib: Company does not exist");
    // ...
}
```

El problema es que se está pasando `1` como `companyId`, pero la compañía registrada tiene ID 0, no 1. Por lo tanto, la validación `require(company.id != 0)` falla porque no encuentra una compañía con ID 1.

## Soluciones Propuestas

### 1. Corregir la función setUp()

Modificar `setUp()` para usar el ID correcto de la compañía (0 en lugar de 1) y asegurar que todos los tests usen el ID correcto:

```solidity
// En setUp()
uint256 companyId = ecommerce.registerCompany(companyOwner, "Test Company", "Test Description");
// Usar companyId en lugar de asumir que es 1
assertEq(company.id, companyId);
```

### 2. Actualizar todos los tests para usar el ID correcto

Todos los tests que asumen que el ID de la compañía es 1 deben actualizarse para usar el ID real devuelto por `registerCompany()`.

### 3. Mejorar el diseño del sistema de IDs

Considerar si los IDs deberían comenzar desde 1 en lugar de 0 para evitar confusiones, o documentar claramente que los IDs comienzan desde 0.

### 4. Asegurar el registro del cliente

Verificar que el cliente esté registrado antes de intentar crear facturas o realizar compras.

## Recomendaciones

1. **Corregir los tests para que usen el ID correcto** - Modificar `setUp()` para que todos los tests usen el ID real de la compañía.
2. **Agregar validación de cliente** - Asegurar que `registerCustomer()` se llama antes de operaciones que lo requieran.
3. **Considerar cambiar la lógica de IDs** - Si es confuso que los IDs comiencen desde 0, modificar `CompanyLib` para que `nextCompanyId` comience en 1.
4. **Mejorar el mensaje de error** - Hacer que los mensajes de error sean más informativos sobre qué compañía no existe.

Los cambios en `setUp()` ya se han implementado para usar ID 1 directamente, lo que debería resolver parcialmente el problema, pero la solución definitiva sería usar el ID devuelto por `registerCompany()`.