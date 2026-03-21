"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { Program, AnchorProvider, Idl, BN } from "@coral-xyz/anchor";
import { Buffer } from "buffer";
import bs58 from "bs58";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import {
  getAssociatedTokenAddress,
  createTransferCheckedInstruction,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";
import EcommerceABI from "@/contracts/abis/EcommerceABI.json";

// --- Configuration & Constants ---
const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS ||
    "5vC8pVqZguD8NB4qrrULXkXoN5ebfdsZLitYLmqpJAQj",
);

const EURT_MINT = new PublicKey(
  process.env.NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS ||
    process.env.NEXT_PUBLIC_EUROTOKEN_MINT ||
    "AKWdemYgbmSujB1jTMm8q6q3fKTtcxr5XXp8tSSoDekC",
);

const DEFAULT_MERCHANT = new PublicKey(
  process.env.NEXT_PUBLIC_MERCHANT_ADDRESS ||
    "7eCTmt5LYSqnjgw8jebHjUzf8X7omxEpxYHbsXsmPtZQ",
);

const SEEDS = {
  CUSTOMER: Buffer.from("customer"),
  CART: Buffer.from("shopping-cart"),
  GLOBAL_STATE: Buffer.from("global-state"),
  INVOICE: Buffer.from("invoice"),
  PRODUCT: Buffer.from("product"),
};

// --- Helper Functions ---
const findPDA = (seeds: (Buffer | Uint8Array)[], programId: PublicKey) => {
  return PublicKey.findProgramAddressSync(seeds, programId);
};

/**
 * Main Hook for interacting with the Solana Ecommerce Smart Contract.
 * Refactored for efficiency, atomic transactions, and better organization.
 */
export function useContract() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, signTransaction, signAllTransactions } =
    useWallet();
  const [program, setProgram] = useState<Program | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // 1. Program Initialization
  useEffect(() => {
    if (!connection) return;

    const setupProgram = async () => {
      try {
        const providerSigner =
          publicKey && signTransaction && signAllTransactions
            ? { publicKey, signTransaction, signAllTransactions }
            : {
                publicKey: new PublicKey("11111111111111111111111111111111"),
                signTransaction: async (tx: any) => tx,
                signAllTransactions: async (txs: any) => txs,
              };

        const provider = new AnchorProvider(
          connection,
          providerSigner as any,
          AnchorProvider.defaultOptions(),
        );

        const idl = {
          ...(EcommerceABI as any),
          address: PROGRAM_ID.toBase58(),
        } as Idl;
        const ecommerceProgram = new Program(idl, provider);

        setProgram(ecommerceProgram);
        setIsInitialized(true);
      } catch (error) {
        console.error("[useContract] Initialization error:", error);
      }
    };

    setupProgram();
  }, [connection, publicKey, signTransaction, signAllTransactions]);

  // 2. Transaction Executor (Atomic & Robust)
  const executeTransaction = useCallback(
    async (instructions: TransactionInstruction[], description: string) => {
      if (!publicKey || !connection) {
        throw new Error("Wallet not connected");
      }

      try {
        console.log(
          `[useContract] Executing atomic transaction: ${description}`,
        );
        const transaction = new Transaction().add(...instructions);

        const { blockhash, lastValidBlockHeight } =
          await connection.getLatestBlockhash("confirmed");
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = publicKey;

        let signature: string;

        // Intentamos usar signTransaction + sendRawTransaction para evitar errores de "Plugin Closed"
        // que ocurren frecuentemente con sendTransaction en algunas wallets como Backpack o Phantom
        if (signTransaction) {
          console.log("[useContract] Signing transaction manually...");
          const signedTx = await signTransaction(transaction);
          console.log("[useContract] Sending raw transaction...");
          signature = await connection.sendRawTransaction(
            signedTx.serialize(),
            {
              skipPreflight: true,
              preflightCommitment: "confirmed",
            },
          );
        } else if (sendTransaction) {
          console.log(
            "[useContract] signTransaction not available, using sendTransaction...",
          );
          signature = await sendTransaction(transaction, connection, {
            skipPreflight: true,
            preflightCommitment: "confirmed",
          });
        } else {
          throw new Error("No hay un método de firma disponible");
        }

        console.log(
          `[useContract] Transaction sent: ${signature}. Waiting for confirmation...`,
        );

        await connection.confirmTransaction(
          { signature, blockhash, lastValidBlockHeight },
          "confirmed",
        );

        console.log(`[useContract] Transaction successful: ${description}`);
        return signature;
      } catch (error: any) {
        console.error(`[useContract] Error in ${description}:`, error);

        const errorMsg = error.message || "";
        if (
          errorMsg.includes("Plugin Closed") ||
          errorMsg.includes("User rejected")
        ) {
          throw new Error(
            "La billetera cerró la conexión o rechazó la transacción. Por favor, asegúrate de que tu wallet esté abierta e intenta de nuevo.",
          );
        }
        throw error;
      }
    },
    [publicKey, connection, sendTransaction, signTransaction],
  );

  // 3. Customer Identity Helpers
  const getRegisterCustomerInstruction =
    useCallback(async (): Promise<TransactionInstruction | null> => {
      if (!program || !publicKey) return null;

      const [customerPda] = findPDA(
        [SEEDS.CUSTOMER, publicKey.toBuffer()],
        program.programId,
      );
      const customerAccount =
        (program.account as any).customer || (program.account as any).Customer;

      try {
        await customerAccount.fetch(customerPda);
        return null; // Already registered
      } catch {
        console.log("[useContract] Preparing registration instruction...");
        const method = program.methods.registerCustomer
          ? program.methods.registerCustomer()
          : (program.methods as any).register_customer();

        return await method
          .accounts({
            customer: customerPda,
            user: publicKey,
            systemProgram: SystemProgram.programId,
          } as any)
          .instruction();
      }
    }, [program, publicKey]);

  // 4. Products API
  const getAllProducts = useCallback(async () => {
    if (!program) return [];
    try {
      const productAccount =
        (program.account as any).product || (program.account as any).Product;
      const rawAccounts = await productAccount.all();

      return rawAccounts.map((p: any) => ({
        ...p.account,
        id: p.account.id?.toString() ?? p.publicKey.toBase58(),
        publicKey: p.publicKey.toBase58(),
        companyId:
          (p.account.companyId || p.account.company_id)?.toString() ||
          "Unknown",
        name: p.account.name,
        price: (Number(p.account.price) / 1000000).toFixed(2),
        stock: Number(p.account.stock),
        description: p.account.description || "Premium quality product",
        image:
          p.account.image ||
          "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800",
        active: p.account.is_active ?? p.account.isActive ?? true,
      }));
    } catch (error) {
      console.error("[useContract] Error fetching products:", error);
      return [];
    }
  }, [program]);

  // 5. Cart Management API
  const getCart = useCallback(async () => {
    if (!program || !publicKey) return [];
    try {
      const [cartPda] = findPDA(
        [SEEDS.CART, publicKey.toBuffer()],
        program.programId,
      );
      const cartAccount =
        (program.account as any).shoppingCart ||
        (program.account as any).ShoppingCart;
      const data = await cartAccount.fetch(cartPda);

      return data.items.map((item: any) => ({
        productId: (item.product_id ?? item.productId).toString(),
        quantity: Number(item.quantity),
      }));
    } catch {
      return []; // Return empty if cart PDA doesn't exist yet
    }
  }, [program, publicKey]);

  const addToCart = useCallback(
    async (productId: string, quantity: number) => {
      if (!program || !publicKey) return false;
      try {
        const [cartPda] = findPDA(
          [SEEDS.CART, publicKey.toBuffer()],
          program.programId,
        );
        const method = program.methods.addToCart
          ? program.methods.addToCart(new BN(productId), new BN(quantity))
          : (program.methods as any).add_to_cart(
              new BN(productId),
              new BN(quantity),
            );

        const ix = await method
          .accounts({
            cart: cartPda,
            user: publicKey,
            systemProgram: SystemProgram.programId,
          } as any)
          .instruction();

        await executeTransaction([ix], "Add item to cart");
        window.dispatchEvent(new Event("cart-updated"));
        return true;
      } catch {
        return false;
      }
    },
    [program, publicKey, executeTransaction],
  );

  const removeFromCart = useCallback(
    async (productId: string) => {
      if (!program || !publicKey) return false;
      try {
        const [cartPda] = findPDA(
          [SEEDS.CART, publicKey.toBuffer()],
          program.programId,
        );
        const method = program.methods.removeFromCart
          ? program.methods.removeFromCart(new BN(productId))
          : (program.methods as any).remove_from_cart(new BN(productId));

        const ix = await method
          .accounts({
            cart: cartPda,
            user: publicKey,
            systemProgram: SystemProgram.programId,
          } as any)
          .instruction();

        await executeTransaction([ix], "Remove item from cart");
        window.dispatchEvent(new Event("cart-updated"));
        return true;
      } catch {
        return false;
      }
    },
    [program, publicKey, executeTransaction],
  );

  const updateQuantity = useCallback(
    async (productId: string, quantity: number) => {
      if (!program || !publicKey) return false;
      try {
        const [cartPda] = findPDA(
          [SEEDS.CART, publicKey.toBuffer()],
          program.programId,
        );
        const method = program.methods.updateQuantity
          ? program.methods.updateQuantity(new BN(productId), new BN(quantity))
          : (program.methods as any).update_quantity(
              new BN(productId),
              new BN(quantity),
            );

        const ix = await method
          .accounts({
            cart: cartPda,
            user: publicKey,
            systemProgram: SystemProgram.programId,
          } as any)
          .instruction();

        await executeTransaction([ix], "Update item quantity");
        window.dispatchEvent(new Event("cart-updated"));
        return true;
      } catch {
        return false;
      }
    },
    [program, publicKey, executeTransaction],
  );

  const clearCart = useCallback(async () => {
    if (!program || !publicKey) return false;
    try {
      const [cartPda] = findPDA(
        [SEEDS.CART, publicKey.toBuffer()],
        program.programId,
      );
      const method = program.methods.clearCart
        ? program.methods.clearCart()
        : (program.methods as any).clear_cart();
      const ix = await method
        .accounts({
          cart: cartPda,
          user: publicKey,
          systemProgram: SystemProgram.programId,
        } as any)
        .instruction();
      await executeTransaction([ix], "Clear cart");
      window.dispatchEvent(new Event("cart-updated"));
      return true;
    } catch {
      return false;
    }
  }, [program, publicKey, executeTransaction]);

  // 6. Payment & Invoicing API
  const processPayment = useCallback(
    async (merchantAddress: string, amount: string) => {
      if (!publicKey || !connection || !program) return null;

      try {
        let merchantPubKey = new PublicKey(merchantAddress || DEFAULT_MERCHANT);
        if (merchantPubKey.equals(publicKey)) {
          console.warn(
            "[useContract] Merchant is the same as the user. Sending to dev wallet for test.",
          );
          merchantPubKey = new PublicKey("11111111111111111111111111111111");
        }

        const instructions: TransactionInstruction[] = [];

        // A. Atomic Registration (If needed)
        const regIx = await getRegisterCustomerInstruction();
        if (regIx) instructions.push(regIx);

        // B. SPL Token Preparation (ATA)
        const userAta = await getAssociatedTokenAddress(EURT_MINT, publicKey);
        const merchantAta = await getAssociatedTokenAddress(
          EURT_MINT,
          merchantPubKey,
        );

        const merchantAtaInfo = await connection.getAccountInfo(merchantAta);
        if (!merchantAtaInfo) {
          instructions.push(
            createAssociatedTokenAccountInstruction(
              publicKey,
              merchantAta,
              merchantPubKey,
              EURT_MINT,
            ),
          );
        }

        // C. Transfer Instruction
        const decimals = 6;
        const amountInUnits = BigInt(
          Math.round(parseFloat(amount) * Math.pow(10, decimals)),
        );
        instructions.push(
          createTransferCheckedInstruction(
            userAta,
            EURT_MINT,
            merchantAta,
            publicKey,
            amountInUnits,
            decimals,
          ),
        );

        const signature = await executeTransaction(
          instructions,
          "Atomic Payment (Transfer + Register)",
        );
        window.dispatchEvent(new Event("refresh-eurt-balance"));

        return { signature, error: null };
      } catch (error: any) {
        return { signature: null, error: error.message };
      }
    },
    [
      publicKey,
      connection,
      program,
      executeTransaction,
      getRegisterCustomerInstruction,
    ],
  );

  const createInvoice = useCallback(
    async (
      companyId: string,
      totalAmount: string,
      paymentTxHash: string,
      ipfsCid: string,
    ) => {
      if (!program || !publicKey) return null;

      try {
        const instructions: TransactionInstruction[] = [];
        const [globalStatePda] = findPDA(
          [SEEDS.GLOBAL_STATE],
          program.programId,
        );
        const globalStateAccount =
          (program.account as any).globalState ||
          (program.account as any).GlobalState;
        const state = await globalStateAccount.fetch(globalStatePda);

        const [invoicePda] = findPDA(
          [SEEDS.INVOICE, state.nextInvoiceId.toArrayLike(Buffer, "le", 8)],
          program.programId,
        );
        const [cartPda] = findPDA(
          [SEEDS.CART, publicKey.toBuffer()],
          program.programId,
        );
        const [customerPda] = findPDA(
          [SEEDS.CUSTOMER, publicKey.toBuffer()],
          program.programId,
        );

        const totalBN = new BN(Math.round(parseFloat(totalAmount) * 1000000));

        // A. Instruction: Create Invoice
        instructions.push(
          await program.methods
            .createInvoice(new BN(companyId), totalBN, ipfsCid)
            .accounts({
              globalState: globalStatePda,
              invoice: invoicePda,
              cart: cartPda,
              user: publicKey,
              systemProgram: SystemProgram.programId,
            } as any)
            .instruction(),
        );

        // B. Instruction: Link Payment Hash On-chain
        const processMethod =
          program.methods.processPayment ||
          (program.methods as any).process_payment;
        instructions.push(
          await processMethod(paymentTxHash)
            .accounts({
              invoice: invoicePda,
              customer: customerPda,
              authority: publicKey,
            } as any)
            .instruction(),
        );

        return await executeTransaction(
          instructions,
          "Atomic Invoice Creation & Payment Link",
        );
      } catch (error) {
        console.error("[useContract] CreateInvoice error:", error);
        return null;
      }
    },
    [program, publicKey, executeTransaction],
  );

  const getCustomerInvoices = useCallback(
    async (customerAddress: string) => {
      if (!program) return [];
      try {
        const invoiceAccount =
          (program.account as any).invoice || (program.account as any).Invoice;
        const allInvoices = await invoiceAccount.all([
          { memcmp: { offset: 8 + 8 + 8, bytes: customerAddress } },
        ]);

        return allInvoices.map((inv: any) => ({
          ...inv.account,
          id: (inv.account.invoice_id ?? inv.account.invoiceId).toString(),
          companyId: (
            inv.account.company_id ?? inv.account.companyId
          ).toString(),
          customerAddress: (
            inv.account.customer_address ?? inv.account.customerAddress
          ).toBase58(),
          totalAmount: (
            Number(inv.account.total_amount ?? inv.account.totalAmount) /
            1000000
          ).toFixed(2),
          timestamp: new Date(
            Number(inv.account.timestamp) * 1000,
          ).toLocaleString(),
          isPaid:
            inv.account.status &&
            (!!inv.account.status.Paid || !!inv.account.status.paid),
          publicKey: inv.publicKey.toBase58(),
        }));
      } catch {
        return [];
      }
    },
    [program],
  );

  // 7. Legacy & Helper methods for backward compatibility
  const calculateTotal = useCallback(async () => {
    const items = await getCart();
    const products = await getAllProducts();
    const total = items.reduce((acc, item) => {
      const p = products.find((prod) => prod.id === item.productId);
      return acc + (p ? parseFloat(p.price) * item.quantity : 0);
    }, 0);
    return total.toFixed(2);
  }, [getCart, getAllProducts]);

  const getCartItemCount = useCallback(async () => {
    const items = await getCart();
    return items.reduce((acc, item) => acc + item.quantity, 0);
  }, [getCart]);

  const contract = useMemo(() => {
    if (!program) return null;
    return {
      ...program,
      getInvoice: async () => null,
      isCustomerRegistered: async () => true,
      getCustomer: async () => ({
        isRegistered: true,
        customerAddress: publicKey?.toBase58(),
      }),
      owner: async () => DEFAULT_MERCHANT.toBase58(),
    };
  }, [program, publicKey]);

  return {
    contract,
    account: publicKey?.toBase58() || null,
    getAllProducts,
    getCart,
    addToCart,
    removeFromCart,
    updateQuantity,
    calculateTotal,
    createInvoice,
    clearCart,
    getCustomerInvoices,
    getCartItemCount,
    getInvoice: async () => null,
    checkAndRegisterCustomer: async () => true, // Automated in processPayment
    processPayment,
  };
}
