import { useMemo } from 'react';
import { Connection, PublicKey, SystemProgram } from '@solana/web3.js';
import { Program, AnchorProvider, Idl, BN } from '@coral-xyz/anchor';

import { ABIS, ContractName } from '../lib/contracts/abis';
import { getContractAddress } from '../lib/contracts/addresses';

/**
 * Hook de contrato optimizado para Solana.
 */
export function useContract(
  contractName: ContractName,
  provider: Connection | null,
  signer: any | null,
  chainId: number | null
): any | null {
  return useMemo(() => {
    if (!provider) return null;

    try {
      // Configuramos un firmante de respaldo para modo lectura si no hay wallet
      const effectiveSigner =
        signer && signer.publicKey
          ? signer
          : {
              publicKey: PublicKey.default,
              signTransaction: async (tx: any) => tx,
              signAllTransactions: async (txs: any[]) => txs,
            };

      const anchorProvider = new AnchorProvider(provider, effectiveSigner, {
        preflightCommitment: 'confirmed',
        commitment: 'confirmed',
      });

      const addressStr = getContractAddress(chainId || 1337, contractName);
      const rawIdl = ABIS[contractName];

      if (!addressStr || !rawIdl) return null;

      const idl = { ...rawIdl, address: addressStr } as Idl;
      const program = new Program(idl, anchorProvider);
      const isReadOnly = !signer?.publicKey;

      const contract = {
        program,
        isReadOnly,

        // --- Lectura Optimizada de Empresas ---
        getAllCompanies: async () => {
          try {
            // Una sola llamada RPC para traer todos los datos de todas las empresas
            const companies = await program.account.company.all();
            return companies.map(c => ({
              ...c.account,
              id: c.publicKey.toBase58(),
              owner: c.account.owner.toBase58(),
              active: (c.account as any).isActive ?? (c.account as any).is_active ?? true,
              createdAt:
                (c.account as any).createdAt?.toString() ||
                Math.floor(Date.now() / 1000).toString(),
            }));
          } catch (e) {
            console.error('Error fetching all companies:', e);
            return [];
          }
        },

        getCompany: async (id: string | PublicKey) => {
          try {
            const pubkey = typeof id === 'string' ? new PublicKey(id) : id;
            const data = (await program.account.company.fetch(pubkey)) as any;
            return {
              ...data,
              id: pubkey.toBase58(),
              owner: data.owner.toBase58(),
              active: data.isActive ?? data.is_active ?? true,
            };
          } catch (e) {
            return null;
          }
        },

        // --- Lectura Optimizada de Productos ---
        getAllProducts: async () => {
          try {
            // Trae todos los productos del sistema de una vez
            const products = await program.account.product.all();
            return products.map(p => ({
              ...p.account,
              id: p.publicKey.toBase58(),
              companyId: (p.account as any).company.toBase58(),
              price: (p.account as any).price.toString(),
              stock: (p.account as any).stock.toNumber(),
              active: true,
            }));
          } catch (e) {
            console.error('Error fetching all products:', e);
            return [];
          }
        },

        getCompanyProducts: async (companyId: string | PublicKey) => {
          try {
            const companyPubKey =
              typeof companyId === 'string' ? new PublicKey(companyId) : companyId;

            // FILTRO NATIVO: Usamos memcmp para traer solo productos de ESTA empresa
            // El campo 'company' está justo después del discriminador (8 bytes)
            const products = await program.account.product.all([
              {
                memcmp: {
                  offset: 8,
                  bytes: companyPubKey.toBase58(),
                },
              },
            ]);

            return products.map(p => ({
              ...p.account,
              id: p.publicKey.toBase58(),
              companyId: (p.account as any).company.toBase58(),
              price: (p.account as any).price.toString(),
              stock: (p.account as any).stock.toNumber(),
              active: true,
            }));
          } catch (e) {
            console.error('Error in getCompanyProducts:', e);
            return [];
          }
        },

        getProduct: async (id: string | PublicKey) => {
          try {
            const pubkey = typeof id === 'string' ? new PublicKey(id) : id;
            const data = (await program.account.product.fetch(pubkey)) as any;
            return {
              ...data,
              id: pubkey.toBase58(),
              companyId: data.company.toBase58(),
              price: data.price.toString(),
              stock: data.stock.toNumber(),
              active: true,
            };
          } catch (e) {
            return null;
          }
        },

        // --- Escritura (Requiere Wallet) ---
        registerCompany: async (name: string, description: string) => {
          if (isReadOnly) throw new Error('Wallet not connected');
          const [pda] = PublicKey.findProgramAddressSync(
            [Buffer.from('company'), signer.publicKey.toBuffer()],
            program.programId
          );

          const tx = await program.methods
            .registerCompany(name, description)
            .accounts({
              company: pda,
              owner: signer.publicKey,
              systemProgram: SystemProgram.programId,
            } as any)
            .rpc();

          return {
            hash: tx,
            wait: async () => {
              const latest = await provider.getLatestBlockhash();
              await provider.confirmTransaction({ signature: tx, ...latest }, 'confirmed');
              return true;
            },
          };
        },

        addProduct: async (
          companyId: any,
          name: string,
          description: string,
          price: any,
          stock: any
        ) => {
          if (isReadOnly) throw new Error('Wallet not connected');
          const companyPubKey =
            typeof companyId === 'string' ? new PublicKey(companyId) : companyId;
          const [pda] = PublicKey.findProgramAddressSync(
            [Buffer.from('product'), companyPubKey.toBuffer(), Buffer.from(name)],
            program.programId
          );

          const tx = await program.methods
            .addProduct(name, new BN(price), new BN(stock))
            .accounts({
              product: pda,
              company: companyPubKey,
              owner: signer.publicKey,
              systemProgram: SystemProgram.programId,
            } as any)
            .rpc();

          return {
            hash: tx,
            wait: async () => {
              const latest = await provider.getLatestBlockhash();
              await provider.confirmTransaction({ signature: tx, ...latest }, 'confirmed');
              return true;
            },
          };
        },

        createProduct: async (cid: any, n: string, d: string, p: any, s: any) =>
          contract.addProduct(cid, n, d, p, s),

        owner: async () => (signer?.publicKey ? signer.publicKey.toBase58() : null),
        isCustomerRegistered: async (address: string) => false,
        getCustomer: async (address: string) => null,
      };

      return contract;
    } catch (error) {
      console.error(`[useContract] Error:`, error);
      return null;
    }
  }, [contractName, provider, signer, chainId]);
}
