import './globals.css';

export const metadata = {
  title: 'Compra EuroToken | EuroToken EURT',
  description: 'Compra tokens EuroToken (EURT) con tarjeta de crédito. 1 EUR = 1 EURT. Stablecoin respaldada 1:1.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}