"use client";

import { useState, useEffect, useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";

interface Props {
  onWalletConnected: (address: string) => void;
}

const WalletConnect = ({ onWalletConnected }: Props) => {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const [balance, setBalance] = useState("0.00");
  const [isProcessing, setIsProcessing] = useState(false);

  const walletAddress = publicKey?.toBase58() || "";

  const updateBalance = useCallback(
    async (address: string) => {
      if (!address || !connection) return;

      try {
        const mintAddressStr =
          process.env.NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS;
        if (!mintAddressStr) {
          console.warn(
            "[WalletConnect] NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS not configured",
          );
          return;
        }

        // Defensive validation for PublicKeys to prevent crashes
        let mint: PublicKey;
        let userPubKey: PublicKey;

        try {
          mint = new PublicKey(mintAddressStr);
          userPubKey = new PublicKey(address);
        } catch (e) {
          console.error("[WalletConnect] Invalid public key format:", e);
          return;
        }

        const ata = await getAssociatedTokenAddress(mint, userPubKey);

        try {
          const balanceInfo = await connection.getTokenAccountBalance(ata);
          setBalance(balanceInfo.value.uiAmountString || "0.00");
        } catch (e: any) {
          // If ATA doesn't exist (account not found), balance is effectively 0
          if (
            e.message?.includes("could not find account") ||
            e.code === -32602
          ) {
            setBalance("0.00");
          } else {
            console.error("[WalletConnect] RPC error fetching balance:", e);
          }
        }
      } catch (error) {
        console.error(
          "[WalletConnect] Unexpected error in updateBalance:",
          error,
        );
        setBalance("0.00");
      }
    },
    [connection],
  );

  const handleContinue = async () => {
    if (isProcessing || !walletAddress) return;
    setIsProcessing(true);
    try {
      await onWalletConnected(walletAddress);
    } catch (error) {
      console.error("[WalletConnect] Error notifying parent:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (connected && walletAddress) {
      updateBalance(walletAddress);
      onWalletConnected(walletAddress);
    } else {
      setBalance("0.00");
    }
  }, [connected, walletAddress, updateBalance, onWalletConnected]);

  return (
    <div className="space-y-4">
      <div className="bg-slate-900/50 rounded-2xl p-1 border border-slate-700/50 backdrop-blur-sm">
        {!connected ? (
          <div className="p-4">
            <p className="text-sm text-slate-400 text-center mb-4">
              Conecta tu wallet de Solana para proceder con la compra de EURT.
            </p>
            <div className="flex justify-center">
              <WalletMultiButton className="!bg-gradient-to-r !from-indigo-600 !to-purple-600 hover:!from-indigo-500 hover:!to-purple-500 !text-white !shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:!shadow-[0_0_30px_rgba(99,102,241,0.5)] !transition-all !duration-300 !py-6 !px-8 !rounded-xl !font-bold !text-lg !transform hover:!-translate-y-0.5 !w-full !justify-center" />
            </div>
          </div>
        ) : (
          <div className="bg-slate-800/80 rounded-xl p-5 border border-slate-700/50 space-y-4">
            {/* Wallet Address Section */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    ></path>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-0.5">
                    Wallet Conectada
                  </p>
                  <p className="text-white font-mono font-bold tracking-wide text-sm truncate">
                    {walletAddress.slice(0, 8)}...{walletAddress.slice(-8)}
                  </p>
                </div>
              </div>
              <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 bg-emerald-900/20 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Solana
              </span>
            </div>

            {/* EURT Balance Section */}
            <div className="bg-gradient-to-br from-emerald-900/20 to-cyan-900/20 rounded-xl p-4 border border-emerald-500/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-emerald-300 font-medium uppercase tracking-wider">
                    Balance EURT
                  </p>
                  <button
                    onClick={() => updateBalance(walletAddress)}
                    className="p-1 hover:bg-emerald-500/10 rounded-lg transition-colors group"
                    title="Actualizar balance"
                  >
                    <svg
                      className="w-4 h-4 text-emerald-400 group-hover:rotate-180 transition-transform duration-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      ></path>
                    </svg>
                  </button>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="font-mono font-bold text-3xl text-emerald-400">
                    {balance}
                  </p>
                  <span className="text-emerald-300 font-medium text-lg">
                    EURT
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <WalletMultiButton className="!bg-slate-700/50 hover:!bg-slate-700 !text-xs !text-slate-300 !py-2 !px-4 !rounded-lg !h-auto !w-full !justify-center !border !border-slate-600/50" />
            </div>
          </div>
        )}
      </div>

      {/* Continue button when wallet is already connected */}
      {connected && (
        <button
          onClick={handleContinue}
          disabled={isProcessing}
          className={`w-full group relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] transition-all duration-300 py-4 px-6 rounded-xl font-bold text-lg transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${isProcessing ? "opacity-70 cursor-wait" : ""}`}
        >
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 skew-y-12"></div>
          <div className="relative flex items-center justify-center space-x-3">
            {isProcessing ? (
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
              <span>Continuar al Pago</span>
            )}
            {!isProcessing && (
              <svg
                className="w-5 h-5 opacity-70 group-hover:translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            )}
          </div>
        </button>
      )}
    </div>
  );
};

export default WalletConnect;
