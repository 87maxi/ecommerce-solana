"use client";

import { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
console.log('[PaymentForm] Environment check:');
console.log('[PaymentForm] - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:', publishableKey);
console.log('[PaymentForm] - Key length:', publishableKey.length);
console.log('[PaymentForm] - Starts with pk_test:', publishableKey.startsWith('pk_test_'));
const stripePromise = loadStripe(publishableKey);

interface PaymentData {
  amount: string;
  walletAddress: string;
  invoice: string;
  redirectUrl: string;
}

function CheckoutForm({ paymentData }: { paymentData: PaymentData }) {
  const stripe = useStripe();
  const elements = useElements();
  const [message, setMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${paymentData.redirectUrl}?success=true&amount=${paymentData.amount}&wallet=${paymentData.walletAddress}&invoice=${paymentData.invoice}`,
      },
    });

    if (error) {
      setMessage(error.message || 'An error occurred');
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
      <div className="bg-slate-800/50 p-5 rounded-xl border border-slate-700 mb-6 backdrop-blur-sm">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm text-slate-400 font-medium uppercase tracking-wider">A Pagar</span>
          <span className="text-2xl font-bold text-white font-mono">€{paymentData.amount}</span>
        </div>
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm text-slate-400 font-medium uppercase tracking-wider">Recibirás</span>
          <span className="text-xl font-bold text-emerald-400 font-mono">{paymentData.amount} EURT</span>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-700 flex justify-between items-center">
          <span className="text-xs text-slate-500 uppercase tracking-wider">Wallet Conectada</span>
          <span className="text-xs font-mono text-indigo-300 bg-indigo-900/30 px-3 py-1.5 rounded-full border border-indigo-500/30">
            {paymentData.walletAddress.slice(0, 6)}...{paymentData.walletAddress.slice(-4)}
          </span>
        </div>
      </div>

      <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 backdrop-blur-sm">
        <PaymentElement options={{
          layout: 'accordion',
          fields: {
            billingDetails: {
              name: 'auto',
              email: 'auto',
              address: 'auto'
            }
          }
        }} />
      </div>

      {message && (
        <div className="p-4 bg-red-900/20 border border-red-500/30 text-red-400 rounded-xl text-sm flex items-start backdrop-blur-sm">
          <span className="mr-2">⚠️</span>
          <span>{message}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={isProcessing || !stripe || !elements}
        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] transition-all duration-300 py-4 px-6 rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transform hover:-translate-y-0.5"
      >
        {isProcessing ? (
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
            <span>Procesando...</span>
          </div>
        ) : (
          `Confirmar Pago • €${paymentData.amount}`
        )}
      </button>

      <div className="flex items-center justify-center gap-2 mt-4 opacity-50">
        <span className="text-xs text-slate-500">Secured by</span>
        <span className="font-bold text-slate-400 italic">Stripe</span>
      </div>
    </form>
  );
}

const PaymentForm = () => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [amount, setAmount] = useState<number>(100);
  const [redirectUrl, setRedirectUrl] = useState<string>('');
  const [invoice, setInvoice] = useState<string>('');

  // Inicializar directamente con los datos de la URL
  useEffect(() => {
    console.log('[PaymentForm] Initializing...');
    const params = new URLSearchParams(window.location.search);
    const amountParam = params.get('amount');
    const walletParam = params.get('walletAddress');
    const invoiceParam = params.get('invoice');
    const redirect = params.get('redirect');

    console.log('[PaymentForm] URL params:', { amountParam, walletParam, invoiceParam, redirect });

    if (amountParam && walletParam) {
      const data: PaymentData = {
        amount: amountParam,
        walletAddress: walletParam,
        invoice: invoiceParam || `EURT_${Date.now()}`,
        redirectUrl: redirect || (process.env.NEXT_PUBLIC_WEB_CUSTOMER_URL || 'http://localhost:3030') + '/payment-success'
      };
      console.log('[PaymentForm] Payment data:', data);
      setPaymentData(data);
      setAmount(parseFloat(amountParam));
      setWalletAddress(walletParam);
      setInvoice(data.invoice);

      // Iniciar creación del PaymentIntent inmediatamente
      console.log('[PaymentForm] Creating payment intent...');
      createPaymentIntent(data);
    } else {
      console.error('[PaymentForm] Missing required params:', { amountParam, walletParam });
      setError('Faltan datos de pago. Por favor inicia el proceso desde la tienda.');
      setLoading(false);
    }
  }, []);

  const createPaymentIntent = async (data: PaymentData) => {
    try {
      console.log('[PaymentForm] Fetching payment intent from API...');
      const res = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(data.amount),
          walletAddress: data.walletAddress,
          invoice: data.invoice
        }),
      });

      console.log('[PaymentForm] API response status:', res.status);
      const responseData = await res.json();
      console.log('[PaymentForm] API response data:', responseData);

      if (responseData.error) {
        throw new Error(responseData.error);
      }

      console.log('[PaymentForm] Client secret received:', responseData.clientSecret ? 'YES' : 'NO');
      setClientSecret(responseData.clientSecret);
    } catch (err: any) {
      console.error('[PaymentForm] Error creating payment intent:', err);
      setError('Error al crear la intención de pago: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-700/50 shadow-2xl p-8 rounded-2xl w-full max-w-lg mx-auto text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-900 border-t-indigo-500 mx-auto"></div>
        <p className="mt-4 text-slate-400 font-medium">Iniciando pasarela segura...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-700/50 shadow-2xl p-8 rounded-2xl w-full max-w-lg mx-auto">
        <div className="p-4 bg-red-900/20 border border-red-500/30 text-red-400 rounded-xl flex items-center gap-3">
          <span className="text-2xl">❌</span>
          <div>
            <h3 className="font-bold">Error</h3>
            <p className="text-sm opacity-80">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-700/50 shadow-2xl rounded-2xl w-full max-w-lg mx-auto overflow-hidden transition-all duration-300 min-h-[500px]">
      <div className="bg-slate-900/50 p-6 border-b border-slate-700/50 flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Confirmar Pago</h2>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs text-emerald-400 font-mono">SECURE</span>
        </div>
      </div>

      <div className="p-6 md:p-8">
        <div className="animate-fade-in">
          {!clientSecret ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-900 border-t-indigo-500"></div>
              <p className="mt-4 text-slate-500 text-sm animate-pulse">Conectando con Stripe...</p>
            </div>
          ) : (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret: clientSecret,
                locale: 'es'
              }}
            >
              <CheckoutForm paymentData={paymentData as PaymentData} />
            </Elements>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentForm;