'use client';

import { ReactNode } from 'react';

import { Header } from '../components/Header';
import { ThemeProvider } from '../components/ThemeProvider';
import { RoleProvider } from '../contexts/RoleContext';
import { WalletProvider } from '../hooks/useWallet';
import './globals.css';
import { Sidebar } from '../components/Sidebar';

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-900 text-slate-200 font-sans antialiased">
        <ThemeProvider>
          <WalletProvider>
            <RoleProvider>
              <div className="flex min-h-screen flex-col">
                <Header />
                <div className="flex flex-1">
                  <Sidebar />
                  <main className="flex-1 w-full min-w-0 pt-16 px-4 sm:px-6 lg:px-8 pb-8 md:ml-72">
                    <div className="max-w-7xl mx-auto">
                      {children}
                    </div>
                  </main>
                </div>
              </div>
            </RoleProvider>
          </WalletProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}