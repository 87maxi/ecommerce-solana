'use client';

import { ReactNode } from 'react';
import { Header } from '../components/Header';
import { ThemeProvider } from '../components/ThemeProvider';
import { RoleProvider } from '../contexts/RoleContext';
import { AppWalletProvider } from './providers';
import './globals.css';
import '@solana/wallet-adapter-react-ui/styles.css';
import { Sidebar } from '../components/Sidebar';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-900 text-slate-50 font-sans antialiased">
        <AppWalletProvider>
          <ThemeProvider>
            <RoleProvider>
              <div className="flex h-screen overflow-hidden">
                <Sidebar />
                <div className="flex flex-col flex-1 overflow-hidden ml-0 md:ml-72 transition-all duration-300">
                  <Header />
                  <main className="flex-1 overflow-y-auto bg-slate-900/50 p-4 md:p-6 lg:p-8 pt-20 pb-24 md:pb-8">
                    <div className="max-w-7xl mx-auto w-full animate-fade-in">{children}</div>
                  </main>
                </div>
              </div>
            </RoleProvider>
          </ThemeProvider>
        </AppWalletProvider>
      </body>
    </html>
  );
}
