# Arquitectura de la Aplicación

## Vista General

Esta aplicación es un panel de administración para un comercio electrónico blockchain, construida con Next.js, TypeScript, Tailwind CSS y Ethers.js. La arquitectura sigue un patrón de componentes modulares con un enfoque en la responsividad y la integración con Web3.

## Estructura de Directorios

```
web-admin/
├── app/
│   ├── components/
│   │   ├── WalletConnect.tsx
│   │   ├── StatsCard.tsx
│   │   └── TransactionList.tsx
│   └── page.tsx
├── __tests__/
│   └── components/
│       ├── WalletConnect.test.tsx
│       ├── StatsCard.test.tsx
│       └── TransactionList.test.tsx
├── public/
├── types/
│   └── ethereum.d.ts
└── docs/
    ├── ARCHITECTURE.md
    ├── API.md
    ├── SECURITY.md
```

## Componentes Principales

### WalletConnect
Componente que maneja la conexión con billeteras Web3 (MetaMask). Proporciona funcionalidades para:
- Conectar/desconectar billeteras
- Mostrar información de la cuenta conectada
- Manejar cambios de red y cuenta
- Mostrar errores de conexión

### StatsCard
Componente reusable para mostrar métricas clave con indicadores visuales. Acepta propiedades para personalizar:
- Título y descripción
- Valor numérico o string
- Color del indicador
- Tendencia (up/down/neutral)

### TransactionList
Componente que muestra una lista de transacciones recientes con:
- Formato de ID de transacción
- Información del usuario
- Monto y moneda
- Estado (confirmado, pendiente, fallido)
- Timestamp

## Flujo de Datos

1. El usuario interactúa con el componente WalletConnect
2. Si la conexión es exitosa, se llama al callback `onConnect` con la dirección de la billetera
3. El componente padre maneja el estado de conexión y renderiza otros componentes condicionalmente
4. Los datos de transacción son pasados directamente como props al componente TransactionList
5. Los cambios en la interfaz son reflejados inmediatamente gracias a React

## Integración Web3

La aplicación se conecta a una red Ethereum local (Anvil) a través de Ethers.js. La configuración predeterminada utiliza:
- URL RPC: `http://localhost:8545`
- Chain ID: `31337`
- Contrato inteligente en la dirección configurada en variables de entorno

## Estado de la Aplicación

El estado de la aplicación es manejado principalmente a través de React Hooks (`useState`) en los componentes. No se utiliza un sistema de gestión de estado global, ya que la complejidad de la aplicación es baja y el estado es principalmente local al componente o pasada como props.

## Accesibilidad

La aplicación sigue prácticas de accesibilidad web mediante:
- Uso adecuado de roles ARIA
- Etiquetas descriptivas para botones y controles
- Contraste adecuado entre texto y fondo
- Soporte para navegación por teclado
- Tamaños de fuente adecuados para lectura