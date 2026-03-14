"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Connection, PublicKey, SystemProgram } from "@solana/web3.js";
import { Program, AnchorProvider, Idl, BN } from "@coral-xyz/anchor";
import { Buffer } from "buffer";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import EcommerceABI from "@/contracts/abis/EcommerceABI.json";

const PROGRAM_ID = process.env.NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS || "";

export function useContract() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const walletAddress = publicKey?.toBase58();

  const [program, setProgram] = useState<Program | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const initializationAttempted = useRef(false);

  // Stable signer object for AnchorProvider
  const signer = useMemo(() => (publicKey ? { publicKey } : null), [publicKey]);

  // Initialize the Anchor Program
  useEffect(() => {
    let isMounted = true;

    if (
      isInitialized ||
      !connection ||
      !walletAddress ||
      !signer ||
      initializationAttempted.current
    ) {
      return;
    }

    const initProgram = async () => {
      initializationAttempted.current = true;
      try {
        console.log("[useContract] Initializing Anchor program...");

        const anchorProvider = new AnchorProvider(
          connection,
          signer as any,
          AnchorProvider.defaultOptions(),
        );

        if (!PROGRAM_ID) {
          console.error(
            "[useContract] Program ID not found in environment variables.",
          );
          return;
        }

        const idl = { ...(EcommerceABI as any), address: PROGRAM_ID } as Idl;
        const ecommerceProgram = new Program(idl, anchorProvider);

        if (isMounted) {
          setAccount(walletAddress);
          setProgram(ecommerceProgram);
          setIsInitialized(true);
          console.log("[useContract] Program initialized successfully.");
        }
      } catch (error) {
        console.error("[useContract] Error initializing program:", error);
        if (isMounted) setIsInitialized(false);
      }
    };

    initProgram();

    return () => {
      isMounted = false;
    };
  }, [connection, walletAddress, signer, isInitialized]);

  // Reset state if wallet changes
  useEffect(() => {
    initializationAttempted.current = false;
    setIsInitialized(false);
    setProgram(null);
  }, [walletAddress]);

  const checkAndRegisterCustomer = useCallback(async (): Promise<boolean> => {
    if (!program || !publicKey) return false;

    try {
      const [customerPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("customer"), publicKey.toBuffer()],
        program.programId,
      );

      try {
        const customerAccount =
          await program.account.customer.fetch(customerPda);
        if (customerAccount && (customerAccount as any).isRegistered) {
          return true;
        }
      } catch (e) {
        // Account doesn't exist, proceed to register
      }

      console.log("[useContract] Registering customer...");
      await program.methods
        .registerCustomer()
        .accounts({
          customer: customerPda,
          user: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return true;
    } catch (error) {
      console.error("[useContract] Error in checkAndRegisterCustomer:", error);
      return false;
    }
  }, [program, publicKey]);

  const getAllProducts = useCallback(async () => {
    if (!program) return [];

    try {
      const [globalStatePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("global_state")],
        program.programId,
      );
      const globalState =
        await program.account.globalState.fetch(globalStatePda);
      const productCount = (globalState as any).nextProductId.toNumber();

      if (productCount <= 1) return [];

      const products = [];
      for (let i = 1; i < productCount; i++) {
        try {
          const [productPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("product"), new BN(i).toBuffer("le", 8)],
            program.programId,
          );
          const product = await program.account.product.fetch(productPda);

          if (product && (product as any).isActive) {
            products.push({
              id: (product as any).id.toNumber(),
              companyId: (product as any).companyId.toNumber(),
              name: (product as any).name,
              description: (product as any).description,
              price: ((product as any).price.toNumber() / 100).toFixed(2),
              stock: (product as any).stock.toNumber(),
              image: (product as any).image,
              active: (product as any).isActive,
            });
          }
        } catch (err) {
          console.warn(`[useContract] Could not fetch product ${i}`, err);
        }
      }
      return products;
    } catch (error) {
      console.error("[useContract] Error fetching products:", error);
      return [];
    }
  }, [program]);

  const getCart = useCallback(async () => {
    if (!program || !publicKey) return [];

    try {
      const [cartPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("cart"), publicKey.toBuffer()],
        program.programId,
      );
      const cartAccount = await program.account.shoppingCart.fetch(cartPda);

      return (cartAccount as any).items.map((item: any) => ({
        productId: item.productId.toNumber(),
        quantity: item.quantity.toNumber(),
      }));
    } catch (error) {
      return [];
    }
  }, [program, publicKey]);

  const addToCart = useCallback(
    async (productId: number, quantity: number) => {
      if (!program || !publicKey) return false;
      try {
        const [cartPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("cart"), publicKey.toBuffer()],
          program.programId,
        );

        await program.methods
          .addToCart(new BN(productId), new BN(quantity))
          .accounts({
            cart: cartPda,
            user: publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();

        return true;
      } catch (error) {
        console.error("[useContract] Error adding to cart:", error);
        return false;
      }
    },
    [program, publicKey],
  );

  const removeFromCart = useCallback(
    async (productId: number) => {
      if (!program || !publicKey) return false;
      try {
        const [cartPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("cart"), publicKey.toBuffer()],
          program.programId,
        );

        await program.methods
          .removeFromCart(new BN(productId))
          .accounts({
            cart: cartPda,
            user: publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();

        return true;
      } catch (error) {
        console.error("[useContract] Error removing from cart:", error);
        return false;
      }
    },
    [program, publicKey],
  );

  const updateQuantity = useCallback(
    async (productId: number, quantity: number) => {
      if (!program || !publicKey) return false;
      try {
        const [cartPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("cart"), publicKey.toBuffer()],
          program.programId,
        );

        await program.methods
          .updateQuantity(new BN(productId), new BN(quantity))
          .accounts({
            cart: cartPda,
            user: publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();

        return true;
      } catch (error) {
        console.error("[useContract] Error updating quantity:", error);
        return false;
      }
    },
    [program, publicKey],
  );

  const calculateTotal = useCallback(async () => {
    if (!program || !publicKey) return "0.00";

    try {
      const cartItems = await getCart();
      if (cartItems.length === 0) return "0.00";

      let total = 0;
      for (const item of cartItems) {
        try {
          const [productPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("product"), new BN(item.productId).toBuffer("le", 8)],
            program.programId,
          );
          const product = await program.account.product.fetch(productPda);
          total += (product as any).price.toNumber() * item.quantity;
        } catch (err) {
          console.warn(
            `[useContract] Calculation error for product ${item.productId}`,
            err,
          );
        }
      }

      return (total / 100).toFixed(2);
    } catch (error) {
      console.error("[useContract] Error calculating total:", error);
      return "0.00";
    }
  }, [program, publicKey, getCart]);

  const createInvoice = useCallback(
    async (companyId: number) => {
      if (!program || !publicKey) return null;

      try {
        const totalString = await calculateTotal();
        const totalAmountInCents = Math.round(parseFloat(totalString) * 100);

        if (totalAmountInCents <= 0) return null;

        const [globalStatePda] = PublicKey.findProgramAddressSync(
          [Buffer.from("global_state")],
          program.programId,
        );
        const globalState =
          await program.account.globalState.fetch(globalStatePda);
        const nextInvoiceId = (globalState as any).nextInvoiceId;

        const [invoicePda] = PublicKey.findProgramAddressSync(
          [Buffer.from("invoice"), nextInvoiceId.toBuffer("le", 8)],
          program.programId,
        );

        const [cartPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("cart"), publicKey.toBuffer()],
          program.programId,
        );

        await program.methods
          .createInvoice(new BN(companyId), new BN(totalAmountInCents))
          .accounts({
            globalState: globalStatePda,
            invoice: invoicePda,
            cart: cartPda,
            user: publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();

        return nextInvoiceId.toNumber();
      } catch (error) {
        console.error("[useContract] Error creating invoice:", error);
        return null;
      }
    },
    [program, publicKey, calculateTotal],
  );

  const clearCart = useCallback(async () => {
    if (!program || !publicKey) return false;
    try {
      const [cartPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("cart"), publicKey.toBuffer()],
        program.programId,
      );

      await program.methods
        .clearCart()
        .accounts({
          cart: cartPda,
          user: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return true;
    } catch (error) {
      console.error("[useContract] Error clearing cart:", error);
      return false;
    }
  }, [program, publicKey]);

  const getCustomerInvoices = useCallback(
    async (customerAddress: string) => {
      if (!program) return [];

      try {
        const [globalStatePda] = PublicKey.findProgramAddressSync(
          [Buffer.from("global_state")],
          program.programId,
        );
        const globalState =
          await program.account.globalState.fetch(globalStatePda);
        const invoiceCount = (globalState as any).nextInvoiceId.toNumber();

        if (invoiceCount <= 1) return [];

        const customerPublicKey = new PublicKey(customerAddress);
        const invoices = [];
        for (let i = 1; i < invoiceCount; i++) {
          try {
            const [invoicePda] = PublicKey.findProgramAddressSync(
              [Buffer.from("invoice"), new BN(i).toBuffer("le", 8)],
              program.programId,
            );
            const invoice = await program.account.invoice.fetch(invoicePda);

            if ((invoice as any).customerAddress.equals(customerPublicKey)) {
              invoices.push({
                invoiceId: (invoice as any).invoiceId.toNumber(),
                companyId: (invoice as any).companyId.toNumber(),
                customerAddress: (invoice as any).customerAddress.toBase58(),
                totalAmount: (
                  (invoice as any).totalAmount.toNumber() / 100
                ).toFixed(2),
                timestamp: (invoice as any).timestamp.toNumber(),
                isPaid: !!(invoice as any).status.paid,
                paymentTxHash: (invoice as any).paymentTxHash,
              });
            }
          } catch (err) {
            console.warn(`[useContract] Could not fetch invoice ${i}`, err);
          }
        }
        return invoices;
      } catch (error) {
        console.error("[useContract] Error fetching invoices:", error);
        return [];
      }
    },
    [program],
  );

  const getCartItemCount = useCallback(async () => {
    if (!program || !publicKey) return 0;
    try {
      const items = await getCart();
      return items.reduce((acc: number, item: any) => acc + item.quantity, 0);
    } catch (error) {
      return 0;
    }
  }, [program, publicKey, getCart]);

  const getInvoice = useCallback(
    async (invoiceId: any) => {
      if (!program) return null;
      try {
        const id = new BN(invoiceId);
        const [invoicePda] = PublicKey.findProgramAddressSync(
          [Buffer.from("invoice"), id.toBuffer("le", 8)],
          program.programId,
        );
        const invoice = await program.account.invoice.fetch(invoicePda);

        if (invoice) {
          return {
            invoiceId: (invoice as any).invoiceId.toNumber(),
            companyId: (invoice as any).companyId.toNumber(),
            customerAddress: (invoice as any).customerAddress.toBase58(),
            totalAmount: (invoice as any).totalAmount, // BN in cents
            timestamp: (invoice as any).timestamp.toNumber(),
            isPaid: !!(invoice as any).status.paid,
            paymentTxHash: (invoice as any).paymentTxHash,
          };
        }
        return null;
      } catch (error) {
        console.error(
          `[useContract] Error getting invoice ${invoiceId}:`,
          error,
        );
        return null;
      }
    },
    [program],
  );

  const contract = useMemo(() => {
    if (!program) return null;
    return {
      ...program,
      getInvoice,
      isCustomerRegistered: async () => {
        if (!program || !publicKey) return false;
        try {
          const [customerPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("customer"), publicKey.toBuffer()],
            program.programId,
          );
          const acc = await program.account.customer.fetch(customerPda);
          return !!(acc as any).isRegistered;
        } catch {
          return false;
        }
      },
      getCustomer: async () => {
        if (!program || !publicKey)
          return { isRegistered: false, customerAddress: null };
        try {
          const [customerPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("customer"), publicKey.toBuffer()],
            program.programId,
          );
          const acc = await program.account.customer.fetch(customerPda);
          return {
            isRegistered: !!(acc as any).isRegistered,
            customerAddress: acc ? publicKey.toBase58() : null,
          };
        } catch {
          return { isRegistered: false, customerAddress: null };
        }
      },
      owner: async () => {
        if (!program) return null;
        try {
          const [globalStatePda] = PublicKey.findProgramAddressSync(
            [Buffer.from("global_state")],
            program.programId,
          );
          const globalState =
            await program.account.globalState.fetch(globalStatePda);
          return (globalState as any).owner.toBase58();
        } catch {
          return walletAddress;
        }
      },
    };
  }, [program, publicKey, walletAddress, getInvoice]);

  return {
    contract,
    account,
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
    getInvoice,
    checkAndRegisterCustomer,
  };
}
