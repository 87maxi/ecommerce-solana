"use client";

import React, { useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { BackpackWalletAdapter } from "@solana/wallet-adapter-backpack";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare";
import { clusterApiUrl } from "@solana/web3.js";

// Importación de estilos usando sintaxis ESM para mejor compatibilidad con Turbopack
import "@solana/wallet-adapter-react-ui/styles.css";

/**
 * Proveedor de billetera para la aplicación de compra de stablecoin.
 * Permite la conexión a Solana de forma agnóstica a la billetera.
 */
export function AppWalletProvider({ children }: { children: React.ReactNode }) {
  // Configuración de red (devnet para desarrollo/pruebas)
  const network = WalletAdapterNetwork.Devnet;

  // Endpoint de conexión priorizando variables de entorno para redes locales (Surfpool)
  const endpoint = useMemo(() => {
    if (process.env.NEXT_PUBLIC_RPC_URL) {
      return process.env.NEXT_PUBLIC_RPC_URL;
    }
    return clusterApiUrl(network);
  }, [network]);

  // Selección de adaptadores de billetera soportados
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new BackpackWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [network],
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
