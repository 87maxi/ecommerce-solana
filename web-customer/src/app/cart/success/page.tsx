'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useContract } from '@/hooks/useContract';
import { useWallet } from '@/hooks/useWallet';

export default function PurchaseSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { contract, account } = useContract();
  const { isConnected } = useWallet();
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'failed'>('pending');
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyPurchase = async () => {
      if (!isConnected || !contract || !account) {
        return;
      }

      try {
        const success = searchParams.get('success');
        const tokens = searchParams.get('tokens');
        const invoiceId = searchParams.get('invoice');
        const wallet = searchParams.get('wallet');

        if (success !== 'true' || !tokens || !invoiceId) {
          setError('Parámetros de compra inválidos');
          setVerificationStatus('failed');
          return;
        }

        // Verify the wallet matches the connected account
        if (wallet && wallet.toLowerCase() !== account.toLowerCase()) {
          setError('La wallet no coincide con la cuenta conectada');
          setVerificationStatus('failed');
          return;
        }

        // Get invoice details from the contract
        const invoice = await contract.getInvoice(invoiceId);
        
        // Verify the amount matches
        const expectedAmount = parseFloat(tokens);
        const actualAmount = parseFloat(invoice.totalAmount);
        
        if (Math.abs(expectedAmount - actualAmount) > 0.01) {
          setError('El monto no coincide con la factura');
          setVerificationStatus('failed');
          return;
        }

        setInvoiceData({
          id: invoice.invoiceId.toNumber(),
          totalAmount: invoice.totalAmount,
          timestamp: new Date(invoice.timestamp.toNumber() * 1000),
          status: invoice.status
        });

        setVerificationStatus('success');
      } catch (err) {
        console.error('Error verifying purchase:', err);
        setError('Error al verificar la compra');
        setVerificationStatus('failed');
      }
    };

    verifyPurchase();
  }, [searchParams, contract, account, isConnected]);

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto text-center">
          <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Wallet no conectada</h1>
          <p className="text-muted-foreground mb-6">
            Por favor conecta tu wallet para verificar la compra.
          </p>
          <button
            onClick={() => router.push('/cart')}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Volver al carrito
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-md mx-auto text-center">
        {verificationStatus === 'pending' && (
          <>
            <Loader2 className="w-16 h-16 text-primary mx-auto mb-4 animate-spin" />
            <h1 className="text-2xl font-bold mb-2">Verificando compra</h1>
            <p className="text-muted-foreground">
              Estamos verificando los detalles de tu compra...
            </p>
          </>
        )}

        {verificationStatus === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">¡Compra Exitosa!</h1>
            <p className="text-muted-foreground mb-6">
              Tu pago con EURT ha sido procesado correctamente.
            </p>
            
            {invoiceData && (
              <div className="bg-card border border-border rounded-xl p-6 mb-6 text-left">
                <h2 className="font-semibold mb-4">Detalles de la factura</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ID de factura</span>
                    <span className="font-mono">#{invoiceData.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Monto</span>
                    <span className="font-mono">{invoiceData.totalAmount} EURT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fecha</span>
                    <span>{invoiceData.timestamp.toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Estado</span>
                    <span className="text-emerald-500 font-medium">Pagado</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => router.push('/orders')}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Ver mis órdenes
              </button>
              <button
                onClick={() => router.push('/products')}
                className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors"
              >
                Seguir comprando
              </button>
            </div>
          </>
        )}

        {verificationStatus === 'failed' && (
          <>
            <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Error en la verificación</h1>
            <p className="text-muted-foreground mb-6">
              {error || 'No pudimos verificar los detalles de tu compra.'}
            </p>
            <button
              onClick={() => router.push('/cart')}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Volver al carrito
            </button>
          </>
        )}
      </div>
    </div>
  );
}