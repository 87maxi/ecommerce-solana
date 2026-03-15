"use client";

import { useState, useEffect, useCallback } from "react";
import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";

export function useEuroTokenBalance() {
  const [balance, setBalance] = useState<string>("0");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { connection } = useConnection();
  const { publicKey } = useWallet();

  // Se crea una única función estable para obtener el balance
  const fetchBalance = useCallback(async () => {
    if (!connection || !publicKey) {
      setBalance("0");
      setLoading(false);
      return;
    }

    // No reiniciar el estado de carga en cada sondeo para evitar parpadeos
    // setLoading(true);
    setError(null);

    try {
      const mintAddressStr = process.env.NEXT_PUBLIC_EUROTOKEN_MINT;
      if (!mintAddressStr) {
        throw new Error("Mint de EuroToken no configurado en el entorno");
      }

      const mint = new PublicKey(mintAddressStr);
      const ata = await getAssociatedTokenAddress(mint, publicKey);

      const balanceInfo = await connection.getTokenAccountBalance(ata);
      setBalance(balanceInfo.value.uiAmountString || "0");
    } catch (e) {
      // Si la ATA no existe, el balance es 0
      setBalance("0");
    } finally {
      // Solo desactivar el estado de carga inicial la primera vez
      if (loading) setLoading(false);
    }
  }, [connection, publicKey, loading]);

  // Este efecto se encarga de toda la lógica de actualización
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
