"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { cn } from "@/lib/utils";

// Make sure to import the styles, typically done in your provider or layout
// import '@solana/wallet-adapter-react-ui/styles.css';

export default function WalletConnectHeader() {
  const { connected } = useWallet();

  return (
    <div className="flex items-center">
      <div
        className={cn(
          "[&_.wallet-adapter-button]:!bg-primary [&_.wallet-adapter-button]:!text-primary-foreground [&_.wallet-adapter-button]:!rounded-xl [&_.wallet-adapter-button]:!font-semibold [&_.wallet-adapter-button]:!px-5 [&_.wallet-adapter-button]:!h-10",
          "[&_.wallet-adapter-button:hover]:!bg-primary/90 [&_.wallet-adapter-button]:!transition-all [&_.wallet-adapter-button]:!duration-200",
          "transform hover:scale-105 shadow-lg shadow-primary/20",
          connected
            ? "[&_.wallet-adapter-button]:!bg-secondary [&_.wallet-adapter-button]:!text-secondary-foreground hover:[&_.wallet-adapter-button]:!bg-secondary/80 shadow-none hover:scale-100"
            : "",
        )}
      >
        <WalletMultiButton>
          {connected ? "Connected" : "Connect Wallet"}
        </WalletMultiButton>
      </div>
    </div>
  );
}
