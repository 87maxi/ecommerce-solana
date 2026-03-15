"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { Program, AnchorProvider, Idl, BN } from "@coral-xyz/anchor";
import { Buffer } from "buffer";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import {
  getAssociatedTokenAddress,
  createTransferCheckedInstruction,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";
import EcommerceABI from "@/contracts/abis/EcommerceABI.json";

const PROGRAM_ID = process.env.NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS || "";

export function useContract() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
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

    if (isInitialized || !connection || initializationAttempted.current) {
      return;
    }

    const initProgram = async () => {
      initializationAttempted.current = true;
      try {
        console.log("[useContract] Initializing Anchor program...");

        // We use a fallback provider with a dummy signer if the wallet is not connected.
        // This allows fetching products (read-only) without a wallet immediately.
        const providerSigner = signer || {
          publicKey: new PublicKey("11111111111111111111111111111111"),
          signTransaction: async (tx: any) => tx,
          signAllTransactions: async (txs: any) => txs,
        };

        const anchorProvider = new AnchorProvider(
          connection,
          providerSigner as any,
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

  // Reset state only if wallet address genuinely changes
  // Reset state only if wallet address genuinely changes
  // We keep the current program instance to avoid flickering until the new one is ready
  const prevAddressRef = useRef(walletAddress);
  useEffect(() => {
    if (walletAddress !== prevAddressRef.current) {
      initializationAttempted.current = false;
      setIsInitialized(false);
      // Only nullify program if we're switching between different accounts
      if (
        walletAddress &&
        prevAddressRef.current &&
        walletAddress !== prevAddressRef.current
      ) {
        setProgram(null);
      }
      prevAddressRef.current = walletAddress;
    }
  }, [walletAddress]);

  const checkAndRegisterCustomer = useCallback(async (): Promise<boolean> => {
    // El programa actual en Surfpool no soporta registro de clientes en la blockchain.
    // Retornamos true para no bloquear el flujo de la aplicación.
    return true;
  }, []);

  const getAllProducts = useCallback(async () => {
    if (!program) return [];

    try {
      console.log(
        "[useContract] Fetching all product accounts from blockchain...",
      );
      // En el contrato actual desplegado (4ourUp), no hay un contador global de productos.
      // Usamos .all() para obtener todas las cuentas de tipo 'product'.
      const productAccounts = await program.account.product.all();

      const products = productAccounts.map((p: any) => {
        const data = p.account;
        return {
          // Usamos la clave pública de la cuenta como ID para mayor estabilidad
          id: p.publicKey.toBase58(),
          companyId: data.company?.toBase58() || "1",
          name: data.name,
          description: "Calidad premium garantizada en Solana E-Shop",
          price: (data.price.toNumber() / 100).toFixed(2),
          stock: data.stock.toNumber(),
          image:
            "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800",
          active: true,
        };
      });

      console.log(`[useContract] Found ${products.length} products.`);
      return products;
    } catch (error) {
      console.error("[useContract] Error fetching products:", error);
      return [];
    }
  }, [program]);

  const getCart = useCallback(async () => {
    if (!walletAddress) return [];
    try {
      const cartData = localStorage.getItem(`cart_${walletAddress}`);
      return cartData ? JSON.parse(cartData) : [];
    } catch (error) {
      return [];
    }
  }, [walletAddress]);

  const addToCart = useCallback(
    async (productId: string, quantity: number) => {
      if (!walletAddress) return false;
      try {
        const cart = await getCart();
        const existingItem = cart.find(
          (item: any) => item.productId === productId,
        );
        let newCart;
        if (existingItem) {
          newCart = cart.map((item: any) =>
            item.productId === productId
              ? { ...item, quantity: item.quantity + quantity }
              : item,
          );
        } else {
          newCart = [...cart, { productId, quantity }];
        }
        localStorage.setItem(`cart_${walletAddress}`, JSON.stringify(newCart));
        return true;
      } catch (error) {
        console.error("[useContract] Error adding to cart:", error);
        return false;
      }
    },
    [walletAddress, getCart],
  );

  const removeFromCart = useCallback(
    async (productId: string) => {
      if (!walletAddress) return false;
      try {
        const cart = await getCart();
        const newCart = cart.filter(
          (item: any) => item.productId !== productId,
        );
        localStorage.setItem(`cart_${walletAddress}`, JSON.stringify(newCart));
        return true;
      } catch (error) {
        console.error("[useContract] Error removing from cart:", error);
        return false;
      }
    },
    [walletAddress, getCart],
  );

  const updateQuantity = useCallback(
    async (productId: string, quantity: number) => {
      if (!walletAddress) return false;
      try {
        const cart = await getCart();
        const newCart = cart.map((item: any) =>
          item.productId === productId ? { ...item, quantity } : item,
        );
        localStorage.setItem(`cart_${walletAddress}`, JSON.stringify(newCart));
        return true;
      } catch (error) {
        console.error("[useContract] Error updating quantity:", error);
        return false;
      }
    },
    [walletAddress, getCart],
  );

  const calculateTotal = useCallback(async () => {
    if (!program || !publicKey) return "0.00";
    try {
      const cartItems = await getCart();
      if (cartItems.length === 0) return "0.00";
      const allProducts = await getAllProducts();
      let total = 0;
      for (const item of cartItems) {
        const product = allProducts.find((p: any) => p.id === item.productId);
        if (product) {
          total += Math.round(parseFloat(product.price) * 100) * item.quantity;
        }
      }
      return (total / 100).toFixed(2);
    } catch (error) {
      console.error("[useContract] Error calculating total:", error);
      return "0.00";
    }
  }, [program, publicKey, getCart, getAllProducts]);

  /**
   * Realiza un pago directo on-chain utilizando tokens EURT (SPL)
   * @param merchantAddress La wallet de destino (vendedor)
   * @param amount El monto total en EURT (formato string decimal)
   * @returns El hash de la transacción o null si falla
   */
  const processPayment = useCallback(
    async (merchantAddress: string, amount: string) => {
      if (!publicKey || !connection || !sendTransaction) return null;

      try {
        console.log(
          "[useContract] Iniciando transferencia de EURT on-chain...",
        );

        // Dirección del Mint de EURT (desde variables de entorno o fallback)
        // La dirección AKWdem... es el Mint real verificado en Surfpool.
        const mintAddress = new PublicKey(
          process.env.NEXT_PUBLIC_EUROTOKEN_MINT ||
            "AKWdemYgbmSujB1jTMm8q6q3fKTtcxr5XXp8tSSoDekC",
        );
        // Usamos la dirección del merchant desde el entorno o el argumento
        let merchantPubKey = new PublicKey(
          process.env.NEXT_PUBLIC_MERCHANT_ADDRESS ||
            merchantAddress ||
            "7eCTmt5LYSqnjgw8jebHjUzf8X7omxEpxYHbsXsmPtZQ",
        );

        // Para pruebas locales: si intentas pagarte a ti mismo, el saldo no cambiará.
        // Forzamos una dirección de destino diferente (billetera de prueba local de desarrollo)
        // para que veas el balance descontarse correctamente en la UI.
        if (merchantPubKey.toBase58() === publicKey.toBase58()) {
          console.warn(
            "[useContract] Atención: Estás intentando comprar productos de tu propia tienda. Para ver el débito, el pago se enviará a una wallet de prueba.",
          );
          merchantPubKey = new PublicKey("11111111111111111111111111111111");
        }

        // Obtener las Cuentas de Token Asociadas (ATA)
        const userAta = await getAssociatedTokenAddress(mintAddress, publicKey);
        const merchantAta = await getAssociatedTokenAddress(
          mintAddress,
          merchantPubKey,
        );

        // 1. Verificar si el usuario tiene una ATA y si tiene balance suficiente
        const userAtaInfo = await connection.getAccountInfo(userAta);
        if (!userAtaInfo) {
          console.error(
            "[useContract] Tu cuenta no tiene tokens EURT. ATA no encontrada.",
          );
          alert("No posees tokens EURT para realizar esta compra.");
          return null;
        }

        // 2. Calcular el monto en unidades base (EURT usa 6 decimales)
        const decimals = 6;
        const amountInUnits = BigInt(
          Math.round(parseFloat(amount) * Math.pow(10, decimals)),
        );

        // Verificar balance del usuario
        const userBalance = await connection.getTokenAccountBalance(userAta);
        if (BigInt(userBalance.value.amount) < amountInUnits) {
          console.error(
            `[useContract] Balance insuficiente. Requerido: ${amount}, Actual: ${userBalance.value.uiAmountString}`,
          );
          alert(
            `Balance insuficiente. Tienes ${userBalance.value.uiAmountString} EURT, pero necesitas ${amount} EURT.`,
          );
          return null;
        }

        // 3. Manejar la creación de la ATA del comerciante (Merchant) si no existe
        const merchantAtaInfo = await connection.getAccountInfo(merchantAta);
        if (!merchantAtaInfo) {
          console.log(
            "[useContract] Merchant ATA no encontrada. Iniciando transacción de creación previa...",
          );

          const createAtaTx = new Transaction().add(
            createAssociatedTokenAccountInstruction(
              publicKey, // Payer (Tú)
              merchantAta, // La ATA a crear
              merchantPubKey, // El dueño de la ATA (La tienda)
              mintAddress, // El Mint (EURT)
            ),
          );

          console.log(
            "[useContract] Enviando transacción para crear ATA del vendedor...",
          );
          const createAtaSig = await sendTransaction(createAtaTx, connection);

          const latestBlockhashForAta = await connection.getLatestBlockhash();
          await connection.confirmTransaction(
            {
              signature: createAtaSig,
              ...latestBlockhashForAta,
            },
            "confirmed",
          );

          console.log("[useContract] ATA del vendedor creada exitosamente.");
        }

        // 4. Ejecutar la transacción de transferencia (TransferChecked)
        console.log("[useContract] Preparando transferencia de tokens...");
        const transferTx = new Transaction().add(
          createTransferCheckedInstruction(
            userAta, // Cuenta de origen
            mintAddress, // Mint del token
            merchantAta, // Cuenta de destino
            publicKey, // Propietario (Owner) que autoriza
            amountInUnits, // Monto
            decimals, // Decimales
          ),
        );

        // Firmar y enviar la transferencia
        // Usamos skipPreflight para evitar fallos de simulación en RPCs locales (Surfpool).
        // Evitamos que la billetera maneje la confirmación profunda (que causa el "Plugin Closed").
        const { blockhash } = await connection.getLatestBlockhash("confirmed");
        transferTx.recentBlockhash = blockhash;
        transferTx.feePayer = publicKey;

        console.log("[useContract] Solicitando firma de la billetera...");
        const signature = await sendTransaction(transferTx, connection, {
          skipPreflight: true,
          preflightCommitment: "processed",
        });

        console.log(
          "[useContract] Transacción enviada a la red, esperando confirmación:",
          signature,
        );

        // Nosotros mismos manejamos la confirmación para evitar que el wallet adapter se bloquee.
        const latestBlockhash =
          await connection.getLatestBlockhash("confirmed");
        const confirmation = await connection.confirmTransaction(
          {
            signature,
            ...latestBlockhash,
          },
          "confirmed",
        );

        if (confirmation.value.err) {
          throw new Error(
            `La transacción falló en la red: ${JSON.stringify(confirmation.value.err)}`,
          );
        }

        console.log(
          "[useContract] ¡Pago con EURT confirmado exitosamente en la red!",
        );

        // Disparar el evento global para que la UI de balance se actualice
        window.dispatchEvent(new Event("refresh-eurt-balance"));

        return { signature, error: null };
      } catch (error: any) {
        console.error("[useContract] El pago con EURT ha fallado:", error);

        // Errores comunes de la wallet que podemos traducir a un mensaje más amigable
        if (
          error.name === "WalletSignTransactionError" ||
          (error.message &&
            error.message.includes("User rejected the request")) ||
          (error.message &&
            error.message.toLowerCase().includes("user rejected"))
        ) {
          return {
            signature: null,
            error: "Has cancelado la transacción en tu billetera.",
          };
        }

        // Traducir el error "Plugin Closed" de Backpack
        if (
          error.name === "WalletSendTransactionError" ||
          (error.message &&
            error.message.toLowerCase().includes("plugin closed"))
        ) {
          // El plugin se cerró prematuramente, pero la transacción pudo haberse enviado a la red.
          // Para no dejar al usuario bloqueado, notificamos el problema pero sugerimos revisar el balance.
          return {
            signature: null,
            error:
              "La extensión de la billetera se cerró de forma inesperada. Verifica tu balance para confirmar si el pago se realizó.",
          };
        }

        if (error.logs) {
          console.error(
            "[useContract] Detalles de Simulación de Solana:",
            error.logs,
          );
        }

        return {
          signature: null,
          error:
            error.message || "La transacción fue rechazada o falló en la red.",
        };
      }
    },
    [publicKey, connection, sendTransaction],
  );

  const createInvoice = useCallback(
    async (companyId: number) => {
      if (!program || !publicKey) return null;

      try {
        const totalString = await calculateTotal();
        const totalAmountInCents = Math.round(parseFloat(totalString) * 100);
        if (totalAmountInCents <= 0) return null;

        // Mock invoice creation since the instruction is not in the ABI
        console.log(
          "[useContract] Mocking invoice creation for company:",
          companyId,
        );
        const mockInvoiceId = Math.floor(Math.random() * 1000000);
        return mockInvoiceId;
      } catch (error) {
        console.error("[useContract] Error creating invoice:", error);
        return null;
      }
    },
    [program, publicKey, calculateTotal],
  );

  const clearCart = useCallback(async () => {
    if (!walletAddress) return false;
    try {
      localStorage.removeItem(`cart_${walletAddress}`);
      return true;
    } catch (error) {
      console.error("[useContract] Error clearing cart:", error);
      return false;
    }
  }, [walletAddress]);

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
      isCustomerRegistered: async () => true,
      getCustomer: async () => ({
        isRegistered: true,
        customerAddress: walletAddress,
      }),
      owner: async () => {
        // En el programa actual, no hay una cuenta de estado global.
        // Retornamos la dirección del administrador del fixture por defecto.
        return "7eCTmt5LYSqnjgw8jebHjUzf8X7omxEpxYHbsXsmPtZQ";
      },
    };
  }, [program, walletAddress, getInvoice]);

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
    processPayment,
  };
}
