'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import EuroTokenABI from '@/lib/EuroTokenABI';
import { getContractAddress } from '@/lib/contracts/addresses';
import { useWallet } from './useWallet';

export function useEuroTokenBalance() {
  const [balance, setBalance] = useState<string>('0');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { provider, account } = useWallet();

  useEffect(() => {
    const fetchBalance = async () => {
      if (!provider || !account) {
        setBalance('0');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Get the EuroToken contract address from the addresses file
        const euroTokenAddress = getContractAddress(31337, 'EuroToken');

        // Create contract instance
        const euroTokenContract = new ethers.Contract(
          euroTokenAddress,
          EuroTokenABI,
          provider
        );

        // Get the balance
        const balanceWei = await euroTokenContract.balanceOf(account);
        const balanceFormatted = ethers.utils.formatUnits(balanceWei, 6); // 6 decimals for EURT

        setBalance(balanceFormatted);
      } catch (err) {
        console.error('Error fetching balance:', err);
        setError('Failed to fetch EURT balance');
        setBalance('0');
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();
  }, [provider, account]);

  return { balance, loading, error };
}