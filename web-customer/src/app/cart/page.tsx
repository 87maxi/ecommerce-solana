'use client';

import { useState, useEffect } from 'react';
import { useContract } from '@/hooks/useContract';
import { useWallet } from '@/hooks/useWallet';
import { useEuroTokenBalance } from '@/hooks/useEuroTokenBalance';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Loader2, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CartItem {
  product: {
    id: number;
    companyId: number;
    name: string;
    description: string;
    price: string;
    stock: number;
    image: string;
    active: boolean;
  };
  quantity: number;
}

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState('0.00');
  const { getCart, calculateTotal: getCartTotal, removeFromCart, updateQuantity, createInvoice } = useContract();
  const { isConnected, connectWallet } = useWallet();
  const { balance, loading: balanceLoading, error: balanceError } = useEuroTokenBalance();

  useEffect(() => {
    const fetchCart = async () => {
      if (isConnected) {
        try {
          const items = await getCart();
          setCartItems(items);

          // Calculate total locally or fetch it
          const calculatedTotal = items.reduce((acc: number, item: CartItem) => {
            return acc + (parseFloat(item.product.price) * item.quantity);
          }, 0);
          setTotal(calculatedTotal.toFixed(2));

        } catch (error) {
          console.error('Error fetching cart:', error);
        }
      } else {
        setCartItems([]);
      }
      setLoading(false);
    };

    fetchCart();
  }, [getCart, isConnected]);

  // Update total when cart items change
  useEffect(() => {
    const calculatedTotal = cartItems.reduce((acc, item) => {
      return acc + (parseFloat(item.product.price) * item.quantity);
    }, 0);
    setTotal(calculatedTotal.toFixed(2));
  }, [cartItems]);

  const handleRemoveFromCart = async (productId: number) => {
    try {
      const success = await removeFromCart(productId);
      if (success) {
        // Update local state optimistically
        setCartItems(cartItems.filter(item => item.product.id !== productId));
      }
      console.log('Product removed from cart');
    } catch (error) {
      console.error('Error removing product from cart:', error);
    }
  };

  const handleUpdateQuantity = async (productId: number, newQuantity: number) => {
    if (newQuantity === 0) {
      handleRemoveFromCart(productId);
      return;
    }

    try {
      const success = await updateQuantity(productId, newQuantity);
      if (success) {
        // Update local state optimistically
        setCartItems(
          cartItems.map(item =>
            item.product.id === productId
              ? { ...item, quantity: newQuantity }
              : item
          )
        );
      }
      console.log('Quantity updated');
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const proceedToCheckout = async () => {
    if (!isConnected) {
      connectWallet();
      return;
    }

    try {
      // Get unique company IDs from cart items
      const companyIds = [...new Set(cartItems.map(item => item.product.companyId))];

      if (companyIds.length === 0) {
        throw new Error('No items in cart');
      }

      // For now, create invoice for the first company
      const companyId = companyIds[0];
      const invoiceId = await createInvoice(companyId);

      if (invoiceId) {
        // Redirect to EURT purchase page with invoice details
        const totalAmount = cartItems.reduce((acc, item) => {
          return acc + (parseFloat(item.product.price) * item.quantity);
        }, 0);
        
        const compraUrl = process.env.NEXT_PUBLIC_COMPRA_STABLECOIN_URL || 'http://localhost:3033';
        const redirectUrl = `${window.location.origin}/cart`;
        
        const params = new URLSearchParams({
          amount: totalAmount.toString(),
          invoice: invoiceId.toString(),
          redirect: redirectUrl
        });
        
        // Clear local cart state
        setCartItems([]);
        
        // Redirect to EURT purchase page
        window.location.href = `${compraUrl}?${params.toString()}`;
        console.log('Redirecting to EURT purchase for invoice:', invoiceId);
      } else {
        throw new Error('Failed to create invoice');
      }
    } catch (error) {
      console.error('Error during checkout:', error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 font-display text-foreground">Shopping Cart</h1>
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-muted rounded-xl"></div>
          <div className="h-32 bg-muted rounded-xl"></div>
          <div className="h-16 bg-muted rounded-lg w-1/3 ml-auto"></div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
          <ShoppingBag className="w-10 h-10 text-muted-foreground" />
        </div>
        <h1 className="text-3xl font-bold mb-4 font-display text-foreground">Your cart is empty</h1>
        <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto">
          Looks like you haven't added any items to your cart yet.
        </p>
        <a
          href="/products"
          className={cn(
            "inline-flex items-center gap-2 px-8 py-3 rounded-full",
            "bg-primary text-primary-foreground font-semibold",
            "hover:bg-primary/90 transition-all duration-200 hover:scale-105",
            "shadow-lg shadow-primary/25"
          )}
        >
          Start Shopping
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold font-display text-foreground">Shopping Cart</h1>

        {/* Display EURT balance when connected */}
        {isConnected && (
          <div className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full",
            "bg-secondary/50 backdrop-blur-sm border border-border/50",
            "text-sm font-medium text-foreground"
          )}>
            {balanceLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            ) : balanceError ? (
              <span className="text-destructive">{balanceError}</span>
            ) : (
              <>
                <span className="text-muted-foreground">Balance:</span>
                <span className="font-bold">{balance} EURT</span>
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
                "transition-all duration-200 hover:border-primary/20"
              )}
            >
              <div className="w-24 h-24 rounded-xl bg-secondary/20 overflow-hidden flex-shrink-0">
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 w-full sm:w-auto text-center sm:text-left">
                <h3 className="font-semibold text-foreground text-lg mb-1">{item.product.name}</h3>
                <p className="text-primary font-bold">{item.product.price} EURT</p>
              </div>

              <div className="flex items-center gap-3 bg-secondary/30 rounded-full p-1">
                <button
                  onClick={() => handleUpdateQuantity(item.product.id, item.quantity - 1)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-background transition-colors"
                  disabled={item.quantity <= 1}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center font-medium">{item.quantity}</span>
                <button
                  onClick={() => handleUpdateQuantity(item.product.id, item.quantity + 1)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-background transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="text-right w-full sm:w-auto flex flex-row sm:flex-col justify-between items-center sm:items-end">
                <p className="font-bold text-foreground text-lg mb-1">
                  {(parseFloat(item.product.price) * item.quantity).toFixed(2)} EURT
                </p>
                <button
                  onClick={() => handleRemoveFromCart(item.product.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors p-2"
                  title="Remove item"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-card/80 backdrop-blur-md p-6 rounded-3xl border border-border/50 sticky top-24 shadow-xl shadow-black/5">
            <h2 className="text-xl font-bold mb-6 text-foreground">Order Summary</h2>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{total} EURT</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span className="text-green-500 font-medium">Free</span>
              </div>
            </div>

            <div className="flex justify-between mb-8 pt-4 border-t border-border/50">
              <span className="font-bold text-lg text-foreground">Total</span>
              <span className="font-bold text-2xl text-primary">{total} EURT</span>
            </div>

            <button
              onClick={proceedToCheckout}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-4 rounded-xl",
                "bg-primary text-primary-foreground font-bold text-lg",
                "hover:bg-primary/90 transition-all duration-200 transform hover:scale-[1.02]",
                "shadow-lg shadow-primary/25 hover:shadow-primary/40"
              )}
            >
              <CreditCard className="w-5 h-5" />
              Proceed to Checkout
            </button>

            <div className="mt-4 p-3 bg-blue-900/20 rounded-lg border border-blue-500/30">
              <p className="text-xs text-center text-blue-300">
                <span className="font-medium">Pago con EURT (EuroToken)</span>
                <br />
                1 EURT = 1 Euro, stablecoin respaldado 1:1
              </p>
            </div>
            <p className="text-xs text-center text-muted-foreground mt-3">
              Pagos seguros con tecnología blockchain
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}