'use client';

import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useContract } from '../hooks/useContract';

interface ContractContextType {
  ecommerceContract: any | null;
  signer: any | null;
}

const ContractContext = createContext<ContractContextType | undefined>(undefined);

export function ContractProvider({ children }: { children: ReactNode }) {
  const { publicKey, signTransaction, signAllTransactions } = useWallet();
  const { connection } = useConnection();

  const signer = useMemo(
    () =>
      publicKey && signTransaction && signAllTransactions
        ? { publicKey, signTransaction, signAllTransactions }
        : null,
    [publicKey, signTransaction, signAllTransactions]
  );

  const ecommerceContract = useContract('Ecommerce', connection, signer, null);

  const value = useMemo(
    () => ({
      ecommerceContract,
      signer,
    }),
    [ecommerceContract, signer]
  );

  return <ContractContext.Provider value={value}>{children}</ContractContext.Provider>;
}

export function useGlobalContract() {
  const context = useContext(ContractContext);
  if (context === undefined) {
    throw new Error('useGlobalContract must be used within a ContractProvider');
  }
  return context;
}
