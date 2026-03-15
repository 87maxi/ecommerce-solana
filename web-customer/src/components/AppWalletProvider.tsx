"use client";

import React, { useMemo, useCallback } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork, WalletError } from "@solana/wallet-adapter-base";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { BackpackWalletAdapter } from "@solana/wallet-adapter-backpack";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare";
import { clusterApiUrl } from "@solana/web3.js";

// Los estilos se han movido a src/app/layout.tsx para evitar problemas de hidratación

export function AppWalletProvider({ children }: { children: React.ReactNode }) {
  const network = WalletAdapterNetwork.Devnet;

  const endpoint = useMemo(() => {
    // Usamos el host RPC configurado en .env para Surfpool/Localnet
    return (
      process.env.NEXT_PUBLIC_SOLANA_RPC_HOST ||
      process.env.NEXT_PUBLIC_RPC_URL ||
      clusterApiUrl(network)
    );
  }, [network]);

  // Inicialización de adaptadores de billetera específicos para reducir el tamaño del bundle
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new BackpackWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [network],
  );

  const onError = useCallback((error: WalletError) => {
    console.error("[Wallet Error]:", error.message ? error.message : error);
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect onError={onError}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
