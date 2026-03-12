# Documentación de APIs

## Componentes Públicos

### `WalletConnect`

Componente de React para gestionar la conexión con billeteras Web3.

**Props:**

```tsx
interface WalletConnectProps {
  /**
   * Callback que se ejecuta cuando se establece una conexión exitosa
   * @param address - Dirección de la billetera conectada
   */
  onConnect: (address: string) => void;
  
  /**
   * Callback que se ejecuta cuando se desconecta la billetera
   */
  onDisconnect: () => void;
}
```

**Uso:**

```tsx
<WalletConnect 
  onConnect={(address) => console.log('Conectado:', address)}
  onDisconnect={() => console.log('Desconectado')}
/>
```

### `StatsCard`

Componente para mostrar métricas estadísticas con indicadores visuales.

**Props:**

```tsx
interface StatsCardProps {
  /** Título descriptivo de la métrica */
  title: string;
  
  /** Valor a mostrar (numérico o cadena) */
  value: string | number;
  
  /** Descripción adicional de la métrica */
  description: string;
  
  /** Tendencia de la métrica */
  trend?: 'up' | 'down' | 'neutral';
  
  /** Color del indicador */
  color?: 'primary' | 'success' | 'warning' | 'danger';
}
```

**Uso:**

```tsx
<StatsCard 
  title="Usuarios" 
  value={1284} 
  description="Usuarios activos en la plataforma" 
  color="primary" 
/>
```

### `TransactionList`

Componente para listar transacciones recientes.

**Props:**

```tsx
interface Transaction {
  /** ID único de la transacción */
  id: string;
  
  /** Nombre del usuario relacionado */
  user: string;
  
  /** Monto y moneda de la transacción */
  amount: string;
  
  /** Estado de la transacción */
  status: 'confirmed' | 'pending' | 'failed';
  
  /** Timestamp relativo */
  time: string;
}

interface TransactionListProps {
  /** Lista de transacciones a mostrar */
  transactions: Transaction[];
}
```

**Uso:**

```tsx
<TransactionList 
  transactions={[
    { id: '0x8a1...d2e4', user: 'Alice', amount: '0.5 ETH', status: 'confirmed', time: '2 min ago' }
  ]} 
/>
```

## Variables de Entorno

La aplicación utiliza las siguientes variables de entorno:

| Variable | Descripción | Valor Predeterminado |
|---------|-------------|---------------------|
| `NEXT_PUBLIC_APP_NAME` | Nombre de la aplicación | "Blockchain E-Commerce Admin" |
| `NEXT_PUBLIC_BASE_URL` | URL base de la aplicación | "http://localhost:3000" |
| `NEXT_PUBLIC_NETWORK_NAME` | Nombre de la red blockchain | "Anvil" |
| `NEXT_PUBLIC_NETWORK_ID` | ID de la red blockchain | "31337" |
| `NEXT_PUBLIC_RPC_URL` | URL del nodo RPC | "http://localhost:8545" |
| `NEXT_PUBLIC_CONTRACT_ADDRESS` | Dirección del contrato inteligente | "0x5FbDB2315678afecb367f032d93F642f64180aa3" |
| `NEXT_PUBLIC_ENABLE_TESTNETS` | Habilitar redes de prueba | "true" |
| `NEXT_PUBLIC_AUTO_CONNECT` | Intentar conexión automática | "true" |
| `NEXT_PUBLIC_ENABLE_ANALYTICS` | Habilitar analíticas | "false" |
| `NEXT_PUBLIC_ENABLE_NOTIFICATIONS` | Habilitar notificaciones | "true" |
| `NEXT_PUBLIC_THEME` | Tema predeterminado | "dark" |
| `NEXT_PUBLIC_LANGUAGE` | Idioma predeterminado | "en" |

## Endpoints de la API

Esta aplicación no expone endpoints API externos, ya que es un frontend que se comunica directamente con:
- Contratos inteligentes a través de Ethers.js
- MetaMask a través de la API window.ethereum

## Tipos TypeScript

La aplicación define los siguientes tipos personalizados:

### `Transaction`
Interfaz que representa una transacción en el sistema.

### `StatsCardProps`
Interfaz que define las propiedades para el componente StatsCard.

### `TransactionListProps`
Interfaz que define las propiedades para el componente TransactionList.

### `WalletConnectProps`
Interfaz que define las propiedades para el componente WalletConnect.

## Hooks Personalizados

Actualmente no se utilizan hooks personalizados. El estado es gestionado con los hooks estándar de React (`useState`, `useEffect`).

## Integraciones Externas

### MetaMask

La aplicación se integra con MetaMask a través de la API `window.ethereum`. Los métodos utilizados son:
- `eth_requestAccounts` - Para solicitar acceso a las cuentas del usuario
- `eth_accounts` - Para obtener las cuentas conectadas actualmente
- `eth_chainId` - Para obtener el ID de la red actual

Se escuchan los siguientes eventos:
- `accountsChanged` - Cuando cambian las cuentas conectadas
- `chainChanged` - Cuando cambia la red blockchain
- `disconnect` - Cuando se desconecta la billetera

### Ethers.js

Se utiliza la versión 6 de Ethers.js para:
- Conexión con nodos Ethereum
- Lectura de datos del blockchain
- Interacción con contratos inteligentes

### Tailwind CSS

La aplicación utiliza Tailwind CSS para estilización con un enfoque en diseño responsive y moderno para aplicaciones Web3. Se han definido clases personalizadas en `globals.css` para colores y estilos específicos del proyecto.