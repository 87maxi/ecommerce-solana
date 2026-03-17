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
import bs58 from "bs58";
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
  const { publicKey, sendTransaction, signTransaction, signAllTransactions } =
    useWallet();
  const walletAddress = publicKey?.toBase58();

  const [program, setProgram] = useState<Program | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const initializationAttempted = useRef(false);

  // Stable signer object for AnchorProvider
  const signer = useMemo(
    () =>
      publicKey && signTransaction && signAllTransactions
        ? { publicKey, signTransaction, signAllTransactions }
        : null,
    [publicKey, signTransaction, signAllTransactions],
  );

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
          setAccount(walletAddress || null);
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
    if (!program || !publicKey) return false;
    try {
      const [customerPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("customer"), publicKey.toBuffer()],
        program.programId,
      );

      const customerAccountObj =
        (program.account as any).customer || (program.account as any).Customer;
      if (!customerAccountObj) return true;

      try {
        await customerAccountObj.fetch(customerPda);
        console.log("[useContract] Customer already registered.");
        return true;
      } catch (err: any) {
        if (
          err.message?.includes("Account does not exist") ||
          err.message?.includes("AccountNotFound")
        ) {
          console.log("[useContract] Registering customer...");

          const method = program.methods.registerCustomer
            ? program.methods.registerCustomer()
            : (program.methods as any).register_customer();

          const tx = await method
            .accounts({
              customer: customerPda,
              user: publicKey,
              systemProgram: SystemProgram.programId,
            } as any)
            .rpc();
          console.log("[useContract] Customer registered. Hash:", tx);
          return true;
        }
        throw err;
      }
    } catch (error) {
      console.error(
        "[useContract] Error checking/registering customer:",
        error,
      );
      return false;
    }
  }, [program, publicKey]);

  const getAllProducts = useCallback(async () => {
    if (!program) return [];

    try {
      console.log(
        "[useContract] Fetching all product accounts with robust decoding...",
      );

      const account =
        (program.account as any).product || (program.account as any).Product;
      if (!account) throw new Error('Account "product" not found in program');

      const coder = program.coder.accounts;
      const discriminator =
        (account as any).discriminator ||
        Buffer.from([102, 76, 55, 251, 38, 73, 224, 229]);

      const rawAccounts = await connection.getProgramAccounts(
        program.programId,
        {
          filters: [
            { memcmp: { offset: 0, bytes: bs58.encode(discriminator) } },
          ],
        },
      );

      const products: any[] = [];
      for (const { pubkey, account: accountInfo } of rawAccounts) {
        try {
          const decoded =
            coder.decode("product", accountInfo.data) ||
            coder.decode("Product", accountInfo.data);
          products.push({ publicKey: pubkey, account: decoded });
        } catch (e: any) {
          console.warn(
            `[useContract] Skipping malformed product account ${pubkey.toBase58()}: ${e.message}`,
          );
        }
      }

      const formattedProducts = products.map((p: any) => ({
        ...p.account,
        id: p.account.id?.toString() ?? p.publicKey.toBase58(),
        publicKey: p.publicKey.toBase58(),
        companyId:
          (p.account as any).company_id?.toString() ??
          (p.account as any).companyId?.toString() ??
          "Unknown",
        name: p.account.name,
        // Description, image, and is_active were removed from the on-chain program to save space
        description: "Premium quality guaranteed at Solana E-Shop",
        price: (Number(p.account.price) / 1000000).toFixed(2),
        stock: Number(p.account.stock),
        image:
          "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800",
        active: true,
      }));

      console.log(
        `[useContract] Found ${formattedProducts.length} valid products.`,
      );
      return formattedProducts;
    } catch (error) {
      console.error("[useContract] Error fetching products:", error);
      return [];
    }
  }, [program, connection]);

  const getCart = useCallback(async () => {
    if (!program || !publicKey) return [];
    try {
      const [cartPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("shopping-cart"), publicKey.toBuffer()],
        program.programId,
      );

      const cartAccountObj =
        (program.account as any).shoppingCart ||
        (program.account as any).ShoppingCart;
      if (!cartAccountObj) return [];

      const cartAccount = await cartAccountObj.fetch(cartPda);
      if (!cartAccount || !cartAccount.items) return [];

      return cartAccount.items.map((item: any) => ({
        productId: (item.product_id ?? item.productId).toString(),
        quantity: Number(item.quantity),
      }));
    } catch (error: any) {
      if (!error.message?.includes("Account does not exist")) {
        console.error("[useContract] Error fetching on-chain cart:", error);
      }
      return [];
    }
  }, [program, publicKey]);

  const addToCart = useCallback(
    async (productId: string, quantity: number) => {
      if (!program || !publicKey) return false;
      try {
        const [cartPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("shopping-cart"), publicKey.toBuffer()],
          program.programId,
        );

        // Ensure we call the method on the methods object to preserve context
        // and handle both camelCase and snake_case names from the IDL
        const method = program.methods.addToCart
          ? program.methods.addToCart(new BN(productId), new BN(quantity))
          : (program.methods as any).add_to_cart(
              new BN(productId),
              new BN(quantity),
            );

        const tx = await method
          .accounts({
            cart: cartPda,
            user: publicKey,
            systemProgram: SystemProgram.programId,
          } as any)
          .rpc();

        console.log("[useContract] Successfully added to cart. Hash:", tx);
        window.dispatchEvent(new Event("cart-updated"));
        return true;
      } catch (error) {
        console.error("[useContract] Error adding to cart:", error);
        return false;
      }
    },
    [program, publicKey],
  );

  const removeFromCart = useCallback(
    async (productId: string) => {
      if (!program || !publicKey) return false;
      try {
        const [cartPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("shopping-cart"), publicKey.toBuffer()],
          program.programId,
        );

        // Ensure we call the method on the methods object to preserve context
        const method = program.methods.removeFromCart
          ? program.methods.removeFromCart(new BN(productId))
          : (program.methods as any).remove_from_cart(new BN(productId));

        const tx = await method
          .accounts({
            cart: cartPda,
            user: publicKey,
            systemProgram: SystemProgram.programId,
          } as any)
          .rpc();

        console.log("[useContract] Successfully removed from cart. Hash:", tx);
        window.dispatchEvent(new Event("cart-updated"));
        return true;
      } catch (error) {
        console.error("[useContract] Error removing from cart:", error);
        return false;
      }
    },
    [program, publicKey],
  );

  const updateQuantity = useCallback(
    async (productId: string, quantity: number) => {
      if (!program || !publicKey) return false;
      try {
        const [cartPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("shopping-cart"), publicKey.toBuffer()],
          program.programId,
        );

        // Ensure we call the method on the methods object to preserve context
        const method = program.methods.updateQuantity
          ? program.methods.updateQuantity(new BN(productId), new BN(quantity))
          : (program.methods as any).update_quantity(
              new BN(productId),
              new BN(quantity),
            );

        const tx = await method
          .accounts({
            cart: cartPda,
            user: publicKey,
            systemProgram: SystemProgram.programId,
          } as any)
          .rpc();

        console.log(
          "[useContract] Successfully updated cart quantity. Hash:",
          tx,
        );
        window.dispatchEvent(new Event("cart-updated"));
        return true;
      } catch (error) {
        console.error("[useContract] Error updating quantity:", error);
        return false;
      }
    },
    [program, publicKey],
  );

  const clearCart = useCallback(async () => {
    if (!program || !publicKey) return false;
    try {
      const [cartPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("shopping-cart"), publicKey.toBuffer()],
        program.programId,
      );

      // Ensure we call the method on the methods object to preserve context
      const method = program.methods.clearCart
        ? program.methods.clearCart()
        : (program.methods as any).clear_cart();

      const tx = await method
        .accounts({
          cart: cartPda,
          user: publicKey,
          systemProgram: SystemProgram.programId,
        } as any)
        .rpc();

      console.log("[useContract] Successfully cleared cart. Hash:", tx);
      window.dispatchEvent(new Event("cart-updated"));
      return true;
    } catch (error) {
      console.error("[useContract] Error clearing cart:", error);
      return false;
    }
  }, [program, publicKey]);

  const getCartItemCount = useCallback(async () => {
    const items = await getCart();
    return items.reduce((acc: number, item: any) => acc + item.quantity, 0);
  }, [getCart]);

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
          process.env.NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS ||
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

        // Create the transaction
        const transaction = new Transaction();

        // 3. Manejar la creación de la ATA del comerciante (Merchant) si no existe
        const merchantAtaInfo = await connection.getAccountInfo(merchantAta);
        if (!merchantAtaInfo) {
          console.log(
            "[useContract] Merchant ATA no encontrada. Agregando instrucción de creación a la transacción...",
          );

          transaction.add(
            createAssociatedTokenAccountInstruction(
              publicKey, // Payer (Tú)
              merchantAta, // La ATA a crear
              merchantPubKey, // El dueño de la ATA (La tienda)
              mintAddress, // El Mint (EURT)
            ),
          );
        }

        // 4. Agregar la instrucción de transferencia (TransferChecked)
        console.log(
          "[useContract] Agregando transferencia de tokens a la transacción...",
        );
        transaction.add(
          createTransferCheckedInstruction(
            userAta, // Cuenta de origen
            mintAddress, // Mint del token
            merchantAta, // Cuenta de destino
            publicKey, // Propietario (Owner) que autoriza
            amountInUnits, // Monto
            decimals, // Decimales
          ),
        );

        // Get latest blockhash
        const { blockhash, lastValidBlockHeight } =
          await connection.getLatestBlockhash("confirmed");
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = publicKey;

        console.log(
          "[useContract] Solicitando firma y envío de la transacción combinada...",
        );
        console.log(
          `[useContract] Instrucciones en la transacción: ${transaction.instructions.length}`,
        );

        // Enviamos la transacción completa
        let signature: string;
        try {
          signature = await sendTransaction(transaction, connection, {
            skipPreflight: true, // A veces la simulación falla en local pero la TX es válida
            preflightCommitment: "confirmed", // Usamos confirmed para mayor seguridad
          });
        } catch (signError: any) {
          console.error(
            "[useContract] Error crítico al firmar/enviar:",
            signError,
          );
          // Si el error contiene "Plugin Closed", intentamos dar más contexto
          if (signError.message?.includes("Plugin Closed")) {
            throw new Error(
              "La wallet se cerró (Plugin Closed). Esto puede ocurrir por un timeout o un fallo en la simulación de la extensión.",
            );
          }
          throw signError;
        }

        console.log(
          "[useContract] Transacción enviada satisfactoriamente. Firma:",
          signature,
        );

        // Confirmar la transacción
        const confirmation = await connection.confirmTransaction(
          {
            signature,
            blockhash,
            lastValidBlockHeight,
          },
          "confirmed",
        );

        if (confirmation.value.err) {
          throw new Error(
            `La transacción falló en la red: ${JSON.stringify(confirmation.value.err)}`,
          );
        }

        console.log("[useContract] ¡Pago con EURT confirmado exitosamente!");

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
    async (
      companyId: string,
      totalAmount: string,
      paymentTxHash: string,
      ipfsCid: string,
    ) => {
      if (!program || !publicKey || !sendTransaction) return null;

      try {
        console.log("Registrando factura en el Smart Contract...");

        const companyIdBN = new BN(companyId);
        const totalAmountBN = new BN(
          Math.round(parseFloat(totalAmount) * 1000000),
        );

        const [globalStatePda] = PublicKey.findProgramAddressSync(
          [Buffer.from("global-state")],
          program.programId,
        );

        const globalStateAccount =
          (program.account as any).globalState ||
          (program.account as any).GlobalState;
        if (!globalStateAccount)
          throw new Error('Account "globalState" not found in program');
        const globalStateRaw: any =
          await globalStateAccount.fetch(globalStatePda);

        const [invoicePda] = PublicKey.findProgramAddressSync(
          [
            Buffer.from("invoice"),
            globalStateRaw.nextInvoiceId.toArrayLike(Buffer, "le", 8),
          ],
          program.programId,
        );

        const [cartPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("shopping-cart"), publicKey.toBuffer()],
          program.programId,
        );

        const tx = await program.methods
          .createInvoice(companyIdBN, totalAmountBN, ipfsCid)
          .accounts({
            globalState: globalStatePda,
            invoice: invoicePda,
            cart: cartPda,
            user: publicKey,
            systemProgram: SystemProgram.programId,
          } as any)
          .rpc();

        console.log("Factura registrada exitosamente on-chain. Firma:", tx);

        // Llamar a process_payment
        const [customerPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("customer"), publicKey.toBuffer()],
          program.programId,
        );

        console.log("Procesando pago en el Smart Contract...");
        const tx2 = await (
          program.methods.processPayment ||
          (program.methods as any).process_payment
        )(paymentTxHash)
          .accounts({
            invoice: invoicePda,
            customer: customerPda,
            authority: publicKey,
          } as any)
          .rpc();
        console.log("Pago procesado exitosamente on-chain. Firma:", tx2);

        return tx;
      } catch (error) {
        console.error("Error al registrar factura on-chain:", error);
        return null;
      }
    },
    [program, publicKey, connection, sendTransaction],
  );

  const getCustomerInvoices = useCallback(
    async (customerAddress: string) => {
      if (!program) return [];

      try {
        console.log("[useContract] Obteniendo facturas del cliente...");
        const invoiceAccount =
          (program.account as any).invoice || (program.account as any).Invoice;
        if (!invoiceAccount)
          throw new Error("Account 'invoice' not found in program IDL");

        // Fetch all invoices for this customer
        const allInvoices = await invoiceAccount.all([
          {
            memcmp: {
              offset: 8 + 8 + 8, // discriminator + id + company_id
              bytes: customerAddress,
            },
          },
        ]);

        return allInvoices.map((inv: any) => ({
          ...inv.account,
          id: inv.account.invoiceId.toString(),
          publicKey: inv.publicKey,
        }));
      } catch (error) {
        console.error("[useContract] Error al obtener facturas:", error);
        return [];
      }
    },
    [program],
  );

  const getInvoice = useCallback(
    async (invoiceId: any) => {
      if (!program) return null;
      try {
        console.warn("[useContract] getInvoice is currently disabled.");
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
