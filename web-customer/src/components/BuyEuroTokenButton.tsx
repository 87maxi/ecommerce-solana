'use client';

import { CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWallet } from '@/hooks/useWallet';

interface BuyEuroTokenButtonProps {
  redirectUrl?: string;
  className?: string;
}

export function BuyEuroTokenButton({ redirectUrl, className }: BuyEuroTokenButtonProps) {
  const { isConnected } = useWallet();
  const compraUrl = process.env.NEXT_PUBLIC_COMPRA_STABLECOIN_URL || 'http://localhost:3033';
  
  const handleClick = () => {
    const finalRedirectUrl = redirectUrl || window.location.href;
    const params = new URLSearchParams({ redirect: finalRedirectUrl });
    window.location.href = `${compraUrl}?${params.toString()}`;
  };

  return (
    <button
      onClick={handleClick}
      disabled={!isConnected}
      className={cn(
        "flex items-center gap-2",
        "bg-indigo-600/10 text-indigo-400 border border-indigo-600/20",
        "px-4 py-2 rounded-full text-sm font-medium",
        "hover:bg-indigo-600/20 hover:border-indigo-600/30 transition-all duration-200",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
    >
      <CreditCard className="w-4 h-4" />
      Comprar EURT
    </button>
  );
}