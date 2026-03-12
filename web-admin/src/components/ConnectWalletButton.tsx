'use client';

import { useWallet } from '../hooks/useWallet';

export function ConnectWalletButton() {
    const { connect, connecting, error } = useWallet();

    const walletInfo = {
        provider: 'metamask' as const,
        info: {
            label: 'Ethereum Wallet',
            icon: 'https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg',
        },
    };

    const handleConnect = async () => {
        console.log('Connecting wallet...');
        try {
            await connect(walletInfo);
            console.log('Wallet connected successfully');
        } catch (err) {
            console.error('Failed to connect wallet:', err);
        }
    };

    return (
        <div className="w-full space-y-4">
            <button
                onClick={handleConnect}
                disabled={connecting}
                className="w-full flex items-center justify-center px-6 py-3 border border-cyan-500/30 text-base font-medium rounded-xl shadow-lg shadow-cyan-500/20 text-white bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-cyan-500/40"
            >
                {connecting ? (
                    <>
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
                        Conectando...
                    </>
                ) : (
                    <>
                        <svg
                            className="w-5 h-5 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                            />
                        </svg>
                        Conectar Wallet
                    </>
                )}
            </button>

            {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg backdrop-blur-sm">
                    <div className="flex items-start">
                        <svg
                            className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                        >
                            <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                clipRule="evenodd"
                            />
                        </svg>
                        <div className="ml-3 flex-1">
                            <p className="text-sm text-red-300 font-medium">Error de conexión</p>
                            <p className="text-xs text-red-400 mt-1">{error.message}</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="text-center">
                <p className="text-xs text-slate-400">
                    Compatible con MetaMask, Rabby y otras wallets Ethereum
                </p>
                <div className="flex gap-2 justify-center mt-2">
                    <a
                        href="https://metamask.io/download/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-cyan-400 hover:text-cyan-300 underline transition-colors"
                    >
                        MetaMask
                    </a>
                    <span className="text-xs text-slate-600">•</span>
                    <a
                        href="https://rabby.io/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-cyan-400 hover:text-cyan-300 underline transition-colors"
                    >
                        Rabby
                    </a>
                </div>
            </div>
        </div>
    );
}
