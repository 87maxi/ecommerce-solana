"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";

interface Props {
    onWalletConnected: (address: string) => void;
}

const MetaMaskConnect = ({ onWalletConnected }: Props) => {
    const [isConnected, setIsConnected] = useState(false);
    const [walletAddress, setWalletAddress] = useState("");

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
                onWalletConnected(address);
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

    return (
        <div className="bg-card rounded-xl p-6 shadow-md mb-6 border border-border">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground flex items-center">
                    <svg
                        className="w-5 h-5 mr-2 text-primary"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        ></path>
                    </svg>
                    Conectar Billetera
                </h3>
            </div>
            {!isConnected ? (
                <button
                    onClick={connectWallet}
                    className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground py-3 px-6 rounded-lg font-medium hover:opacity-90 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                    <div className="flex items-center justify-center space-x-2">
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            ></path>
                        </svg>
                        <span>Conectar MetaMask</span>
                    </div>
                </button>
            ) : (
                <div>
                    <div className="space-y-1">
                        <p className="text-green-600 font-medium flex items-center">
                            <svg
                                className="w-4 h-4 mr-1.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M5 13l4 4L19 7"
                                ></path>
                            </svg>
                            Conectado: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MetaMaskConnect;
