"use client";

import { CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWallet } from "@solana/wallet-adapter-react";
import { useIsMounted } from "@/hooks/useIsMounted";

interface BuyEuroTokenButtonProps {
  redirectUrl?: string;
  className?: string;
}

export function BuyEuroTokenButton({
  redirectUrl,
  className,
}: BuyEuroTokenButtonProps) {
  const isMounted = useIsMounted();
  const { connected, publicKey } = useWallet();
  const compraUrl =
    process.env.NEXT_PUBLIC_COMPRA_STABLECOIN_URL || "http://localhost:3033";

  const handleClick = () => {
    const finalRedirectUrl = redirectUrl || window.location.href;
    const params = new URLSearchParams({
      redirect: finalRedirectUrl,
      amount: "10", // Default amount to buy if not specified
      walletAddress: publicKey?.toString() || "",
    });
    window.location.href = `${compraUrl}?${params.toString()}`;
  };

  if (!isMounted) {
    return (
      <div
        className={cn(
          "w-32 h-9 bg-indigo-600/10 rounded-full animate-pulse",
          className,
        )}
      ></div>
    );
  }

  if (!isMounted) {
    return (
      <button
        disabled
        className={cn(
          "flex items-center gap-2",
          "bg-indigo-600/10 text-indigo-400 border border-indigo-600/20",
          "px-4 py-2 rounded-full text-sm font-medium",
          "opacity-50 cursor-not-allowed",
          className,
        )}
      >
        <CreditCard className="w-4 h-4" />
        Comprar EURT
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={!connected}
      className={cn(
        "flex items-center gap-2",
        "bg-indigo-600/10 text-indigo-400 border border-indigo-600/20",
        "px-4 py-2 rounded-full text-sm font-medium",
        "hover:bg-indigo-600/20 hover:border-indigo-600/30 transition-all duration-200",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className,
      )}
    >
      <CreditCard className="w-4 h-4" />
      Comprar EURT
    </button>
  );
}
