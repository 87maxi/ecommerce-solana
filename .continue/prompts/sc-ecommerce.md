# Análisis del Proyecto sc-ecommerce

## Descripción General

El proyecto `sc-ecommerce` es un contrato inteligente monolítico de comercio electrónico que integra múltiples funcionalidades en una sola entidad: registro de empresas, catálogo de productos, carrito de compras, gestión de clientes e invoicing. Este contrato está diseñado para operar sobre una blockchain Ethereum-compatible (probablemente utilizando anvil/hardhat para desarrollo) y utiliza EuroToken (EURT) como medio de pago.

El contrato sigue un patrón de librerías para modularizar la lógica mientras mantiene un único punto de entrada, facilitando el despliegue y la gestión. El enfoque combina patrones de proxy con almacenamiento separado por módulos.

## Framework y Herramientas

- **Lenguaje:** Solidity (^0.8.13)
- **Framework:** Foundry
- **Librerías externas:** OpenZeppelin (para seguridad y estándares)

La utilización de Foundry permite un desarrollo eficiente con pruebas rápidas, manipulación de tiempo/estado y despliegues automatizados. Se aprovecha al máximo el sistema de scripts para tareas repetitivas.

## Estructura del Proyecto

```
sc-ecommerce/
├── foundry.toml
├── script/
│   └── DeployEcommerce.s.sol
├── src/
│   ├── Ecommerce.sol
│   └── libraries/
│       ├── CompanyLib.sol
│       ├── ProductLib.sol
│       ├── CustomerLib.sol
│       └── ShoppingCartLib.sol
├── test/
│   ├── CompanyRegistry.t.sol
│   ├── Integration.t.sol
│   └── ShoppingCart.t.sol
```

## Configuración

El archivo `foundry.toml` contiene configuración mínima estándar de Foundry:

```toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
```

Este setup asume que las dependencias OpenZeppelin están instaladas en el directorio `lib/` (probablemente mediante `forge install`), aunque no está presente en el repositorio compartido.

## Arquitectura del Contrato

El contrato `Ecommerce.sol` utiliza un patrón de librerías con storage externo. Cada módulo (empresa, producto, cliente, carrito) tiene su propia librería con funciones asociadas y almacén de datos separado.

### Patrón de Librerías

El contrato declara estructuras de almacenamiento internas y utiliza el operador `using` para adjuntar funciones:

```solidity
using CompanyLib for CompanyLib.CompanyStorage;
// ...
CompanyLib.CompanyStorage internal companyStorage;
```

Esto permite llamar a funciones de librerías como métodos del storage:
```solidity
companyStorage.registerCompany(address, name, description);
```

Cada librería gestiona su propio estado y provee funciones CRUD para su entidad correspondiente.

## Contrato Principal: Ecommerce.sol

### Constructor

```solidity
constructor(address _euroTokenAddress) {
  owner = msg.sender;
  euroTokenAddress = _euroTokenAddress;
  companyStorage.nextCompanyId = 1;
  productStorage.nextProductId = 1;
}
```

- Establece al desplegador como owner
- Configura dirección del contrato de EuroToken
- Inicializa contadores de ID

### Estructuras de Datos

#### `Invoice` y `InvoiceItem`

```solidity
struct Invoice {
  uint256 invoiceId;
  uint256 companyId;
  address customerAddress;
  uint256 totalAmount;
  uint256 timestamp;
  bool isPaid;
  string paymentTxHash;
}

struct InvoiceItem {
  uint256 productId;
  string productName;
  uint256 quantity;
  uint256 unitPrice;
  uint256 totalPrice;
}
```

Gestiona facturas con: identificación, empresa, cliente, monto total, estado de pago y detalles de los ítems.

### Módulo: Empresa (Company)


Gestiona el registro y gestión de empresas comerciales.

#### Funciones Principales

- `registerCompany(address, string, string)`: Registra una nueva empresa
- `deactivateCompany(uint256)`: Desactiva una empresa
- `activateCompany(uint256)`: Activa una empresa
- `getCompany(uint256)`: Obtiene datos de empresa
- `getCompanyByAddress(address)`: Obtiene empresa por dirección
- `getAllCompanies()`: Lista todas las empresas
- `isCompanyActive(uint256)`: Verifica estado de empresa

El owner del contrato controla el registro de empresas, lo que permite un sistema de aprobación centralizado.

### Módulo: Producto (Product)

Gestiona catálogo de productos con precios, stock e imágenes almacenadas en IPFS.

#### Funciones Principales

- `addProduct(uint256, string, string, uint256, string, uint256)`: Añade producto
- `updateProduct(uint256, string, string, uint256, string)`: Actualiza producto
- `updateStock(uint256, uint256)`: Actualiza stock
- `decreaseStock(uint256, uint256)`: Reduce stock
- `deactivateProduct(uint256)`: Desactiva producto
- `activateProduct(uint256)`: Activa producto
- `getProduct(uint256)`: Obtiene producto
- `getProductsByCompany(uint256)`: Obtiene productos por empresa
- `getAllProducts()`: Lista todos los productos
- `isProductAvailable(uint256, uint256)`: Verifica disponibilidad

Los propietarios de empresas pueden gestionar solo sus propios productos, garantizando aislamiento.

### Módulo: Cliente (Customer)

Gestiona registro y estadísticas de clientes.

#### Funciones Principales

- `registerCustomer()`: Registra cliente (autoregistro)
- `getCustomer(address)`: Obtiene datos de cliente
- `getAllCustomers()`: Lista todos los clientes
- `isCustomerRegistered(address)`: Verifica si cliente está registrado

El registro es autogestionado; cualquier usuario puede registrarse invocando la función.

### Módulo: Carrito de Compras (ShoppingCart)

Gestiona carritos de compras por cliente.

#### Funciones Principales

- `addToCart(uint256, uint256)`: Añade producto al carrito
- `removeFromCart(uint256)`: Elimina producto del carrito
- `updateQuantity(uint256, uint256)`: Actualiza cantidad
- `getCart(address)`: Obtiene carrito
- `clearCart(address)`: Limpia carrito
- `calculateTotal(address)`: Calcula total
- `getCartItemCount(address)`: Obtiene cantidad de ítems

El carrito se asocia a direcciones de cliente y persiste mientras no se limpie.

### Módulo: Facturación (Invoice)

Gestiona creación de facturas a partir de carritos.

#### Funciones Principales

- `createInvoice(address, uint256)`: Crea factura para una empresa específica
- `getInvoice(uint256)`: Obtiene factura
- `getInvoiceItems(uint256)`: Obtiene ítems de factura
- `getCustomerInvoices(address)`: Obtiene facturas de cliente
- `getCompanyInvoices(uint256)`: Obtiene facturas de empresa

### Módulo: Pago (Payment)

Procesa pagos de facturas mediante transferencia de tokens EURT.

#### `processPayment(address, uint256, uint256)`

```solidity
function processPayment(
  address _customer,
  uint256 _amount,
  uint256 _invoiceId
) external returns (bool)
```

**Flujo:**
1. Verifica existencia y estado de la factura
2. Verifica consistencia de monto
3. Verifica saldo suficiente del cliente
4. Transfiere tokens EURT del cliente al comerciante
5. Marca factura como pagada
6. Actualiza estadísticas de compra de cliente
7. Reduce stock de productos

Este es el punto crítico de seguridad donde se producen las transferencias de valor.

## Script de Despliegue

### `script/DeployEcommerce.s.sol`
