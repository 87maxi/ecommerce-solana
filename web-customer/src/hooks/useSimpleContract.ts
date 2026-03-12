'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import EcommerceABI from '@/contracts/abis/EcommerceABI.json';
import { useWallet } from './useWallet';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS || '';

export function useSimpleContract() {
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const { provider, account } = useWallet();
  const [signer, setSigner] = useState<ethers.Signer | null>(null);

  useEffect(() => {
    if (!provider || !account) {
      return;
    }

    const initContract = async () => {
      try {
        const web3Signer = provider.getSigner();
        setSigner(web3Signer);

        const ecommerceContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          EcommerceABI,
          web3Signer
        );

        setContract(ecommerceContract);
      } catch (error) {
        console.error('[useSimpleContract] Error initializing contract:', error);
      }
    };

    initContract();
  }, [provider, account]);

  return { contract, provider, signer };
}