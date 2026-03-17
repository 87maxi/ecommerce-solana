import { ReactNode } from 'react';
import './globals.css';
import '@solana/wallet-adapter-react-ui/styles.css';
import ClientLayout from './ClientLayout';

export const metadata = {
  title: 'Admin Panel - Solana E-commerce',
  description: 'Panel de administración para la plataforma de E-commerce en Solana',
};

/**
 * RootLayout es un Server Component por defecto en Next.js App Router.
 * Al mantenerlo como Server Component y mover la lógica de cliente a ClientLayout,
 * reducimos drásticamente los errores de hidratación y permitimos el uso de metadatos.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-900 text-slate-50 font-sans antialiased overflow-hidden">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
