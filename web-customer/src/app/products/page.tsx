'use client';

import { useState, useEffect } from 'react';
import { useContract } from '@/hooks/useContract';
import { useWallet } from '@/hooks/useWallet';
import { useEuroTokenBalance } from '@/hooks/useEuroTokenBalance';
import { ShoppingCart, Loader2, Euro, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type Product = {
  id: number;
  companyId: number;
  name: string;
  description: string;
  price: string;
  stock: number;
  image: string;
  active: boolean;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { getAllProducts, addToCart } = useContract();
  const { isConnected, connectWallet } = useWallet();
  const { balance, loading: balanceLoading, error: balanceError } = useEuroTokenBalance();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const fetchedProducts = await getAllProducts();
        setProducts(fetchedProducts);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [getAllProducts]);

  const handleAddToCart = async (productId: number) => {
    if (!isConnected) {
      connectWallet();
      return;
    }

    try {
      const success = await addToCart(productId, 1);
      if (success) {
        // You might want to show a success toast or update UI
        console.log('Product added to cart successfully');
      }
    } catch (error) {
      console.error('Error adding product to cart:', error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 font-display text-foreground">Products</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="border border-border rounded-2xl p-6 animate-pulse bg-card/50">
              <div className="bg-muted h-48 mb-4 rounded-xl"></div>
              <div className="h-4 bg-muted rounded mb-2 w-3/4"></div>
              <div className="h-4 bg-muted rounded mb-4 w-1/2"></div>
              <div className="flex justify-between items-center">
                <div className="h-6 bg-muted rounded w-1/4"></div>
                <div className="h-8 bg-muted rounded w-1/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 md:mb-12 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold font-display text-foreground mb-2">Products</h1>
          <p className="text-muted-foreground">Explore our collection of premium items</p>
        </div>

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
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {products.map((product) => (
          <div
            key={product.id}
            className={cn(
              "group relative flex flex-col",
              "bg-card/50 backdrop-blur-sm border border-border/50 rounded-3xl overflow-hidden",
              "transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1 hover:border-primary/20"
            )}
          >
            <div className="relative aspect-[4/3] overflow-hidden bg-secondary/20">
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <ImageIcon className="w-12 h-12 opacity-20" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            <div className="flex flex-col flex-grow p-6">
              <h3 className="text-xl font-bold mb-2 text-foreground line-clamp-1">{product.name}</h3>
              <p className="text-sm text-muted-foreground mb-6 line-clamp-2 flex-grow">{product.description}</p>

              <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/50">
                <div className="flex items-center gap-1 text-lg font-bold text-primary">
                  <span>{product.price}</span>
                  <span className="text-xs font-normal text-muted-foreground">EURT</span>
                </div>

                <button
                  onClick={() => handleAddToCart(product.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full",
                    "bg-primary text-primary-foreground font-medium text-sm",
                    "transition-all duration-200 hover:bg-primary/90 hover:scale-105",
                    "shadow-lg shadow-primary/20 hover:shadow-primary/30"
                  )}
                >
                  <ShoppingCart className="w-4 h-4" />
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}