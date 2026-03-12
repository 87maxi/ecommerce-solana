'use client';

import { useEffect, useState } from "react";
import { useEuroTokenBalance } from '@/hooks/useEuroTokenBalance';
import { Wallet, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const WalletConnectHeader = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [walletAddress, setWalletAddress] = useState("");
    const { balance, loading, error } = useEuroTokenBalance();

    const connectWallet = async () => {
        if (!window.ethereum) {
            console.warn("MetaMask no detectado. Abriendo página de instalación.");
            window.open("https://metamask.io/download.html", "_blank");
            return;
        }

        try {
            const accounts = await window.ethereum.request({
                method: "eth_requestAccounts",
            });

            if (accounts.length > 0) {
                const address = accounts[0];
                setWalletAddress(address);
                setIsConnected(true);
            }
        } catch (error) {
            console.error("Error al conectar con MetaMask:", error);
        }
    };

    useEffect(() => {
        const checkIfConnected = async () => {
            if (window.ethereum) {
                const accounts = await window.ethereum.request({
                    method: "eth_accounts",
                });
                if (accounts.length > 0) {
                    const address = accounts[0];
                    setWalletAddress(address);
                    setIsConnected(true);
                }
            }
        };
        checkIfConnected();
    }, []);

    if (!isConnected) {
        return (
            <button
                onClick={connectWallet}
                className={cn(
                    "flex items-center gap-2 bg-primary text-primary-foreground",
                    "py-2 px-4 rounded-full font-medium text-sm",
                    "hover:opacity-90 transition-all duration-200",
                    "shadow-lg shadow-primary/25 hover:shadow-primary/40"
                )}
            >
                <Wallet className="w-4 h-4" />
                Conectar Wallet
            </button>
        );
    }

    return (
        <div className="flex items-center gap-3">
            <div className={cn(
                "hidden md:flex items-center gap-2",
                "bg-secondary/50 backdrop-blur-sm border border-border/50",
                "rounded-full px-4 py-1.5 transition-all duration-200",
                "hover:bg-secondary/70 hover:border-border"
            )}>
                {loading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                ) : error ? (
                    <AlertCircle className="w-3.5 h-3.5 text-destructive" />
                ) : (
                    <span className="text-sm font-medium text-foreground">
                        {balance} <span className="text-muted-foreground text-xs ml-0.5">EURT</span>
                    </span>
                )}
            </div>

            <div className={cn(
                "flex items-center gap-2",
                "bg-card border border-border",
                "rounded-full pl-2 pr-4 py-1.5",
                "shadow-sm"
            )}>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs font-medium text-muted-foreground font-mono">
                    {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                </span>
            </div>
        </div>
    );
};

export default WalletConnectHeader;