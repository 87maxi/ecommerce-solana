'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAVIGATION } from '../lib/routes';
import { WalletInfo } from './WalletInfo';
import { ConnectWalletButton } from './ConnectWalletButton';
import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useRole } from '../contexts/RoleContext';
import { useIsMounted } from '../hooks/useIsMounted';

export function Sidebar() {
  const isMounted = useIsMounted();
  const pathname = usePathname();
  const { connected } = useWallet();
  const { roleInfo } = useRole();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Durante el SSR y el primer renderizado en el cliente, isMounted será false.
  // Renderizamos el estado de desconexión para que coincida con lo que generó el servidor
  // y evitar errores de hidratación.
  if (!isMounted || !connected) {
    return (
      <div className="hidden md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 sidebar-gradient border-r border-cyan-500/20">
        <div className="flex flex-col flex-grow justify-center items-center p-8">
          <div className="w-24 h-24 mb-8 relative">
            <div className="absolute inset-0 bg-cyan-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
            <div className="w-full h-full bg-gradient-to-br from-cyan-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/30 ring-4 ring-slate-900">
              <svg
                className="w-12 h-12 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2 text-center">Acceso Seguro</h2>
          <p className="text-slate-400 text-center mb-10 text-sm">
            Conecta tu wallet de Solana para acceder al panel de administración del E-Commerce.
          </p>
          <div className="w-full px-4">
            <ConnectWalletButton />
          </div>
        </div>
        <div className="p-4 border-t border-cyan-500/20 bg-slate-900/50 backdrop-blur-sm">
          <div className="flex items-center justify-center space-x-2 text-xs text-slate-500">
            <svg
              className="w-4 h-4 text-emerald-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            <span>Conexión descentralizada segura</span>
          </div>
        </div>
      </div>
    );
  }

  // Filtrar navegación según el rol del usuario
  const filteredNavigation = NAVIGATION.filter(item => {
    if (!item.roles || item.roles.length === 0) return true;
    if (roleInfo.role === 'admin') return true;
    return item.roles.includes(roleInfo.role as any);
  });

  return (
    <>
      {/* Mobile Sidebar */}
      <div className={`md:hidden fixed inset-0 z-40 ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
        <div className="fixed inset-y-0 left-0 w-64 bg-slate-900 border-r border-cyan-500/20 flex flex-col">
          <div className="h-16 flex items-center justify-between px-4 border-b border-cyan-500/20 bg-slate-900/50">
            <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Menú
            </span>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-slate-400 hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {filteredNavigation.map(item => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`
                    group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200
                    ${
                      isActive
                        ? 'bg-gradient-to-r from-cyan-500/10 to-purple-500/10 text-cyan-400 border border-cyan-500/20 shadow-inner'
                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                    }
                  `}
                >
                  <Icon
                    className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors duration-200 ${isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'}`}
                  />
                  {item.name}
                </Link>
              );
            })}
          </div>
          <div className="p-4 border-t border-cyan-500/20 bg-slate-900/50">
            <WalletInfo />
          </div>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 bg-slate-900 border-r border-cyan-500/20 z-20 transition-all duration-300">
        <div className="flex flex-col flex-grow pt-5 bg-slate-900 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-6 mb-8">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-all duration-300 transform group-hover:scale-105">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent group-hover:from-cyan-400 group-hover:to-purple-400 transition-all duration-300">
                  E-Commerce
                </h1>
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
                  Admin Portal
                </p>
              </div>
            </Link>
          </div>

          <div className="px-4 mb-6">
            <WalletInfo />
          </div>

          <div className="mt-4 flex-grow flex flex-col px-3 space-y-1.5">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-3">
              Navegación
            </div>
            {filteredNavigation.map(item => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200
                    ${
                      isActive
                        ? 'bg-gradient-to-r from-cyan-500/10 to-purple-500/10 text-cyan-400 border border-cyan-500/20 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]'
                        : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                    }
                  `}
                >
                  <Icon
                    className={`mr-3 flex-shrink-0 h-5 w-5 transition-colors duration-200 ${
                      isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'
                    }`}
                  />
                  {item.name}
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]"></div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center justify-center space-x-2 text-xs text-slate-500">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
            <span>Sistema Operativo</span>
          </div>
        </div>
      </div>
    </>
  );
}
