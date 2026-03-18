"use client";

import React, { useMemo, useCallback } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork, WalletError } from "@solana/wallet-adapter-base";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";

// Los estilos de la wallet se importan en src/app/layout.tsx para evitar errores de hidratación.

export function AppWalletProvider({ children }: { children: React.ReactNode }) {
  // La red se puede configurar a 'devnet', 'testnet', o 'mainnet-beta'.
  // Para este proyecto, usamos un endpoint RPC local que sobreescribe la red.
  const network = WalletAdapterNetwork.Devnet;

  const endpoint = useMemo(() => {
    return (
      process.env.NEXT_PUBLIC_RPC_URL ||
      process.env.NEXT_PUBLIC_SOLANA_RPC_HOST ||
      clusterApiUrl(network)
    );
  }, [network]);

  // Usamos un array vacío ya que las billeteras modernas de Solana (Phantom, Solflare, Backpack)
  // son detectadas automáticamente a través del estándar de billeteras de Solana.
  const wallets = useMemo(() => [], []);

  const onError = useCallback((error: WalletError) => {
    // Maneja errores de la wallet de forma segura, como rechazos o fallos de conexión.
    // Solo logueamos el mensaje para no llenar la consola con objetos de error enteros
    console.warn(
      "[WalletAdapter Warning]:",
      error.message ? error.message : error,
    );
  }, []); // onError tampoco depende de variables externas, se crea una vez

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} onError={onError} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
