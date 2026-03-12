'use client';

import '@/app/globals.css';
import WalletConnectHeader from '@/components/WalletConnectHeader';
import MobileMenu from '@/components/MobileMenu';
import { useContract } from '@/hooks/useContract';
import { useEffect, useState } from 'react';
import { ShoppingCart, Package, CreditCard, Store } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EuroTokenBalance } from '@/components/EuroTokenBalance';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [cartItemCount, setCartItemCount] = useState(0);
  const { getCartItemCount, contract } = useContract();

  useEffect(() => {
    const fetchCartCount = async () => {
      // Only fetch cart count if contract is initialized (wallet connected)
      if (!contract) {
        setCartItemCount(0);
        return;
      }

      try {
        const count = await getCartItemCount();
        setCartItemCount(count);
      } catch (error) {
        console.error('Error fetching cart count:', error);
        setCartItemCount(0);
      }
    };

    fetchCartCount();
  }, [getCartItemCount, contract]);

  return (
    <>
      <html lang="en" className="dark">
        <body className="bg-background min-h-screen flex flex-col font-body antialiased selection:bg-primary/20 selection:text-primary">
          <header className="border-b border-border/40 bg-background/80 backdrop-blur-md sticky top-0 z-50">
            <div className="container mx-auto px-4 py-3">
              <div className="flex justify-between items-center w-full">
                <div className="flex items-center gap-8">
                  <a href="/" className="group flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary via-accent to-secondary flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-all duration-300">
                      E
                    </div>
                    <span className="text-xl font-bold font-display bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                      E-Shop
                    </span>
                  </a>

                  <nav className="hidden md:flex items-center gap-1">
                    <a href="/products" className={cn(
                      "px-4 py-2 rounded-full text-sm font-medium text-muted-foreground transition-all duration-200",
                      "hover:text-foreground hover:bg-secondary/50",
                      "flex items-center gap-2"
                    )}>
                      <Store className="w-4 h-4" />
                      Products
                    </a>
                    <a href="/cart" className={cn(
                      "px-4 py-2 rounded-full text-sm font-medium text-muted-foreground transition-all duration-200",
                      "hover:text-foreground hover:bg-secondary/50",
                      "flex items-center gap-2"
                    )}>
                      <div className="relative">
                        <ShoppingCart className="w-4 h-4" />
                        {cartItemCount > 0 && (
                          <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-primary text-[10px] text-primary-foreground flex items-center justify-center rounded-full ring-2 ring-background">
                            {cartItemCount}
                          </span>
                        )}
                      </div>
                      Cart
                    </a>
                    <a href="/orders" className={cn(
                      "px-4 py-2 rounded-full text-sm font-medium text-muted-foreground transition-all duration-200",
                      "hover:text-foreground hover:bg-secondary/50",
                      "flex items-center gap-2"
                    )}>
                      <Package className="w-4 h-4" />
                      Orders
                    </a>
                  </nav>
                </div>

                <div className="flex items-center gap-4">
                  <div className="hidden md:block">
                    <EuroTokenBalance />
                  </div>
                  <a
                    href="http://localhost:3033?redirect=http://localhost:3030"
                    className={cn(
                      "hidden md:flex items-center gap-2",
                      "bg-indigo-600/10 text-indigo-400 border border-indigo-600/20",
                      "px-4 py-2 rounded-full text-sm font-medium",
                      "hover:bg-indigo-600/20 hover:border-indigo-600/30 transition-all duration-200"
                    )}
                  >
                    <CreditCard className="w-4 h-4" />
                    Buy EURT
                  </a>
                  <div className="h-6 w-px bg-border/50 hidden md:block" />
                  <WalletConnectHeader />
                  <MobileMenu cartItemCount={cartItemCount} />
                </div>
              </div>
            </div>
          </header>

          <main className="flex-grow relative">
            {children}
          </main>

          <footer className="bg-card border-t border-border/40 mt-auto">
            <div className="container mx-auto px-4 py-12">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                <div className="col-span-1 md:col-span-2">
                  <a href="/" className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary via-accent to-secondary flex items-center justify-center text-white font-bold text-xs">
                      E
                    </div>
                    <span className="text-lg font-bold font-display">E-Shop</span>
                  </a>
                  <p className="text-muted-foreground text-sm max-w-sm leading-relaxed">
                    Experience the future of e-commerce with our decentralized platform.
                    Secure, transparent, and efficient shopping powered by Ethereum blockchain technology.
                  </p>
                  <div className="mt-4 p-3 bg-blue-900/20 rounded-lg border border-blue-500/30">
                    <p className="text-xs text-blue-300">
                      <span className="font-medium">Pagos con EURT (EuroToken)</span>
                      <br />
                      1 EURT = 1 Euro, stablecoin respaldado 1:1
                    </p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-4 text-sm">Platform</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li><a href="/products" className="hover:text-primary transition-colors">Browse Products</a></li>
                    <li><a href="/cart" className="hover:text-primary transition-colors">Shopping Cart</a></li>
                    <li><a href="/orders" className="hover:text-primary transition-colors">Track Orders</a></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-4 text-sm">Support</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li><a href="#" className="hover:text-primary transition-colors">Help Center</a></li>
                    <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
                    <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
                  </ul>
                </div>
              </div>
              <div className="pt-8 border-t border-border/40 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
                <p>&copy; 2025 Blockchain E-Commerce. All rights reserved.</p>
                <div className="flex items-center gap-4">
                  <span>Powered by Ethereum & EURT</span>
                  <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                  <span>v1.0.0</span>
                </div>
              </div>
            </div>
          </footer>
        </body>
      </html>
    </>
  );
}

// eslint-disable-next-line @next/next/no-css-tags
// This is necessary to ensure globals.css is imported