"use client";

import { useState, useEffect } from "react";
import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";

export function useEuroTokenBalance() {
  const [balance, setBalance] = useState<string>("0");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const address = publicKey?.toBase58();

  useEffect(() => {
    let isMounted = true;

    const fetchBalance = async () => {
      if (!connection || !address || !publicKey) {
        if (isMounted) {
          setBalance("0");
          setLoading(false);
        }
        return;
      }

      try {
        if (isMounted) setLoading(true);
        if (isMounted) setError(null);

        const mintAddressStr =
          process.env.NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS;
        if (!mintAddressStr) {
          throw new Error(
            "EuroToken mint address not found in environment variables",
          );
        }

        const mint = new PublicKey(mintAddressStr);

        // Derive the Associated Token Account (ATA)
        const ata = await getAssociatedTokenAddress(mint, publicKey);

        try {
          // Fetch the SPL Token balance
          const balanceInfo = await connection.getTokenAccountBalance(ata);
          if (isMounted) {
            setBalance(balanceInfo.value.uiAmountString || "0");
          }
        } catch (e) {
          // If the account doesn't exist or hasn't been initialized, balance is effectively 0
          if (isMounted) {
            setBalance("0");
          }
        }
      } catch (err) {
        console.error("Error fetching balance:", err);
        if (isMounted) {
          setError("Failed to fetch EURT balance");
          setBalance("0");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchBalance();

    // Poll for balance updates every 10 seconds
    const interval = setInterval(fetchBalance, 10000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [connection, address, publicKey]);

  return { balance, loading, error };
}
