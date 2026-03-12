'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, ShoppingCart, Package, Store, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EuroTokenBalance } from '@/components/EuroTokenBalance';

interface MobileMenuProps {
  cartItemCount: number;
}

export default function MobileMenu({ cartItemCount }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-foreground p-2 hover:bg-secondary/50 rounded-lg transition-colors"
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {isOpen && (
        <div className="absolute top-[60px] left-0 right-0 bg-background/95 backdrop-blur-md border-b border-border z-50 animate-accordion-down shadow-2xl">
          <div className="container mx-auto px-4 py-6 flex flex-col space-y-2">
            <Link
              href="/products"
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl",
                "text-foreground/80 hover:text-primary hover:bg-secondary/50",
                "transition-all duration-200"
              )}
              onClick={() => setIsOpen(false)}
            >
              <Store className="w-5 h-5" />
              <span className="font-medium">Products</span>
            </Link>

            <Link
              href="/cart"
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl",
                "text-foreground/80 hover:text-primary hover:bg-secondary/50",
                "transition-all duration-200"
              )}
              onClick={() => setIsOpen(false)}
            >
              <div className="relative">
                <ShoppingCart className="w-5 h-5" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-primary text-[10px] text-primary-foreground flex items-center justify-center rounded-full ring-2 ring-background">
                    {cartItemCount}
                  </span>
                )}
              </div>
              <span className="font-medium">Cart</span>
            </Link>

            <Link
              href="/orders"
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl",
                "text-foreground/80 hover:text-primary hover:bg-secondary/50",
                "transition-all duration-200"
              )}
              onClick={() => setIsOpen(false)}
            >
              <Package className="w-5 h-5" />
              <span className="font-medium">Orders</span>
            </Link>

            <div className="h-px bg-border/50 my-2" />
            
            <div className="px-4 py-2">
              <EuroTokenBalance />
            </div>

            <a
              href="http://localhost:3033?redirect=http://localhost:3030"
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl",
                "bg-indigo-600/10 text-indigo-400 border border-indigo-600/20",
                "hover:bg-indigo-600/20 hover:border-indigo-600/30",
                "transition-all duration-200"
              )}
              onClick={() => setIsOpen(false)}
            >
              <CreditCard className="w-5 h-5" />
              <span className="font-medium">Buy EURT</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}