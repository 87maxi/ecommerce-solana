'use client';

import { BrowserProvider, Contract, formatUnits } from 'ethers';
import { useState, useEffect } from 'react';

import { useWallet } from '../hooks/useWallet';
import { getContractAddress } from '../lib/contracts/addresses';
import { useRole } from '../contexts/RoleContext';
import { formatAddress } from '../lib/utils';

const EURO_TOKEN_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
];

export function WalletInfo() {
  const {
    disconnect,
    isConnected,
    address,
    chainId,
  } = useWallet();

  const { roleInfo } = useRole();
  const [euroBalance, setEuroBalance] = useState<string | null>(null);
  const [networkName, setNetworkName] = useState<string>('');

  const handleDisconnect = () => {
    disconnect();
    setEuroBalance(null);
  };

  const fetchBalance = async () => {
    if (!address || !window.ethereum || !chainId) return;

    try {
      const provider = new BrowserProvider(window.ethereum);
      const euroTokenAddress = getContractAddress(chainId, 'EuroToken');

      // Check if contract address exists
      if (!euroTokenAddress) {
        console.warn('EuroToken address not found for chain:', chainId);
        setEuroBalance(null);
        return;
      }

      const contract = new Contract(euroTokenAddress, EURO_TOKEN_ABI, provider);

      // Check if contract exists at address
      const code = await provider.getCode(euroTokenAddress);
      if (code === '0x') {
        console.warn('No contract found at EuroToken address:', euroTokenAddress);
        setEuroBalance(null);
        return;
      }

      const balance = await contract.balanceOf(address);
      const decimals = await contract.decimals();
      const symbol = await contract.symbol();

      const formatted = formatUnits(balance, decimals);
      setEuroBalance(parseFloat(formatted).toFixed(2));
    } catch (err) {
      console.error('Error fetching balance:', err);
      setEuroBalance(null);
    }
  };

  const addTokenToWallet = async () => {
    if (!window.ethereum || !chainId) return;

    try {
      const euroTokenAddress = getContractAddress(chainId, 'EuroToken');
      await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: euroTokenAddress,
            symbol: 'EURT',
            decimals: 18,
          },
        } as any,
      });
    } catch (error) {
      console.error('Error adding token to wallet:', error);
    }
  };

  useEffect(() => {
    if (isConnected && address) {
      fetchBalance();
    }
  }, [isConnected, address, chainId]);

  useEffect(() => {
    if (chainId) {
      switch (chainId) {
        case 1:
          setNetworkName('Ethereum Mainnet');
          break;
        case 31337:
          setNetworkName('Localhost');
          break;
        default:
          setNetworkName(`Red ${chainId}`);
      }
    }
  }, [chainId]);

  if (!isConnected) {
    return null;
  }

  const getRoleText = () => {
    switch (roleInfo.role) {
      case 'admin':
        return 'Administrador';
      case 'company_owner':
        return `Propietario${roleInfo.companyName ? ` de ${roleInfo.companyName}` : ''}`;
      case 'customer':
        return 'Cliente';
      case 'unregistered':
        return 'No registrado';
      default:
        return 'Desconocido';
    }
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-cyan-500/30 shadow-lg shadow-cyan-500/10 p-3">
      <div className="flex flex-col gap-3">
        {/* Wallet Address */}
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 ring-2 ring-cyan-400/40 flex items-center justify-center flex-shrink-0 shadow-lg shadow-cyan-500/30">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-white">
              <path
                fill="currentColor"
                d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z"
              />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-200 truncate">
              {formatAddress(address || '')}
            </p>
          </div>
        </div>

        {/* Network and Role Badges */}
        <div className="flex flex-col gap-1.5">
          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gradient-to-r from-cyan-500/20 to-cyan-600/20 text-cyan-300 border border-cyan-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mr-1.5 animate-pulse"></span>
            {networkName}
          </span>
          <span
            className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${roleInfo.role === 'unregistered'
              ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-300 border border-yellow-500/30'
              : 'bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-300 border border-emerald-500/30'
              }`}
          >
            {roleInfo.role === 'unregistered' && (
              <svg className="w-3 h-3 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            )}
            <span className="truncate">{getRoleText()}</span>
          </span>
        </div>

        {/* Balance */}
        {euroBalance !== null && (
          <div className="bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-lg px-3 py-2.5 border border-purple-500/30 shadow-inner">
            <p className="text-xs text-slate-400 mb-0.5">Balance EURT</p>
            <p className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">{euroBalance}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          <button
            onClick={addTokenToWallet}
            className="w-full px-3 py-2 rounded-lg bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-300 hover:from-cyan-500/30 hover:to-purple-500/30 border border-cyan-500/30 hover:border-cyan-400/50 transition-all duration-200 text-sm font-medium flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/20"
            title="Agregar EURT a Wallet"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            <span>Agregar EURT</span>
          </button>
          <button
            onClick={handleDisconnect}
            className="w-full px-3 py-2 text-sm font-medium rounded-lg bg-gradient-to-r from-red-500/20 to-rose-500/20 text-red-300 hover:from-red-500/30 hover:to-rose-500/30 border border-red-500/30 hover:border-red-400/50 transition-all duration-200 shadow-lg shadow-red-500/10 hover:shadow-red-500/20"
          >
            Desconectar
          </button>
        </div>
      </div>
    </div>
  );
}
