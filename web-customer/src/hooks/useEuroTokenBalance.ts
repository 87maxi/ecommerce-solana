"use client";

import { useState, useEffect, useCallback } from "react";
import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";

/**
 * Hook para obtener y monitorear el balance de EURT (EuroToken) de la wallet conectada.
 * Utiliza variables de entorno consistentes con el script de despliegue y otros hooks.
 */
export function useEuroTokenBalance() {
  const [balance, setBalance] = useState<string>("0");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { connection } = useConnection();
  const { publicKey } = useWallet();

  const fetchBalance = useCallback(async () => {
    if (!connection || !publicKey) {
      console.log("[useEuroTokenBalance] No hay conexión o publicKey:", {
        connection: !!connection,
        publicKey: publicKey?.toBase58(),
      });
      setBalance("0");
      setLoading(false);
      return;
    }

    setError(null);

    try {
      // Priorizamos NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS (usada en deploy.sh y addresses.ts)
      // seguida de NEXT_PUBLIC_EUROTOKEN_MINT por compatibilidad.
      // Fallback a la dirección verificada en Surfpool.
      const mintAddressStr =
        process.env.NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS ||
        process.env.NEXT_PUBLIC_EUROTOKEN_MINT ||
        "AKWdemYgbmSujB1jTMm8q6q3fKTtcxr5XXp8tSSoDekC";

      console.log("[useEuroTokenBalance] Usando Mint:", mintAddressStr);
      const mint = new PublicKey(mintAddressStr);
      const ata = await getAssociatedTokenAddress(mint, publicKey);
      console.log("[useEuroTokenBalance] ATA:", ata.toBase58());

      try {
        const balanceInfo = await connection.getTokenAccountBalance(ata);
        console.log("[useEuroTokenBalance] Balance Info:", balanceInfo.value);
        setBalance(balanceInfo.value.uiAmountString || "0");
      } catch (e) {
        console.log(
          "[useEuroTokenBalance] Error al obtener balance (posiblemente ATA inexistente):",
          e,
        );
        // Si la ATA no existe, el balance es 0
        setBalance("0");
      }
    } catch (e: any) {
      console.error("[useEuroTokenBalance] Error:", e);
      setError("Error cargando balance");
      setBalance("0");
    } finally {
      setLoading(false);
    }
  }, [connection, publicKey]);

  useEffect(() => {
    fetchBalance(); // Carga inicial

    const interval = setInterval(fetchBalance, 15000); // Polling cada 15 seg
    window.addEventListener("refresh-eurt-balance", fetchBalance); // Escucha de evento global

    return () => {
      clearInterval(interval);
      window.removeEventListener("refresh-eurt-balance", fetchBalance);
    };
  }, [fetchBalance]);

  return { balance, loading, error, refreshBalance: fetchBalance };
}
