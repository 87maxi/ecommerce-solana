'use client';

import { BrowserProvider, JsonRpcSigner } from 'ethers';
import React, { useState, useCallback, useEffect } from 'react';

export type WalletProvider = 'metamask';

export type WalletInfo = {
  provider: WalletProvider;
  info: {
    label: string;
    icon: string;
  };
};

export type WalletState = {
  provider: BrowserProvider | null;
  signer: JsonRpcSigner | null;
  address: string | null;
  chainId: number | null;
  connecting: boolean;
  error: Error | null;
};

type EthereumProvider = {
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  on: (event: string, callback: (...args: any[]) => void) => void;
  removeListener: (event: string, callback: (...args: any[]) => void) => void;
};

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

async function connectWalletProvider(walletInfo: WalletInfo): Promise<{
  provider: BrowserProvider;
  signer: JsonRpcSigner;
  address: string;
  chainId: number;
}> {
  if (!window.ethereum) {
    throw new Error(
      'No se encontró una wallet Ethereum. Por favor, instala MetaMask, Rabby u otra wallet compatible.'
    );
  }

  try {
    console.log('Requesting wallet connection...');
    const provider = new BrowserProvider(window.ethereum);
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    });

    console.log('Accounts received:', accounts);

    if (!accounts || accounts.length === 0) {
      throw new Error(
        'No se encontraron cuentas. Por favor, desbloquea tu wallet.'
      );
    }

    const signer = await provider.getSigner();
    const network = await provider.getNetwork();

    console.log('Connected to network:', network.chainId);
    console.log('Connected address:', accounts[0]);

    return {
      provider,
      signer,
      address: accounts[0],
      chainId: Number(network.chainId),
    };
  } catch (error: any) {
    console.error('Wallet connection error:', error);
    if (error.code === 4001) {
      throw new Error('El usuario rechazó la conexión de la billetera');
    }
    throw new Error(`Error al conectar billetera: ${error.message || error}`);
  }
}

async function switchNetworkProvider(chainId: number): Promise<void> {
  if (!window.ethereum) {
    throw new Error('No se encontró el proveedor Ethereum');
  }

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${chainId.toString(16)}` }],
    });
  } catch (error: any) {
    if (error.code === 4902) {
      throw new Error(
        `La red con ID ${chainId} no está configurada en MetaMask`
      );
    }
    throw new Error(`Error al cambiar de red: ${error.message || error}`);
  }
}

export const WalletContext = React.createContext<WalletState & {
  connect: (walletInfo: WalletInfo) => Promise<void>;
  disconnect: () => void;
  switchNetwork: (chainId: number) => Promise<void>;
  isConnected: boolean;
} | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<WalletState>({
    provider: null,
    signer: null,
    address: null,
    chainId: null,
    connecting: false,
    error: null,
  });

  const connect = useCallback(async (walletInfo: WalletInfo) => {
    setState(prev => ({ ...prev, connecting: true, error: null }));

    try {
      const { provider, signer, address, chainId } =
        await connectWalletProvider(walletInfo);

      setState(prev => ({
        ...prev,
        provider,
        signer,
        address,
        chainId,
        connecting: false,
      }));

      localStorage.setItem('selectedWallet', JSON.stringify(walletInfo));
      localStorage.setItem('connectedAddress', address);
      localStorage.setItem('connectedChainId', chainId.toString());
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Error desconocido al conectar billetera';
      setState(prev => ({
        ...prev,
        connecting: false,
        error: new Error(errorMessage),
      }));
    }
  }, []);

  const disconnect = useCallback(() => {
    setState({
      provider: null,
      signer: null,
      address: null,
      chainId: null,
      connecting: false,
      error: null,
    });

    localStorage.removeItem('selectedWallet');
    localStorage.removeItem('connectedAddress');
    localStorage.removeItem('connectedChainId');
  }, []);

  const switchNetwork = useCallback(
    async (chainId: number) => {
      if (!state.provider) return;

      try {
        await switchNetworkProvider(chainId);
        const network = await state.provider.getNetwork();
        setState(prev => ({ ...prev, chainId: Number(network.chainId) }));

        localStorage.setItem('connectedChainId', network.chainId.toString());
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Error desconocido al cambiar de red';
        setState(prev => ({ ...prev, error: new Error(errorMessage) }));
      }
    },
    [state.provider]
  );

  useEffect(() => {
    async function autoConnect() {
      const savedWallet = localStorage.getItem('selectedWallet');
      const savedAddress = localStorage.getItem('connectedAddress');
      const savedChainId = localStorage.getItem('connectedChainId');

      if (savedWallet && savedAddress && savedChainId) {
        try {
          if (!window.ethereum) {
            throw new Error('MetaMask no está disponible');
          }

          const provider = new BrowserProvider(window.ethereum);
          const network = await provider.getNetwork();
          const chainId = Number(network.chainId);

          if (savedAddress && chainId.toString() === savedChainId) {
            const signer = await provider.getSigner();

            setState({
              provider,
              signer,
              address: savedAddress,
              chainId,
              connecting: false,
              error: null,
            });
          }
        } catch (error) {
          console.warn('Auto-conexión fallida:', error);
          localStorage.removeItem('selectedWallet');
          localStorage.removeItem('connectedAddress');
          localStorage.removeItem('connectedChainId');
        }
      }
    }

    autoConnect();
  }, []);

  useEffect(() => {
    if (!state.provider || !window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length > 0) {
        setState(prev => ({ ...prev, address: accounts[0] }));
        localStorage.setItem('connectedAddress', accounts[0]);
      } else {
        disconnect();
      }
    };

    const handleChainChanged = (chainId: string) => {
      const numericChainId = Number(chainId);
      setState(prev => ({ ...prev, chainId: numericChainId }));
      localStorage.setItem('connectedChainId', numericChainId.toString());
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum?.removeListener('chainChanged', handleChainChanged);
    };
  }, [state.provider, disconnect]);

  const isConnected = !!state.address;

  const value = {
    ...state,
    connect,
    disconnect,
    switchNetwork,
    isConnected,
  };

  return (
    <WalletContext.Provider value= { value } >
    { children }
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = React.useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
