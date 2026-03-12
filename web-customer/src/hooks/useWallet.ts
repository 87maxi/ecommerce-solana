'use client';

import { useState, useEffect, useRef } from 'react';
import { ethers } from 'ethers';

export function useWallet() {
  const [isConnected, setIsConnected] = useState(false);
  const [chainId, setChainId] = useState<string | null>(null);
  const [account, setAccount] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const isProviderInitialized = useRef(false);

  const connectWallet = async () => {
    if (!window.ethereum) {
      setError('Please install MetaMask!');
      return;
    }

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      }) as string[];

      setAccount(accounts[0]);
      setIsConnected(true);
      setError(null);
    } catch (err) {
      console.error('Connection error:', err);
      setError('Failed to connect wallet');
    }
  };

  const disconnectWallet = () => {
    setAccount('');
    setIsConnected(false);
  };

  // Check if wallet is already connected
  useEffect(() => {
    // Prevent multiple initializations using ref
    if (isProviderInitialized.current) {
      return;
    }

    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          console.log('[useWallet] Initializing provider (should only happen once)...');
          // Initialize provider once
          const web3Provider = new ethers.providers.Web3Provider(window.ethereum as any);
          setProvider(web3Provider);
          isProviderInitialized.current = true;

          const accounts = await window.ethereum.request({
            method: 'eth_accounts'
          }) as string[];

          if (accounts.length > 0) {
            setAccount(accounts[0]);
            setIsConnected(true);
          }
        } catch (err) {
          console.error('Error checking connection:', err);
        }
      }
    };

    checkConnection();

    // Listen for account changes
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        setIsConnected(true);
      } else {
        disconnectWallet();
      }
    };

    // Network change handler
    const handleChainChanged = (newChainId: string) => {
      setChainId(newChainId);
    };

    if (window.ethereum) {
      window.ethereum.on?.('chainChanged', handleChainChanged);
      window.ethereum.on?.('accountsChanged', handleAccountsChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener?.('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener?.('chainChanged', handleChainChanged);
      }
    };
  }, []);

  return {
    isConnected,
    account,
    chainId,
    error,
    connectWallet,
    disconnectWallet,
    provider
  };
}