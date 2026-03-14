import { useMemo } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider, Idl, setProvider } from '@coral-xyz/anchor';

import { ABIS, ContractName } from '../lib/contracts/abis';
import { getContractAddress } from '../lib/contracts/addresses';

export function useContract(
  contractName: ContractName,
  provider: Connection | null,
  signer: any | null,
  chainId: number | null
): any | null {
  return useMemo(() => {
    // In the Solana refactor:
    // 'provider' acts as the Solana Connection
    // 'signer' acts as the Wallet Adapter interface
    if (!provider || !signer || !signer.publicKey) return null;

    try {
      // Create the Anchor Provider using the Connection and Wallet
      const anchorProvider = new AnchorProvider(provider, signer, AnchorProvider.defaultOptions());

      // We still use getContractAddress, but it should now return a base58 Program ID
      const addressStr = getContractAddress(chainId || 1337, contractName);
      if (!addressStr) {
        console.warn(`Program ID for ${contractName} not found.`);
        return null;
      }

      // ABIS are now effectively Anchor IDLs
      const rawIdl = ABIS[contractName];
      if (!rawIdl) {
        console.warn(`IDL for ${contractName} not found.`);
        return null;
      }

      // Inject the program ID into the IDL structure to initialize the Program correctly
      const idl = { ...rawIdl, address: addressStr } as Idl;

      // Initialize the Anchor Program
      const program = new Program(idl, anchorProvider);

      // Create a mocked interface that simulates the old ethers.Contract methods
      // so the UI doesn't break during the transition to Solana.
      const mockedContract = {
        program,

        // --- Mocked Ecommerce Methods ---
        getAllCompanies: async () => {
          console.log('[Mock] getAllCompanies called');
          return [];
        },
        getCompany: async (id: any) => {
          console.log(`[Mock] getCompany called for id ${id}`);
          return {
            id: typeof id === 'bigint' ? id : BigInt(id),
            owner: signer.publicKey.toBase58(),
            name: 'Solana Mock Company',
            description: 'A mocked company for Solana transition',
            isActive: true,
            createdAt: BigInt(Math.floor(Date.now() / 1000)),
          };
        },
        registerCompany: async (address: string, name: string, description: string) => {
          console.log(`[Mock] registerCompany called with`, { address, name, description });
          return {
            wait: async () => {
              console.log('[Mock] registerCompany tx confirmed');
              return true;
            },
          };
        },
        owner: async () => {
          console.log('[Mock] owner called');
          // Mock current user as admin to allow UI access
          return signer.publicKey.toBase58();
        },
        isCustomerRegistered: async (address: string) => {
          console.log(`[Mock] isCustomerRegistered called for ${address}`);
          return true;
        },
        getCustomer: async (address: string) => {
          console.log(`[Mock] getCustomer called for ${address}`);
          return {
            isRegistered: true,
            customerAddress: address,
          };
        },
        getAllProducts: async () => {
          console.log('[Mock] getAllProducts called');
          return [];
        },
        getProduct: async (id: any) => {
          console.log(`[Mock] getProduct called for ${id}`);
          return null;
        },

        // --- Mocked EuroToken Methods ---
        balanceOf: async (address: string) => {
          console.log(`[Mock] balanceOf called for ${address}`);
          return 0n;
        },
        decimals: async () => {
          console.log('[Mock] decimals called');
          return 6; // EuroToken has 6 decimals
        },
        symbol: async () => {
          console.log('[Mock] symbol called');
          return 'EURT';
        },
      };

      return mockedContract;
    } catch (error) {
      console.error(`Error loading Anchor program ${contractName}:`, error);
      return null;
    }
  }, [contractName, provider, signer, chainId]);
}
