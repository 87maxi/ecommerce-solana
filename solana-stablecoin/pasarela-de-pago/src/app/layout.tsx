"use client";
import "./globals.css";
import { AppWalletProvider } from "./providers";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body className="bg-slate-900 font-sans antialiased">
        <AppWalletProvider>{children}</AppWalletProvider>
      </body>
    </html>
  );
}
