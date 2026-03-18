import { useMemo } from 'react';
import { Connection, SystemProgram, PublicKey } from '@solana/web3.js';
import { BN, Program, AnchorProvider, Idl } from '@coral-xyz/anchor';
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
 * Proporciona acceso a funciones de lectura y escritura del smart contract.
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

            const companies = await account.all();

            return companies.map((c: any) => ({
              ...c.account,
              id: c.publicKey.toBase58(), // Usamos la PublicKey para el ID de navegación/routing
              numericId: c.account.id?.toString() || '0', // Guardamos el ID secuencial lógico
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
            let pubkey: PublicKey;

            // Si el ID es puramente numérico, es un ID secuencial y necesitamos derivar la PDA
            if (typeof id === 'string' && /^\d+$/.test(id)) {
              const companyIdBN = new BN(id);
              [pubkey] = PublicKey.findProgramAddressSync(
                [Buffer.from('company'), companyIdBN.toArrayLike(Buffer, 'le', 8)],
                program.programId
              );
            } else {
              // De lo contrario, asumimos que ya es una PublicKey válida (en string o objeto)
              pubkey = typeof id === 'string' ? new PublicKey(id) : id;
            }

            const account = (program.account as any).company || (program.account as any).Company;
            const data = (await account.fetch(pubkey)) as any;
            return {
              ...data,
              id: pubkey.toBase58(),
              numericId: data.id?.toString() || '0',
              owner: data.owner.toBase58(),
              active: data.isActive ?? data.is_active ?? true,
              isActive: data.isActive ?? data.is_active ?? true,
            };
          } catch (e) {
            console.error('[useContract] Error en getCompany:', e);
            return null;
          }
        },

        // --- Lectura Optimizada de Productos ---
        getAllProducts: async () => {
          try {
            console.log('[useContract] Solicitando todos los productos...');
            const account = (program.account as any).product || (program.account as any).Product;
            if (!account) throw new Error('Account "product" not found in program');

            const products = await account.all();

            return products.map((p: any) => ({
              ...p.account,
              id: p.account.id?.toString() || '0',
              publicKey: p.publicKey.toBase58(),
              companyId: (p.account.company_id ?? p.account.companyId)?.toString() || '0',
              price: p.account.price?.toString() || '0',
              stock: p.account.stock?.toNumber
                ? p.account.stock.toNumber()
                : Number(p.account.stock || 0),
              description: p.account.description || 'Premium quality guaranteed at Solana E-Shop',
              image:
                p.account.image ||
                'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
              active: p.account.is_active ?? p.account.isActive ?? true,
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
              id: p.account.id?.toString() || '0',
              publicKey: p.publicKey.toBase58(),
              companyId: (p.account.company_id ?? p.account.companyId)?.toString() || '0',
              price: p.account.price?.toString() || '0',
              stock: p.account.stock?.toNumber
                ? p.account.stock.toNumber()
                : Number(p.account.stock || 0),
              description: p.account.description || 'Premium quality guaranteed at Solana E-Shop',
              image:
                p.account.image ||
                'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
              active: p.account.is_active ?? p.account.isActive ?? true,
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
              id: pubkey.toBase58(),
              numericId: data.id?.toString() || '0',
              companyId:
                data.companyId?.toString() ??
                data.company_id?.toString() ??
                data.company?.toBase58(),
              price: data.price.toString(),
              stock: data.stock.toNumber(),
              description: data.description || 'Premium quality guaranteed at Solana E-Shop',
              image:
                data.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
              active: data.is_active ?? data.isActive ?? true,
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

        updateCompany: async (id: string | PublicKey, name: string, description: string) => {
          if (isReadOnly) throw new Error('Wallet not connected');
          const pubkey = typeof id === 'string' ? new PublicKey(id) : id;

          const method = program.methods.updateCompany
            ? program.methods.updateCompany(name, description)
            : (program.methods as any).update_company(name, description);

          const tx = await method
            .accounts({
              company: pubkey,
              owner: signer.publicKey,
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
            ? program.methods.addProduct(name, description, new BN(price), new BN(stock))
            : (program.methods as any).add_product(name, description, new BN(price), new BN(stock));

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

        updateProduct: async (
          id: string | PublicKey,
          companyId: string | PublicKey,
          name: string,
          description: string,
          price: any,
          stock: any
        ) => {
          if (isReadOnly) throw new Error('Wallet not connected');
          // En este contrato, id y companyId son numéricos (u64).
          // Debemos derivar las PDAs correspondientes usando los seeds.
          // Ensure we are working with BN for numeric IDs and avoid "Invalid character" error
          const productIdBN =
            (typeof id === 'string' && /^\d+$/.test(id)) || typeof id === 'number'
              ? new BN(id)
              : id instanceof BN
                ? id
                : null;

          const companyIdBN =
            (typeof companyId === 'string' && /^\d+$/.test(companyId)) ||
            typeof companyId === 'number'
              ? new BN(companyId)
              : companyId instanceof BN
                ? companyId
                : null;

          if (!productIdBN || !companyIdBN) {
            throw new Error(
              `ID de producto (${id}) o empresa (${companyId}) inválido. Deben ser numéricos.`
            );
          }

          const [productPda] = PublicKey.findProgramAddressSync(
            [Buffer.from('product'), productIdBN.toArrayLike(Buffer, 'le', 8)],
            program.programId
          );

          const [companyPda] = PublicKey.findProgramAddressSync(
            [Buffer.from('company'), companyIdBN.toArrayLike(Buffer, 'le', 8)],
            program.programId
          );

          const method = program.methods.updateProduct
            ? program.methods.updateProduct(name, description, new BN(price), new BN(stock))
            : (program.methods as any).update_product(
                name,
                description,
                new BN(price),
                new BN(stock)
              );

          const tx = await method
            .accounts({
              company: companyPda,
              product: productPda,
              owner: signer.publicKey,
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

        toggleProductStatus: async (id: any) => {
          if (isReadOnly) throw new Error('Wallet not connected');
          const productIdBN =
            (typeof id === 'string' && /^\d+$/.test(id)) || typeof id === 'number'
              ? new BN(id)
              : id instanceof BN
                ? id
                : null;

          if (!productIdBN) {
            throw new Error(`ID de producto (${id}) inválido. Debe ser numérico.`);
          }

          const [productPda] = PublicKey.findProgramAddressSync(
            [Buffer.from('product'), productIdBN.toArrayLike(Buffer, 'le', 8)],
            program.programId
          );

          const method = program.methods.toggleProductStatus
            ? program.methods.toggleProductStatus()
            : (program.methods as any).toggle_product_status();

          // We need the company PDA to satisfy the UpdateProductStatus account requirements
          // We fetch the product account to get its company_id
          const productAccount = await (program.account as any).product.fetch(productPda);
          const [companyPda] = PublicKey.findProgramAddressSync(
            [Buffer.from('company'), productAccount.companyId.toArrayLike(Buffer, 'le', 8)],
            program.programId
          );

          const tx = await method
            .accounts({
              company: companyPda,
              product: productPda,
              owner: signer.publicKey,
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

        deleteProduct: async (id: string | PublicKey) => {
          // Placeholder for delete functionality
          return { hash: '', wait: async () => true };
        },

        createProduct: async (cid: any, n: string, d: string, p: any, s: any) =>
          (contract as any).addProduct(cid, n, d, p, s),

        owner: async () => (signer?.publicKey ? signer.publicKey.toBase58() : null),
        isCustomerRegistered: async (address: string) => false,
        getCustomer: async (address: string) => null,

        getAllInvoices: async () => {
          try {
            console.log('[useContract] Solicitando todas las facturas...');
            const account = (program.account as any).invoice || (program.account as any).Invoice;
            if (!account) throw new Error('Account "invoice" not found in program');

            const invoices = await account.all();

            return invoices.map((inv: any) => ({
              id: inv.publicKey.toBase58(),
              numericId: (inv.account.invoice_id ?? inv.account.invoiceId)?.toString(),
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
              id: inv.publicKey.toBase58(),
              numericId: (inv.account.invoice_id ?? inv.account.invoiceId)?.toString(),
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
