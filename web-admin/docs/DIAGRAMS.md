# Diagramas de la Aplicación

## Diagrama de Arquitectura

```mermaid
graph TD
    A[Usuario] --> B[Interfaz Web]
    B --> C[WalletConnect]
    B --> D[StatsCard]
    B --> E[TransactionList]
    C --> F[MetaMask]
    C --> G[Ethers.js]
    G --> H[Contrato Inteligente]
    G --> I[Anvil Node]
    H --> J[Blockchain]
    F --> G
    
    style A fill:#4a90e2,stroke:#333
    style B fill:#7ed321,stroke:#333
    style C fill:#f5a623,stroke:#333
    style D fill:#f5a623,stroke:#333
    style E fill:#f5a623,stroke:#333
    style F fill:#dd4b39,stroke:#333
    style G fill:#1c8db2,stroke:#333
    style H fill:#8b5cf6,stroke:#333
    style I fill:#8b5cf6,stroke:#332
    style J fill:#4a4a4a,stroke:#333
    
    click A "docs/ARCHITECTURE.md"
    click B "docs/ARCHITECTURE.md"
    click C "docs/API.md#walletconnect"
    click D "docs/API.md#statscard"
    click E "docs/API.md#transactionlist"
    click F "docs/WALLET.md"
    click G "docs/ETHEREUM.md"
    click H "docs/SMART_CONTRACT.md"
    click I "docs/ANVIL.md"
    click J "docs/BLOCKCHAIN.md"
```

## Diagrama de Flujo de Conexión

```mermaid
sequenceDiagram
    participant U as Usuario
    participant UI as Interfaz
    participant WM as WalletConnect
    participant MM as MetaMask
    participant ET as Ethers.js
    
    U->>UI: Navega a la página
    UI->>WM: Renderiza componente
    WM->>MM: Verifica window.ethereum
    alt MetaMask Instalado
        MM-->>WM: Devuelve objeto ethereum
        WM->>MM: Llama eth_accounts
        MM-->>WM: Devuelve cuentas
        alt Cuentas disponibles
            WM->>UI: Carga estado conectado
            UI->>WM: Renderiza información de cuenta
        else No hay cuentas
            UI->>WM: Muestra botón de conexión
        end
    else MetaMask No Instalado
        WM->>UI: Muestra advertencia
        UI->>U: "Instalar MetaMask"
    end
    
    U->>UI: Click en "Connect Wallet"
    UI->>WM: Dispara función connect
    WM->>MM: llama eth_requestAccounts
    alt Usuario Acepta
        MM-->>WM: Devuelve cuentas
        WM->>UI: onConnect(address)
        UI->>UI: Actualiza UI con dirección
    else Usuario Rechaza
        WM->>UI: onError
        UI->>U: Muestra error
    end
```

## Diagrama de Componentes

```mermaid
classDiagram
    class WalletConnect {
        +onConnect(address: string)
        +onDisconnect()
        -walletAddress: string | null
        -chainId: string | null
        -isConnecting: boolean
        -error: string | null
        +connectWallet(): Promise~void~
        +disconnectWallet(): void
        +formatAddress(address: string): string
    }
    
    class StatsCard {
        +title: string
        +value: string | number
        +description: string
        +trend?: 'up' | 'down' | 'neutral'
        +color?: 'primary' | 'success' | 'warning' | 'danger'
    }
    
    class TransactionList {
        +transactions: Transaction[]
        +getStatusColor(status: string): string
    }
    
    class Transaction {
        +id: string
        +user: string
        +amount: string
        +status: 'confirmed' | 'pending' | 'failed'
        +time: string
    }
    
    WalletConnect --> TransactionList : Usa en UI
    WalletConnect --> StatsCard : Usa en UI
    WalletConnect ..> MetaMask : Comunica via window.ethereum
    StatsCard --> TailwindCSS : Usa clases de estilos
    TransactionList --> TailwindCSS : Usa clases de estilos
    WalletConnect --> EthersJS : Usa para interacción Web3
    
    note "Componente principal de conexión con billeteras Web3" as WalletConnectNote
    WalletConnect .. WalletConnectNote
    
    note "Muestra métricas clave con indicadores visuales" as StatsCardNote
    StatsCard .. StatsCardNote
    
    note "Lista de transacciones recientes con estados" as TransactionListNote
    TransactionList .. TransactionListNote
```

## Diagrama de Secuencia - Conexión Exitosa

```mermaid
sequenceDiagram
    actor Usuario
    participant Browser as Navegador
    participant React as React Component
    participant Ethereum as window.ethereum
    participant MetaMask as MetaMask Extension

    Usuario->>Browser: Visita sitio web
    Browser->>React: Renderiza componente WalletConnect
    React->>Ethereum: Verifica existencia (typeof window !== 'undefined' && window.ethereum)
    
    alt MetaMask está instalado
        Ethereum-->>React: Devuelve objeto ethereum
        React->>Ethereum: Llama ethereum.request({ method: 'eth_accounts' })
        
        alt Hay cuentas conectadas
            MetaMask->>Ethereum: Devuelve array de direcciones
            Ethereum-->>React: ["0x..."]
            React->>React: setWalletAddress(accounts[0])
            React->>React: onConnect(address)
            React->>Browser: Renderiza estado conectado
            Browser->>Usuario: Muestra dirección y botón de desconexión
        else No hay cuentas conectadas
            MetaMask->>Ethereum: Devuelve []
            Ethereum-->>React: []
            React->>Browser: Renderiza botón de conexión
            Browser->>Usuario: Muestra botón "Connect Wallet"
            
            Usuario->>Browser: Click en "Connect Wallet"
            Browser->>React: Dispara connectWallet()
            React->>Ethereum: Llama ethereum.request({ method: 'eth_requestAccounts' })
            
            alt Usuario acepta conexión
                MetaMask->>Usuario: Muestra popup de confirmación
                Usuario->>MetaMask: Click en "Conectar"
                MetaMask->>Ethereum: Devuelve direcciones
                Ethereum-->>React: ["0x..."]
                React->>React: setWalletAddress(accounts[0])
                React->>React: onConnect(address)
                React->>Browser: Actualiza UI
                Browser->>Usuario: Muestra estado conectado
            else Usuario rechaza conexión
                MetaMask->>Ethereum: Rechaza promesa
                Ethereum-->>React: Error
                React->>React: setError("User rejected request")
                React->>Browser: Muestra mensaje de error
                Browser->>Usuario: Muestra error
            end
        end
    else MetaMask no está instalado
        Ethereum-->>React: undefined
        React->>React: setError("MetaMask is not installed...")
        React->>Browser: Muestra mensaje de error
        Browser->>Usuario: "Install MetaMask"
    end
```

## Diagrama de Estados - WalletConnect

```mermaid
stateDiagram-v2
    [*] --> Disconnected
    
    state Disconnected {
        [*] --> NoMetaMask
        [*] --> ReadyToConnect
        
        state NoMetaMask {
            [*] --> DisplayError
            DisplayError: Muestra mensaje
            "MetaMask no instalado"
        }
        
        state ReadyToConnect {
            [*] --> DisplayButton
            DisplayButton: Muestra botón
            "Connect Wallet"
            DisplayButton --> Connecting: Click en botón
        }
        
        Connecting --> Connected: Conexión exitosa
        Connecting --> Error: Usuario rechaza
        Connecting --> Error: Error técnico
    }
    
    state Connected {
        [*] --> DisplayInfo
        DisplayInfo: Muestra dirección
        y estado de red
        DisplayInfo --> Disconnected: Click en "Disconnect"
    }
```

##