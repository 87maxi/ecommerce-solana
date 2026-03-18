'use client';

import React, { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';

// Los estilos se han movido a layout.tsx para evitar problemas de renderizado

/**
 * Proveedor global de Wallet de Solana para el panel de administración.
 * Configura la conexión a la red (devnet por defecto) y los adaptadores de billetera.
 */
export function AppWalletProvider({ children }: { children: React.ReactNode }) {
  // Configuración de red (devnet para desarrollo)
  const network = WalletAdapterNetwork.Devnet;

  // Endpoint de conexión priorizando la red local (Surfpool) para desarrollo
  const endpoint = useMemo(() => {
    return (
      process.env.NEXT_PUBLIC_RPC_URL ||
      process.env.NEXT_PUBLIC_SOLANA_RPC_HOST ||
      'http://127.0.0.1:8899' // Dirección por defecto de Surfpool/Localnet
    );
  }, []);

  // Usamos un array vacío ya que la mayoría de wallets modernas (Phantom, Backpack, Solflare)
  // implementan el 'Solana Wallet Standard' y son detectadas automáticamente.
  // Esto evita errores de duplicidad de llaves (como el de MetaMask) en el modal.
  const wallets = useMemo(() => [], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
