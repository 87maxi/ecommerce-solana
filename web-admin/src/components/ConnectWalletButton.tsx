'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export function ConnectWalletButton() {
  const { connected } = useWallet();

  return (
    <div className="w-full flex flex-col items-center justify-center space-y-4">
      <WalletMultiButton className="!bg-gradient-to-r !from-cyan-500 !to-purple-600 hover:!from-cyan-400 hover:!to-purple-500 !text-white !font-bold !rounded-xl !shadow-lg !shadow-cyan-500/30 transition-all duration-300 transform hover:-translate-y-0.5 !w-full !justify-center !py-3 !h-auto" />

      {!connected && (
        <div className="text-center">
          <p className="text-xs text-slate-400">Conecta tu wallet de Solana para continuar</p>
          <div className="flex gap-3 justify-center mt-2">
            <a
              href="https://phantom.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-cyan-400 hover:text-cyan-300 underline transition-colors"
            >
              Phantom
            </a>
            <span className="text-xs text-slate-600">•</span>
            <a
              href="https://backpack.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-cyan-400 hover:text-cyan-300 underline transition-colors"
            >
              Backpack
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
