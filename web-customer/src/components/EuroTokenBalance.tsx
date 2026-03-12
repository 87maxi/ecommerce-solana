'use client';

import { useEuroTokenBalance } from '@/hooks/useEuroTokenBalance';
import { Loader2, Coins } from 'lucide-react';

export function EuroTokenBalance() {
  const { balance, loading, error } = useEuroTokenBalance();

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground px-3 py-1.5 bg-slate-800/50 rounded-lg border border-slate-700/50">
        <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
        <span className="text-xs">Cargando...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-red-400 px-3 py-1.5 bg-red-900/20 rounded-lg border border-red-500/30">
        <span className="text-xs">Error al cargar balance</span>
      </div>
    );
  }

  const balanceNum = parseFloat(balance);
  const hasBalance = balanceNum > 0;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-emerald-900/20 to-cyan-900/20 rounded-lg border border-emerald-500/30 hover:border-emerald-500/50 transition-all">
      <div className="flex items-center gap-1.5">
        <Coins className="w-4 h-4 text-emerald-400" />
        <span className="text-xs font-medium text-emerald-300 uppercase tracking-wider">EURT</span>
      </div>
      <span className={`font-mono text-sm font-bold ${hasBalance ? 'text-emerald-400' : 'text-slate-400'}`}>
        {balanceNum.toFixed(2)}
      </span>
      {hasBalance && (
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
      )}
    </div>
  );
}