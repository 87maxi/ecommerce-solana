"use client";

import { useEffect, useState } from 'react';

export default function Confirmation() {
  const [status, setStatus] = useState<string | null>(null);
  const [amount, setAmount] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment_intent_client_secret = params.get('payment_intent_client_secret');
    const redirect_status = params.get('redirect_status');
    const amountParam = params.get('amount');
    const invoiceParam = params.get('invoice');

    if (amountParam) setAmount(amountParam);
    if (invoiceParam) setInvoice(invoiceParam);

    if (redirect_status === 'succeeded') {
      setStatus('succeeded');
    } else if (redirect_status === 'processing') {
      setStatus('processing');
    } else if (redirect_status === 'requires_payment_method') {
      setStatus('failed');
    } else {
      setStatus('unknown');
    }
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 p-4">
      <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-8 rounded-2xl shadow-2xl max-w-md w-full text-center relative overflow-hidden">

        {/* Decorative background */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500"></div>
        <div className="absolute inset-0 bg-indigo-500/5 blur-3xl rounded-full pointer-events-none"></div>

        <div className="mb-8 relative">
          {status === 'succeeded' ? (
            <div className="relative inline-block p-4 bg-emerald-500/10 rounded-full border border-emerald-500/30">
              <svg className="w-16 h-16 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ) : status === 'failed' ? (
            <div className="relative inline-block p-4 bg-red-500/10 rounded-full border border-red-500/30">
              <svg className="w-16 h-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          ) : (
            <div className="relative inline-block p-4 bg-indigo-500/10 rounded-full border border-indigo-500/30">
              <svg className="animate-spin w-16 h-16 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          )}
        </div>

        <h1 className="text-3xl font-bold text-white mb-2">
          {status === 'succeeded' ? '¡Pago Exitoso!' :
            status === 'processing' ? 'Procesando Pago...' :
              status === 'failed' ? 'Pago Fallido' : 'Estado Desconocido'}
        </h1>

        <p className="text-slate-400 mb-8">
          {status === 'succeeded' ? 'Tus EuroTokens han sido asignados a tu billetera.' :
            status === 'processing' ? 'Estamos confirmando tu transacción.' :
              'Hubo un problema con tu pago. Por favor intenta nuevamente.'}
        </p>

        {status === 'succeeded' && amount && (
          <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700/50 space-y-3 mb-8">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">Monto Total</span>
              <span className="text-white font-mono font-bold text-lg">€{amount}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-800">
              <span className="text-slate-400 text-sm">Tokens Recibidos</span>
              <span className="text-emerald-400 font-mono font-bold text-lg">{amount} EURT</span>
            </div>
            {invoice && (
              <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                <span className="text-slate-400 text-xs">Referencia</span>
                <span className="text-slate-500 text-xs font-mono">{invoice}</span>
              </div>
            )}
          </div>
        )}

        <div className="mt-4">
          <a
            href={`${process.env.NEXT_PUBLIC_WEB_CUSTOMER_URL || 'http://localhost:3030'}${status === 'succeeded' ? '?success=true&amount=' + amount + (invoice ? '&invoice=' + invoice : '') : ''}`}
            className="block w-full py-3 px-4 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition-colors"
          >
            Volver a la Tienda
          </a>
        </div>
      </div>
    </div>
  );
}