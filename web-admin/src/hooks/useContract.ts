import { useMemo } from 'react';
import { Connection, SystemProgram, PublicKey } from '@solana/web3.js';
import { BN, Program, AnchorProvider, Idl, utils } from '@coral-xyz/anchor';
import bs58 from 'bs58';
import { Company, Product } from '../types';

import { ABIS, ContractName } from '../lib/contracts/abis';
import { getContractAddress } from '../lib/contracts/addresses';

// Define the structure of the account fetched from Anchor
interface AnchorCompanyAccount {
  publicKey: PublicKey;
  account: Company;
}

interface AnchorProductAccount {
  publicKey: PublicKey;
  account: Product;
}

interface AnchorInvoiceAccount {
  publicKey: PublicKey;
  account: {
    invoiceId: any;
    companyId: any;
    customerAddress: PublicKey;
    totalAmount: any;
    timestamp: any;
    status: any;
    paymentTxHash: string;
    ipfsCid: string;
  };
}

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
        signer && signer.publicKey && signer.signTransaction
          ? signer
          : {
              publicKey: signer?.publicKey || PublicKey.default,
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

      console.log(`[useContract] Iniciando contrato ${contractName} en dirección: ${addressStr}`);

      const contract = {
        program,
        isReadOnly,

        // --- Lectura Optimizada de Empresas ---
        getAllCompanies: async () => {
          try {
            console.log('[useContract] Solicitando todas las empresas...');
            const account = (program.account as any).company || (program.account as any).Company;
            if (!account) throw new Error('Account "company" not found in program');

            // Manual fetch and decode to handle legacy data gracefully
            const programId = program.programId;
            const coder = program.coder.accounts;
            const discriminator =
              (account as any).discriminator || Buffer.from([32, 212, 52, 137, 90, 7, 206, 183]);

            // Note: provider here is the Connection object passed to the hook
            const rawAccounts = await provider.getProgramAccounts(programId, {
              filters: [{ memcmp: { offset: 0, bytes: bs58.encode(discriminator) } }],
            });

            console.log(
              `[useContract] Encontradas ${rawAccounts.length} cuentas de empresas potenciales.`
            );

            const companies: any[] = [];
            for (const { pubkey, account: accountInfo } of rawAccounts) {
              try {
                // Try decoding with potential naming variations
                const decoded =
                  coder.decode('company', accountInfo.data) ||
                  coder.decode('Company', accountInfo.data);
                companies.push({ publicKey: pubkey, account: decoded });
              } catch (decodeError: any) {
                console.warn(
                  `[useContract] Saltando cuenta legacy ${pubkey.toBase58()} (Error decoding: ${decodeError.message})`
                );
              }
            }

            console.log(
              `[useContract] Empresas decodificadas con éxito (${companies.length}):`,
              companies
            );
            return companies.map((c: any) => ({
              ...c.account,
              id: c.publicKey.toBase58(),
              owner: c.account.owner.toBase58(),
              isActive: (c.account as any).isActive ?? (c.account as any).is_active ?? true,
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
            const account = (program.account as any).company || (program.account as any).Company;
            const data = (await account.fetch(pubkey)) as any;
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
            console.log('[useContract] Solicitando todos los productos...');
            const account = (program.account as any).product || (program.account as any).Product;
            if (!account) throw new Error('Account "product" not found in program');

            const coder = program.coder.accounts;
            const discriminator =
              (account as any).discriminator || Buffer.from([102, 76, 55, 251, 38, 73, 224, 229]);

            const rawAccounts = await provider.getProgramAccounts(program.programId, {
              filters: [{ memcmp: { offset: 0, bytes: bs58.encode(discriminator) } }],
            });

            const products: any[] = [];
            for (const { pubkey, account: accountInfo } of rawAccounts) {
              try {
                const decoded =
                  coder.decode('product', accountInfo.data) ||
                  coder.decode('Product', accountInfo.data);
                products.push({ publicKey: pubkey, account: decoded });
              } catch (e: any) {
                console.warn(
                  `[useContract] Saltando producto legacy ${pubkey.toBase58()}: ${e.message}`
                );
              }
            }

            return products.map((p: any) => ({
              ...p.account,
              id: p.publicKey.toBase58(),
              companyId:
                (p.account as any).company_id?.toString() ??
                (p.account as any).companyId?.toString() ??
                (p.account as any).company?.toBase58(),
              price: (p.account as any).price.toString(),
              stock: (p.account as any).stock.toNumber(),
              description: 'Premium quality guaranteed at Solana E-Shop',
              image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
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
            const account = (program.account as any).product || (program.account as any).Product;
            if (!account) throw new Error('Account "product" not found in program');

            const coder = program.coder.accounts;
            const discriminator =
              (account as any).discriminator || Buffer.from([102, 76, 55, 251, 38, 73, 224, 229]);

            const rawAccounts = await provider.getProgramAccounts(program.programId, {
              filters: [
                { memcmp: { offset: 0, bytes: bs58.encode(discriminator) } },
                {
                  memcmp: {
                    offset: 8,
                    bytes: companyPubKey.toBase58(),
                  },
                },
              ],
            });

            const products: any[] = [];
            for (const { pubkey, account: accountInfo } of rawAccounts) {
              try {
                const decoded =
                  coder.decode('product', accountInfo.data) ||
                  coder.decode('Product', accountInfo.data);
                products.push({ publicKey: pubkey, account: decoded });
              } catch (e: any) {
                console.warn(
                  `[useContract] Saltando producto legacy ${pubkey.toBase58()} en getCompanyProducts: ${e.message}`
                );
              }
            }

            return products.map((p: any) => ({
              ...p.account,
              id: p.publicKey.toBase58(),
              companyId:
                (p.account as any).company_id?.toString() ??
                (p.account as any).companyId?.toString() ??
                (p.account as any).company?.toBase58(),
              price: (p.account as any).price.toString(),
              stock: (p.account as any).stock.toNumber(),
              description: 'Premium quality guaranteed at Solana E-Shop',
              image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
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
            const account = (program.account as any).product || (program.account as any).Product;
            const data = (await account.fetch(pubkey)) as any;
            return {
              ...data,
              id: data.id?.toString() ?? pubkey.toBase58(),
              companyId:
                data.companyId?.toString() ??
                data.company_id?.toString() ??
                data.company?.toBase58(),
              price: data.price.toString(),
              stock: data.stock.toNumber(),
              description: 'Premium quality guaranteed at Solana E-Shop',
              image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
              active: true,
            };
          } catch (e) {
            return null;
          }
        },

        // --- Escritura (Requiere Wallet) ---
        registerCompany: async (name: string, description: string) => {
          if (isReadOnly) throw new Error('Wallet not connected');
          const [globalStatePda] = PublicKey.findProgramAddressSync(
            [Buffer.from('global-state')],
            program.programId
          );

          const globalStateAccount =
            (program.account as any).globalState || (program.account as any).GlobalState;
          if (!globalStateAccount) throw new Error('Account "globalState" not found in program');
          const globalStateRaw: any = await globalStateAccount.fetch(globalStatePda);

          const [pda] = PublicKey.findProgramAddressSync(
            [Buffer.from('company'), globalStateRaw.nextCompanyId.toArrayLike(Buffer, 'le', 8)],
            program.programId
          );

          const method = program.methods.registerCompany
            ? program.methods.registerCompany(name, description)
            : (program.methods as any).register_company(name, description);

          const tx = await method
            .accounts({
              globalState: globalStatePda,
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

          const [globalStatePda] = PublicKey.findProgramAddressSync(
            [Buffer.from('global-state')],
            program.programId
          );

          const globalStateAccount =
            (program.account as any).globalState || (program.account as any).GlobalState;
          if (!globalStateAccount) throw new Error('Account "globalState" not found in program');
          const globalStateRaw: any = await globalStateAccount.fetch(globalStatePda);

          const [pda] = PublicKey.findProgramAddressSync(
            [Buffer.from('product'), globalStateRaw.nextProductId.toArrayLike(Buffer, 'le', 8)],
            program.programId
          );

          const method = program.methods.addProduct
            ? program.methods.addProduct(name, new BN(price), new BN(stock))
            : (program.methods as any).add_product(name, new BN(price), new BN(stock));

          const tx = await method
            .accounts({
              globalState: globalStatePda,
              company: companyPubKey,
              product: pda,
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

        getAllInvoices: async () => {
          try {
            console.log('[useContract] Solicitando todas las facturas...');
            const account = (program.account as any).invoice || (program.account as any).Invoice;
            if (!account) throw new Error('Account "invoice" not found in program');

            const coder = program.coder.accounts;
            const discriminator =
              (account as any).discriminator || Buffer.from([51, 194, 250, 114, 6, 104, 18, 164]);

            const rawAccounts = await provider.getProgramAccounts(program.programId, {
              filters: [{ memcmp: { offset: 0, bytes: bs58.encode(discriminator) } }],
            });

            const invoices: any[] = [];
            for (const { pubkey, account: accountInfo } of rawAccounts) {
              try {
                const decoded =
                  coder.decode('invoice', accountInfo.data) ||
                  coder.decode('Invoice', accountInfo.data);
                invoices.push({ publicKey: pubkey, account: decoded });
              } catch (e: any) {
                console.warn(
                  `[useContract] Saltando factura legacy ${pubkey.toBase58()}: ${e.message}`
                );
              }
            }

            return invoices.map((inv: any) => ({
              id: (inv.account.invoice_id ?? inv.account.invoiceId ?? inv.publicKey).toString(),
              companyId: (inv.account.company_id ?? inv.account.companyId).toString(),
              customerAddress: (
                inv.account.customer_address ?? inv.account.customerAddress
              ).toBase58(),
              totalAmount: (
                Number(inv.account.total_amount ?? inv.account.totalAmount) / 1000000
              ).toFixed(2),
              timestamp: new Date(Number(inv.account.timestamp) * 1000),
              isPaid:
                inv.account.status && (!!inv.account.status.Paid || !!inv.account.status.paid),
              paymentTxHash: inv.account.paymentTxHash,
              ipfsCid: inv.account.ipfsCid,
            }));
          } catch (e) {
            console.error('Error fetching all invoices:', e);
            return [];
          }
        },

        getCustomerInvoices: async (customerAddress: string | PublicKey) => {
          try {
            const customerPubKey =
              typeof customerAddress === 'string'
                ? new PublicKey(customerAddress)
                : customerAddress;
            const account = (program.account as any).invoice || (program.account as any).Invoice;
            const invoices = await account.all([
              {
                memcmp: {
                  offset: 8 + 8 + 8, // Discriminator + invoiceId + companyId
                  bytes: customerPubKey.toBase58(),
                },
              },
            ]);
            return invoices.map((inv: any) => ({
              id: (inv.account.invoice_id ?? inv.account.invoiceId ?? inv.publicKey).toString(),
              companyId: (inv.account.company_id ?? inv.account.companyId).toString(),
              customerAddress: (
                inv.account.customer_address ?? inv.account.customerAddress
              ).toBase58(),
              totalAmount: (
                Number(inv.account.total_amount ?? inv.account.totalAmount) / 1000000
              ).toFixed(2),
              timestamp: new Date(Number(inv.account.timestamp) * 1000),
              isPaid:
                inv.account.status && (!!inv.account.status.Paid || !!inv.account.status.paid),
              paymentTxHash: inv.account.paymentTxHash,
              ipfsCid: inv.account.ipfsCid,
            }));
          } catch (e) {
            console.error('Error fetching customer invoices:', e);
            return [];
          }
        },
      };

      return contract;
    } catch (error) {
      console.error(`[useContract] Error:`, error);
      return null;
    }
  }, [contractName, provider, signer, chainId]);
}
