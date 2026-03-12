"use client";

import { useState, useEffect } from 'react';
import { ethers } from "ethers";

declare global {
    interface Window {
        ethereum?: any;
    }
}

interface Props {
    onWalletConnected: (address: string) => void;
}

const MetaMaskConnect = ({ onWalletConnected }: Props) => {
    const [isConnected, setIsConnected] = useState(false);
    const [walletAddress, setWalletAddress] = useState("");
    const [balance, setBalance] = useState("0");
    const [isConnecting, setIsConnecting] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const connectWallet = async () => {
        if (isConnecting) return;

        if (!window.ethereum) {
            console.warn("MetaMask no detectado. Abriendo página de instalación.");
            window.open("https://metamask.io/download.html", "_blank");
            return;
        }

        setIsConnecting(true);
        try {
            const accounts = await window.ethereum.request({
                method: "eth_requestAccounts",
            });

            if (accounts.length > 0) {
                const address = accounts[0];
                setWalletAddress(address);
                setIsConnected(true);

                // Call parent callback
                setIsProcessing(true);
                await onWalletConnected(address);
                setIsProcessing(false);

                await updateBalance(address);
            }
        } catch (error) {
            console.error("Error al conectar con MetaMask:", error);
        } finally {
            setIsConnecting(false);
        }
    };

    const handleContinue = async () => {
        if (isProcessing) return;
        setIsProcessing(true);
        try {
            await onWalletConnected(walletAddress);
        } catch (error) {
            console.error("Error continuing:", error);
        } finally {
            setIsProcessing(false);
        }
    };

    const updateBalance = async (address: string) => {
        try {
            const pasarelaUrl = process.env.NEXT_PUBLIC_PASARELA_PAGO_URL || 'http://localhost:3034';
            const response = await fetch(`${pasarelaUrl}/api/balance/${address}`);

            if (response.ok) {
                const data = await response.json();
                setBalance(data.balance);
            } else {
                console.error("Error fetching balance:", await response.text());
                setBalance("0");
            }
        } catch (error) {
            console.error("Error al obtener saldo:", error);
            setBalance("0");
        }
    };

    const addTokenToWallet = async () => {
        if (!window.ethereum) return;

        try {
            const tokenAddress = process.env.NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS;
            if (!tokenAddress) {
                console.error("Contract address not found");
                return;
            }

            await window.ethereum.request({
                method: 'wallet_watchAsset',
                params: {
                    type: 'ERC20',
                    options: {
                        address: tokenAddress,
                        symbol: 'EURT',
                        decimals: 6, // EuroToken uses 6 decimals
                    },
                },
            });
        } catch (error) {
            console.error('Error adding token to wallet:', error);
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
                    await updateBalance(address);
                }
            }
        };
        checkIfConnected();
    }, []);

    return (
        <div className="space-y-4">
            <div className="bg-slate-900/50 rounded-2xl p-1 border border-slate-700/50 backdrop-blur-sm">
                {!isConnected ? (
                    <button
                        onClick={connectWallet}
                        disabled={isConnecting}
                        className={`w-full group relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] transition-all duration-300 py-4 px-6 rounded-xl font-bold text-lg transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${isConnecting ? 'opacity-70 cursor-wait' : ''}`}
                    >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 skew-y-12"></div>
                        <div className="relative flex items-center justify-center space-x-3">
                            {isConnecting ? (
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                </svg>
                            )}
                            <span>{isConnecting ? 'Conectando...' : 'Conectar Wallet'}</span>
                            {!isConnecting && (
                                <svg className="w-5 h-5 opacity-70 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
                                </svg>
                            )}
                        </div>
                    </button>
                ) : (
                    <div className="bg-slate-800/80 rounded-xl p-5 border border-slate-700/50 space-y-4">
                        {/* Wallet Address Section */}
                        <div className="flex items-center justify-between pb-4 border-b border-slate-700/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-0.5">Wallet Conectada</p>
                                    <p className="text-white font-mono font-bold tracking-wide text-sm">
                                        {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                                    </p>
                                </div>
                            </div>
                            <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 bg-emerald-900/20 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                Online
                            </span>
                        </div>

                        {/* EURT Balance Section - Prominente */}
                        <div className="bg-gradient-to-br from-emerald-900/20 to-cyan-900/20 rounded-xl p-4 border border-emerald-500/20 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl"></div>
                            <div className="relative">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-xs text-emerald-300 font-medium uppercase tracking-wider">Balance EURT</p>
                                    <button
                                        onClick={() => updateBalance(walletAddress)}
                                        className="p-1 hover:bg-emerald-500/10 rounded-lg transition-colors group"
                                        title="Actualizar balance"
                                    >
                                        <svg className="w-4 h-4 text-emerald-400 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                                        </svg>
                                    </button>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <p className={`font-mono font-bold text-3xl ${parseFloat(balance) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                        {parseFloat(balance) >= 0 ? balance : "0"}
                                    </p>
                                    <span className="text-emerald-300 font-medium text-lg">EURT</span>
                                </div>
                                {parseFloat(balance) > 0 && (
                                    <p className="text-xs text-emerald-400/60 mt-1">
                                        ≈ €{parseFloat(balance).toFixed(2)} EUR
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                            <button
                                onClick={addTokenToWallet}
                                className="flex-1 flex items-center justify-center gap-2 text-sm text-indigo-300 hover:text-indigo-200 hover:bg-indigo-900/30 transition-all bg-indigo-900/20 px-3 py-2 rounded-lg border border-indigo-500/20"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                                </svg>
                                Agregar a Wallet
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Continue button when wallet is already connected */}
            {isConnected && (
                <button
                    onClick={handleContinue}
                    disabled={isProcessing}
                    className={`w-full group relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] transition-all duration-300 py-4 px-6 rounded-xl font-bold text-lg transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${isProcessing ? 'opacity-70 cursor-wait' : ''}`}
                >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 skew-y-12"></div>
                    <div className="relative flex items-center justify-center space-x-3">
                        {isProcessing ? (
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <span>Continuar al Pago</span>
                        )}
                        {!isProcessing && (
                            <svg className="w-5 h-5 opacity-70 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        )}
                    </div>
                </button>
            )}
        </div>
    );
};

export default MetaMaskConnect;