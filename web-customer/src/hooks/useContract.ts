"use client";

import { useState, useEffect, useRef } from "react";
import { Connection, PublicKey } from "@solana/web3.js";
import { Program, AnchorProvider, Idl } from "@coral-xyz/anchor";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import EcommerceABI from "@/contracts/abis/EcommerceABI.json";

// Dirección del programa en Solana (debería venir de variables de entorno)
const PROGRAM_ID = process.env.NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS || "";

export function useContract() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const walletAddress = publicKey?.toBase58();

  // We mock a signer object for Anchor Provider to keep compatibility
  // with the read-only operations when the user might not be fully connected
  const signer = publicKey ? { publicKey } : null;

  const [program, setProgram] = useState<Program | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const initializationAttempted = useRef(false);

  // Inicializar el programa cuando haya una conexión disponible
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
        console.log(
          "[useContract] Initializing Anchor program with shared connection...",
        );

        const anchorProvider = new AnchorProvider(
          connection,
          signer as any,
          AnchorProvider.defaultOptions(),
        );

        if (isMounted) setAccount(walletAddress);

        if (!PROGRAM_ID) {
          console.warn("Program ID not provided in env.");
          return;
        }

        // Usamos el ABI como IDL (asumiendo que será convertido a un IDL de Anchor)
        const idl = { ...(EcommerceABI as any), address: PROGRAM_ID } as Idl;
        const ecommerceProgram = new Program(idl, anchorProvider);

        if (isMounted) {
          setProgram(ecommerceProgram);
          setIsInitialized(true);
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

  // Resetear el intento de inicialización si cambia la billetera
  useEffect(() => {
    initializationAttempted.current = false;
    setIsInitialized(false);
  }, [walletAddress]);

  const checkAndRegisterCustomer = async (
    prog: Program,
    acc: string,
  ): Promise<boolean> => {
    try {
      console.log(
        "[Customer Registration] Mocking customer registration in Solana...",
      );
      return true;
    } catch (error) {
      console.error(
        "[Customer Registration] Error verifying/registering customer:",
        error,
      );
      throw error;
    }
  };

  const getAllProducts = async () => {
    if (!program) return [];
    try {
      console.log("[useContract] Mock fetching all products from Solana...");
      return [];
    } catch (error) {
      console.error("Error fetching products:", error);
      return [];
    }
  };

  const getCart = async () => {
    if (!program || !account) return [];
    try {
      console.log("[useContract] Mock fetching cart from Solana...");
      return [];
    } catch (error) {
      console.error("[Get Cart] Error fetching cart:", error);
      return [];
    }
  };

  const addToCart = async (productId: number, quantity: number) => {
    if (!program) return false;
    try {
      console.log(
        `[useContract] Mock adding ${quantity} of product ${productId} to cart...`,
      );
      return true;
    } catch (error) {
      console.error("Error adding to cart:", error);
      return false;
    }
  };

  const removeFromCart = async (productId: number) => {
    if (!program) return false;
    try {
      return true;
    } catch (error) {
      console.error("Error removing from cart:", error);
      return false;
    }
  };

  const updateQuantity = async (productId: number, quantity: number) => {
    if (!program) return false;
    try {
      return true;
    } catch (error) {
      console.error("Error updating quantity:", error);
      return false;
    }
  };

  const calculateTotal = async () => {
    if (!program) return "0";
    try {
      return "0";
    } catch (error) {
      console.error("Error calculating total:", error);
      return "0";
    }
  };

  const createInvoice = async (companyId: number) => {
    if (!program) return null;
    try {
      return Math.floor(Math.random() * 1000); // Mock invoice ID
    } catch (error) {
      console.error("Error creating invoice:", error);
      return null;
    }
  };

  const clearCart = async () => {
    if (!program) return false;
    try {
      return true;
    } catch (error) {
      console.error("Error clearing cart:", error);
      return false;
    }
  };

  const getCustomerInvoices = async (customerAddress: string) => {
    if (!program) return [];
    try {
      return [];
    } catch (error) {
      console.error("Error fetching invoices:", error);
      return [];
    }
  };

  const getCartItemCount = async () => {
    if (!program || !account) return 0;
    try {
      const items = await getCart();
      return items.reduce((acc: number, item: any) => acc + item.quantity, 0);
    } catch (error) {
      console.error("[Get Cart Count] Error getting cart count:", error);
      return 0;
    }
  };

  const getInvoice = async (invoiceId: any) => {
    if (!program) return null;
    try {
      console.log(`[Mock] getInvoice called for ${invoiceId}`);
      return {
        invoiceId,
        companyId: 1,
        customerAddress: account,
        totalAmount: BigInt("1000000000000000000"),
        timestamp: BigInt(Math.floor(Date.now() / 1000)),
        isPaid: false,
        paymentTxHash: "",
      };
    } catch (error) {
      console.error("Error getting invoice:", error);
      return null;
    }
  };

  // Provide a mocked contract object that includes the methods expected by the UI
  // Cast to `any` to avoid TypeScript complaining about missing Ethereum contract properties
  const mockedContract: any = program
    ? {
        ...program,
        getInvoice,
        isCustomerRegistered: async () => true,
        getCustomer: async () => ({
          isRegistered: true,
          customerAddress: account,
        }),
        owner: async () => {
          return account;
        },
      }
    : null;

  return {
    contract: mockedContract, // Exportado como 'contract' para mantener compatibilidad con las vistas
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
  };
}
