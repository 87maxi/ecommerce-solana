"use client";

import "./globals.css";
import { AppWalletProvider } from "./providers";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

// Since this is a simple layout for a specific flow, metadata can be minimal.
// export const metadata = {
//   title: 'Comprar EuroToken (EURT)',
//   description: 'Adquiere tokens EURT 1:1 con euros de forma segura.',
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
