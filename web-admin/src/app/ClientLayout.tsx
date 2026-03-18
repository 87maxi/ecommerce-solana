'use client';

import React, { ReactNode } from 'react';
import { Header } from '../components/Header';
import { ThemeProvider } from '../components/ThemeProvider';
import { RoleProvider } from '../contexts/RoleContext';
import { ContractProvider } from '../contexts/ContractContext';
import { AppWalletProvider } from './providers';
import { Sidebar } from '../components/Sidebar';
import { useIsMounted } from '../hooks/useIsMounted';

interface ClientLayoutProps {
  children: ReactNode;
}

/**
 * ClientLayout maneja la lógica de estado del lado del cliente y envuelve la aplicación
 * con los proveedores necesarios. Al separar esto del RootLayout (Server Component),
 * evitamos gran parte de los errores de hidratación inicial de Next.js.
 */
export default function ClientLayout({ children }: ClientLayoutProps) {
  const isMounted = useIsMounted();

  if (!isMounted) {
    return <div className="min-h-screen bg-slate-900 text-slate-50 font-sans antialiased" />;
  }

  return (
    <AppWalletProvider>
      <ThemeProvider>
        <ContractProvider>
          <RoleProvider>
            <div className="flex h-screen overflow-hidden">
              <Sidebar />
              <div className="flex flex-col flex-1 overflow-hidden ml-0 md:ml-72 transition-all duration-300">
                <Header />
                <main className="flex-1 overflow-y-auto bg-slate-900/50 p-4 md:p-6 lg:p-8 pb-24 md:pb-8">
                  <div className="max-w-7xl mx-auto w-full animate-fade-in">{children}</div>
                </main>
              </div>
            </div>
          </RoleProvider>
        </ContractProvider>
      </ThemeProvider>
    </AppWalletProvider>
  );
}
