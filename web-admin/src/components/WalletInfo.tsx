'use client';

import { useState, useEffect } from 'react';
import { PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress } from '@solana/spl-token';

import { useWallet } from '../hooks/useWallet';
import { useRole } from '../contexts/RoleContext';
import { formatAddress } from '../lib/utils';
import { getContractAddress } from '../lib/contracts/addresses';

export function WalletInfo() {
  const { disconnect, isConnected, address, chainId, provider } = useWallet();

  const { roleInfo } = useRole();
  const [balance, setBalance] = useState<string>('0');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchBalance = async () => {
      if (!address || !provider) {
        if (isMounted) setBalance('0');
        return;
      }

      try {
        const mintAddressStr = getContractAddress(chainId || 1337, 'EuroToken');

        if (!mintAddressStr) {
          throw new Error('No se encontró la dirección del EuroToken');
        }

        const mint = new PublicKey(mintAddressStr);
        const userPubKey = new PublicKey(address);

        const ata = await getAssociatedTokenAddress(mint, userPubKey);

        try {
          const balanceInfo = await provider.getTokenAccountBalance(ata);
          if (isMounted) {
            setBalance(balanceInfo.value.uiAmountString || '0');
          }
        } catch (e) {
          // Si el ATA no existe, el balance es 0
          if (isMounted) {
            setBalance('0');
          }
        }
      } catch (error) {
        console.error('Error al obtener balance:', error);
        if (isMounted) setBalance('0');
      }
    };

    fetchBalance();

    const intervalId = setInterval(fetchBalance, 10000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [address, chainId, provider]);

  const handleCopyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  if (!isConnected || !address) return null;

  return (
    <div className="relative">
      <div
        className="flex items-center space-x-3 bg-slate-800/50 hover:bg-slate-700/50 border border-cyan-500/30 rounded-full px-4 py-2 cursor-pointer transition-all duration-200"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
      >
        <div className="flex flex-col items-end">
          <div className="text-sm font-medium text-white flex items-center">
            {Number(balance).toFixed(2)} <span className="text-cyan-400 ml-1">EURT</span>
          </div>
          <div className="text-xs text-slate-400 flex items-center">
            {formatAddress(address)}
            <svg
              className={`w-4 h-4 ml-1 transition-transform duration-200 ${
                isDropdownOpen ? 'transform rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
        <div className="h-8 w-8 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-cyan-500/20">
          {address.substring(0, 2).toUpperCase()}
        </div>
      </div>

      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-slate-800 border border-cyan-500/20 rounded-xl shadow-xl overflow-hidden z-50 animate-fade-in-up">
          <div className="p-4 border-b border-slate-700/50">
            <p className="text-xs text-slate-400 mb-1">Conectado como</p>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-white font-mono">{formatAddress(address)}</p>
              <button
                onClick={handleCopyAddress}
                className="text-slate-400 hover:text-cyan-400 transition-colors p-1"
                title="Copiar dirección"
              >
                {isCopied ? (
                  <svg
                    className="w-4 h-4 text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                )}
              </button>
            </div>
            {roleInfo.role !== 'loading' && (
              <div className="mt-2 inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-slate-700 text-slate-300">
                Rol:{' '}
                <span className="ml-1 capitalize text-white">
                  {roleInfo.role.replace('_', ' ')}
                </span>
              </div>
            )}
          </div>

          <div className="p-2">
            <button
              onClick={() => {
                disconnect();
                setIsDropdownOpen(false);
              }}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span>Desconectar</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
