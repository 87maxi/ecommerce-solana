import { useWallet } from "@/hooks/useWallet";
import { useState, useEffect } from "react";
import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";

export default function WalletConnect() {
  const { isConnected, address, error, connect, disconnect, provider } =
    useWallet();
  const [balance, setBalance] = useState<string | null>("...");

  useEffect(() => {
    const fetchBalance = async () => {
      if (isConnected && address && provider) {
        try {
          const contractAddress =
            process.env.NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS;

          if (!contractAddress) {
            console.error("EuroToken mint address not found in env");
            return;
          }

          const mint = new PublicKey(contractAddress);
          const userPubKey = new PublicKey(address);

          const ata = await getAssociatedTokenAddress(mint, userPubKey);

          try {
            const balanceInfo = await provider.getTokenAccountBalance(ata);
            const formatted = balanceInfo.value.uiAmountString || "0";
            setBalance(parseFloat(formatted).toFixed(2));
          } catch (e) {
            // If the ATA doesn't exist, the user has a 0 balance
            setBalance("0.00");
          }
        } catch (err) {
          console.error("Error fetching balance:", err);
          setBalance("Error");
        }
      } else {
        setBalance(null);
      }
    };

    fetchBalance();

    // Poll for balance updates
    let interval: NodeJS.Timeout;
    if (isConnected && address) {
      interval = setInterval(fetchBalance, 10000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isConnected, address, provider]);

  return (
    <div className="flex items-center gap-4">
      {isConnected && address ? (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-secondary/50 px-3 py-1 rounded-lg border border-border">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-foreground">
              {address.slice(0, 4)}...{address.slice(-4)}
            </span>
          </div>
          {balance !== null && (
            <div className="flex items-center gap-2 bg-primary/10 px-3 py-1 rounded-lg border border-primary/20">
              <span className="text-sm font-bold text-primary">
                €{balance} EURT
              </span>
            </div>
          )}
          <button
            onClick={disconnect}
            className="px-3 py-1 bg-muted text-muted-foreground rounded-lg text-sm hover:bg-destructive/20 hover:text-destructive transition-all duration-200 border border-border"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <button
          onClick={() => connect()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200 transform hover:scale-105 border border-primary/20 shadow-lg hover:shadow-primary/20"
        >
          Connect Wallet
        </button>
      )}
      {error && (
        <div className="text-destructive text-sm">
          {error.message || String(error)}
        </div>
      )}
    </div>
  );
}
