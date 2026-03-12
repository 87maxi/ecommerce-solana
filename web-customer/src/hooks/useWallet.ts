import { useWallet as useSolanaWallet } from "@solana/wallet-adapter-react";

/**
 * Hook personalizado que envuelve el useWallet de @solana/wallet-adapter-react
 * para proporcionar consistencia y alias necesarios para el código existente.
 */
export function useWallet() {
  const wallet = useSolanaWallet();

  return {
    ...wallet,
    // Alias para 'publicKey' usado como string en varios componentes
    address: wallet.publicKey?.toString() || null,
    // Alias para 'connected' usado en lógica de UI
    isConnected: wallet.connected,
  };
}
