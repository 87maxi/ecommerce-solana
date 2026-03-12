'use client';

import React, { useMemo, createContext, useContext } from 'react';
import {
  ConnectionProvider,
  WalletProvider as SolanaWalletProvider,
  useWallet as useSolanaWallet,
  useConnection,
} from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { WalletModalProvider, useWalletModal } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl, Connection } from '@solana/web3.js';

import '@solana/wallet-adapter-react-ui/styles.css';

export type WalletProviderType = 'phantom' | 'metamask' | string;

export type WalletInfo = {
  provider: WalletProviderType;
  info: {
    label: string;
    icon: string;
  };
};

export type WalletState = {
  // We keep 'provider' and 'signer' names for backward compatibility during the transition,
  // but they now expose Solana's Connection and Wallet adapter interface instead of ethers.js
  provider: Connection | null;
  signer: any | null;
  address: string | null;
  chainId: number | null;
  connecting: boolean;
  error: Error | null;
  isConnected: boolean;
  connect: (walletInfo?: WalletInfo) => Promise<void>;
  disconnect: () => void;
  switchNetwork: (chainId: number) => Promise<void>;
};

const WalletContext = createContext<WalletState | null>(null);

function WalletAdapter({ children }: { children: React.ReactNode }) {
  const { connection } = useConnection();
  const solanaWallet = useSolanaWallet();
  const { setVisible } = useWalletModal();

  const state: WalletState = {
    provider: connection,
    signer: solanaWallet,
    address: solanaWallet.publicKey ? solanaWallet.publicKey.toBase58() : null,
    chainId: 1337, // Mocked chainId to avoid breaking legacy code expecting a number
    connecting: solanaWallet.connecting || solanaWallet.disconnecting,
    error: null,
    isConnected: solanaWallet.connected,
    connect: async () => {
      // In Solana, we trigger the wallet modal rather than connecting a specific provider implicitly
      setVisible(true);
    },
    disconnect: () => {
      if (solanaWallet.disconnect) {
        solanaWallet.disconnect();
      }
    },
    switchNetwork: async (chainId: number) => {
      console.warn('switchNetwork is not supported in the Solana adapter.');
    },
  };

  return <WalletContext.Provider value={state}>{children}</WalletContext.Provider>;
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const network = WalletAdapterNetwork.Devnet;

  const endpoint = useMemo(() => {
    if (process.env.NEXT_PUBLIC_RPC_URL) {
      return process.env.NEXT_PUBLIC_RPC_URL;
    }
    return clusterApiUrl(network);
  }, [network]);

  const wallets = useMemo(() => [new PhantomWalletAdapter()], [network]);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <WalletAdapter>{children}</WalletAdapter>
        </WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
