"use client";

import "./globals.css";
import { AppWalletProvider } from "./providers"; // Import from the correct path
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

// Metadata can be minimal for this specific flow.
// export const metadata = {
//   title: 'Pasarela de Pago - Solana',
//   description: 'Pasarela de pago segura con Solana y EURT.',
// };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body
        className={`${inter.variable} font-sans bg-slate-900 text-slate-50 antialiased`}
      >
        <AppWalletProvider>{children}</AppWalletProvider>
      </body>
    </html>
  );
}
