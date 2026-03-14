'use client';

import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { useTheme } from './ThemeProvider';
import { RoleIndicator } from './RoleIndicator';
import { useState } from 'react';
import { useIsMounted } from '../hooks/useIsMounted';

export function Header() {
  const isMounted = useIsMounted();
  const { connected } = useWallet();
  const { theme, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Evitamos errores de hidratación asegurándonos de que el contenido
  // que depende del estado del cliente (wallet) solo se renderice tras el montaje.
  const showConnectedContent = isMounted && connected;

  return (
    <header className="bg-slate-900/95 backdrop-blur-md shadow-lg border-b border-cyan-500/20 fixed w-full z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center flex-shrink-0">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                <span className="text-white font-bold text-lg leading-none">A</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                Admin Panel
              </span>
            </Link>
          </div>

          {showConnectedContent && (
            <div className="hidden md:flex items-center space-x-4">
              <RoleIndicator />
              <div className="h-6 w-px bg-slate-700/50 mx-2"></div>
            </div>
          )}

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center space-x-4">
            {showConnectedContent && <RoleIndicator />}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-slate-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-cyan-500 rounded-md p-1 transition-colors"
            >
              <span className="sr-only">Abrir menú</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-slate-800 border-b border-cyan-500/20">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              href="/"
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Dashboard
            </Link>
            <Link
              href="/companies"
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Empresas
            </Link>
            <Link
              href="/products"
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Productos
            </Link>
            <Link
              href="/customers"
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Clientes
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
