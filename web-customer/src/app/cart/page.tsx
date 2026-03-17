"use client";

import { useState, useEffect } from "react";
import { useContract } from "@/hooks/useContract";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useEuroTokenBalance } from "@/hooks/useEuroTokenBalance";
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  Loader2,
  CreditCard,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CartItem {
  product: {
    id: any;
    name: string;
    price: string;
    image: string;
    companyId: any;
  };
  quantity: number;
}

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [total, setTotal] = useState("0.00");
  const [isPaying, setIsPaying] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const {
    getCart,
    getAllProducts,
    calculateTotal: getCartTotal,
    removeFromCart,
    updateQuantity,
    createInvoice,
    processPayment,
    clearCart,
  } = useContract();
  const { connected, publicKey } = useWallet();
  const {
    balance,
    loading: balanceLoading,
    error: balanceError,
  } = useEuroTokenBalance();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchCart = async () => {
      if (connected) {
        try {
          const [rawItems, allProducts] = await Promise.all([
            getCart(),
            getAllProducts(),
          ]);

          const joinedItems = rawItems
            .map((item: any) => {
              const product = allProducts.find(
                (p: any) => p.id === item.productId,
              );
              if (!product) return null;
              return { product, quantity: item.quantity };
            })
            .filter(Boolean) as CartItem[];

          if (isMounted) {
            setCartItems(joinedItems);

            const calculatedTotal = joinedItems.reduce(
              (acc: number, item: CartItem) => {
                return acc + parseFloat(item.product.price) * item.quantity;
              },
              0,
            );
            setTotal(calculatedTotal.toFixed(2));
          }
        } catch (error) {
          console.error("Error fetching cart:", error);
        }
      } else {
        if (isMounted) {
          setCartItems([]);
          setTotal("0.00");
        }
      }
      if (isMounted) setLoading(false);
    };

    fetchCart();

    return () => {
      isMounted = false;
    };
  }, [connected, getCart, getAllProducts]);

  // Update total when cart items change locally
  useEffect(() => {
    const calculatedTotal = cartItems.reduce((acc, item) => {
      return acc + parseFloat(item.product.price) * item.quantity;
    }, 0);
    setTotal(calculatedTotal.toFixed(2));
  }, [cartItems]);

  const handleRemoveFromCart = async (productId: any) => {
    try {
      const success = await removeFromCart(productId);
      if (success) {
        // Update local state optimistically
        setCartItems(cartItems.filter((item) => item.product.id !== productId));
      }
      console.log("Product removed from cart");
    } catch (error) {
      console.error("Error removing product from cart:", error);
    }
  };

  const handleUpdateQuantity = async (productId: any, newQuantity: number) => {
    if (newQuantity === 0) {
      handleRemoveFromCart(productId);
      return;
    }

    try {
      const success = await updateQuantity(productId, newQuantity);
      if (success) {
        // Update local state optimistically
        setCartItems(
          cartItems.map((item) =>
            item.product.id === productId
              ? { ...item, quantity: newQuantity }
              : item,
          ),
        );
      }
      console.log("Quantity updated");
    } catch (error) {
      console.error("Error updating quantity:", error);
    }
  };

  const handleCheckout = async () => {
    if (!connected || !publicKey) {
      setPaymentError("Por favor conecta tu wallet primero.");
      return;
    }

    setIsPaying(true);
    setPaymentError(null);
    try {
      // Obtener el ID de la empresa para el registro opcional
      const companyIds = [
        ...new Set(cartItems.map((item) => item.product.companyId)),
      ];

      if (companyIds.length === 0) {
        throw new Error("No items in cart");
      }

      // En esta demo, usamos una wallet de destino fija (vendedor del fixture)
      const merchantAddress = "7eCTmt5LYSqnjgw8jebHjUzf8X7omxEpxYHbsXsmPtZQ";

      console.log("Iniciando pago directo on-chain con EURT...");
      const paymentResult = await processPayment(merchantAddress, total);
      
      if (!paymentResult) {
        throw new Error("No se pudo iniciar el proceso de pago. Verifica tu conexión a la wallet.");
      }

      const { signature, error } = paymentResult;

      if (signature) {
        console.log("Pago exitoso. Firma:", signature);

        // 1. Preparar datos para la factura
        const orderId = Date.now().toString();
        const invoiceData = {
          orderId,
          customerAddress: publicKey.toBase58(),
          items: cartItems.map((item) => ({
            name: item.product.name,
            quantity: item.quantity,
            price: item.product.price,
          })),
          total: total,
          txHash: signature,
        };

        // 2. Generar PDF y subir a IPFS (Llamada al Admin API)
        console.log("Generando factura en IPFS...");
        try {
          // El Admin API expone el endpoint en el puerto 3032
          const adminApiUrl =
            process.env.NEXT_PUBLIC_ADMIN_API_URL || "http://localhost:3032";
          const res = await fetch(`${adminApiUrl}/api/generate-invoice`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(invoiceData),
          });

          if (!res.ok) throw new Error("Error en la API de facturación");

          const { cid } = await res.json();
          console.log("Factura guardada en IPFS con CID:", cid);

          // 3. Registrar la factura on-chain
          console.log("Registrando factura en el Smart Contract...");
          // Asumimos que todos los productos son de la primera empresa para esta demo
          const companyId = companyIds[0];
          await createInvoice(companyId, total, signature, cid);
        } catch (ipfsError) {
          console.error(
            "Error en el proceso de facturación IPFS/On-chain:",
            ipfsError,
          );
          // Continuamos con el flujo de éxito aunque falle la factura para no bloquear al usuario
        }

        setPaymentSuccess(true);
        // Limpiamos el carrito localmente
        await clearCart();
        setCartItems([]);

        // Redirigimos a la página de éxito tras una breve pausa
        setTimeout(() => {
          window.location.href = `/cart/success?tx=${signature}`;
        }, 1500);
      } else {
        setPaymentError(
          error ||
            "El pago ha sido cancelado o ha fallado. Revisa tu balance de EURT y tu wallet.",
        );
      }
    } catch (error) {
      console.error("Error durante el checkout:", error);
      setPaymentError(
        "Hubo un problema al procesar la transacción con tu wallet.",
      );
    } finally {
      setIsPaying(false);
    }
  };

  if (!mounted || !connected) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto text-center bg-card/50 backdrop-blur-sm border border-border/50 rounded-3xl p-8 shadow-xl shadow-black/5">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 text-primary">
            <Wallet className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold mb-4 font-display text-foreground">
            Conecta tu Wallet
          </h1>
          <p className="text-muted-foreground text-lg mb-8">
            Necesitas conectar tu billetera de Solana para ver tu carrito y
            realizar compras.
          </p>
          <div className="flex justify-center">
            {mounted ? (
              <WalletMultiButton className="!bg-primary hover:!bg-primary/90 !transition-all !rounded-xl" />
            ) : (
              <div className="h-12 w-48 bg-muted rounded-xl animate-pulse"></div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 font-display text-foreground">
          Shopping Cart
        </h1>
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-muted rounded-xl"></div>
          <div className="h-32 bg-muted rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
          <ShoppingBag className="w-10 h-10 text-muted-foreground" />
        </div>
        <h1 className="text-3xl font-bold mb-4 font-display text-foreground">
          Tu carrito está vacío
        </h1>
        <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto">
          Parece que aún no has añadido ningún producto a tu carrito.
        </p>
        <a
          href="/products"
          className={cn(
            "inline-flex items-center gap-2 px-8 py-3 rounded-full",
            "bg-primary text-primary-foreground font-semibold",
            "hover:bg-primary/90 transition-all duration-200 hover:scale-105",
            "shadow-lg shadow-primary/25",
          )}
        >
          Explorar Productos
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold font-display text-foreground">
          Shopping Cart
        </h1>

        {/* Display EURT balance when connected */}
        {connected && (
          <div
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full",
              "bg-secondary/50 backdrop-blur-sm border border-border/50",
              "text-sm font-medium text-foreground",
            )}
          >
            {balanceLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            ) : balanceError ? (
              <span className="text-destructive text-xs">
                Error cargando balance
              </span>
            ) : (
              <>
                <span className="text-muted-foreground">Tu Balance:</span>
                <span className="font-bold text-primary">{balance}</span>
                <span className="text-muted-foreground font-semibold">
                  EURT
                </span>
              </>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map((item) => (
            <div
              key={item.product.id}
              className={cn(
                "flex flex-col sm:flex-row items-center gap-6 p-4",
                "bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl",
                "transition-all duration-200 hover:border-primary/20",
              )}
            >
              <div className="w-24 h-24 rounded-xl bg-secondary/20 overflow-hidden flex-shrink-0">
                {item.product.image &&
                item.product.image !== "/placeholder-product.jpg" ? (
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <ShoppingBag className="w-8 h-8 opacity-50" />
                  </div>
                )}
              </div>

              <div className="flex-1 w-full sm:w-auto text-center sm:text-left">
                <h3 className="font-semibold text-foreground text-lg mb-1">
                  {item.product.name}
                </h3>
                <p className="text-primary font-bold">
                  {item.product.price} EURT
                </p>
              </div>

              <div className="flex items-center gap-3 bg-secondary/30 rounded-full p-1">
                <button
                  onClick={() =>
                    handleUpdateQuantity(item.product.id, item.quantity - 1)
                  }
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-background transition-colors"
                  disabled={item.quantity <= 1}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center font-medium">
                  {item.quantity}
                </span>
                <button
                  onClick={() =>
                    handleUpdateQuantity(item.product.id, item.quantity + 1)
                  }
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-background transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="text-right w-full sm:w-auto flex flex-row sm:flex-col justify-between items-center sm:items-end">
                <p className="font-bold text-foreground text-lg mb-1">
                  {(parseFloat(item.product.price) * item.quantity).toFixed(2)}{" "}
                  EURT
                </p>
                <button
                  onClick={() => handleRemoveFromCart(item.product.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors p-2 rounded-lg hover:bg-destructive/10"
                  title="Remove from cart"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-card/80 backdrop-blur-md p-6 rounded-3xl border border-border/50 sticky top-24 shadow-xl shadow-black/5">
            <h2 className="text-xl font-bold mb-6 text-foreground">
              Resumen de Compra
            </h2>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="font-medium text-foreground">
                  {total} EURT
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Gastos de Red (Solana)</span>
                <span className="text-emerald-500 font-medium">Gratis</span>
              </div>
            </div>

            <div className="flex justify-between mb-8 pt-4 border-t border-border/50">
              <span className="font-bold text-lg text-foreground">Total</span>
              <span className="font-bold text-2xl text-primary">
                {total} EURT
              </span>
            </div>

            {paymentError && (
              <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg animate-in fade-in slide-in-from-top-2">
                <p className="font-semibold mb-1">
                  El pago no se pudo completar
                </p>
                <p className="opacity-90">{paymentError}</p>
              </div>
            )}

            {paymentSuccess && (
              <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm rounded-lg animate-in fade-in slide-in-from-top-2">
                <p className="font-semibold text-center flex items-center justify-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  ¡Pago Exitoso! Redirigiendo...
                </p>
              </div>
            )}

            <button
              onClick={handleCheckout}
              disabled={cartItems.length === 0 || isPaying || paymentSuccess}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-4 rounded-xl",
                "bg-primary text-primary-foreground font-bold text-lg",
                "hover:bg-primary/90 transition-all duration-200 transform hover:scale-[1.02]",
                "shadow-lg shadow-primary/25 hover:shadow-primary/40",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none",
              )}
            >
              {isPaying ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Procesando Pago...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  Pagar con EURT
                </>
              )}
            </button>

            <div className="mt-4 p-3 bg-blue-900/20 rounded-lg border border-blue-500/30">
              <p className="text-xs text-center text-blue-300">
                <span className="font-medium">Pago Seguro en Solana</span>
                <br />1 EURT = 1 Euro, stablecoin respaldado 1:1
              </p>
            </div>
            <p className="text-xs text-center text-muted-foreground mt-3">
              La transacción se realizará directamente desde tu wallet.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
