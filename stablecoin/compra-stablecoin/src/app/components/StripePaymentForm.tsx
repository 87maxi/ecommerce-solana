"use client";

import { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

interface StripePaymentFormProps {
    amount: number;
    walletAddress: string;
    invoice: string;
    redirectUrl: string;
}

export default function StripePaymentForm({ amount, walletAddress, invoice, redirectUrl }: StripePaymentFormProps) {
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
                return_url: `${redirectUrl}?success=true&amount=${amount}&wallet=${walletAddress}&invoice=${invoice}`,
            },
        });

        if (error) {
            setMessage(error.message || 'An error occurred');
            setIsProcessing(false);
        }
        // If success, Stripe redirects automatically
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-slate-800/50 p-5 rounded-xl border border-slate-700 mb-6 backdrop-blur-sm">
                <div className="flex justify-between items-center mb-3">
                    <span className="text-sm text-slate-400 font-medium uppercase tracking-wider">A Pagar</span>
                    <span className="text-2xl font-bold text-white font-mono">€{amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center mb-4">
                    <span className="text-sm text-slate-400 font-medium uppercase tracking-wider">Recibirás</span>
                    <span className="text-xl font-bold text-emerald-400 font-mono">{amount} EURT</span>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-700 flex justify-between items-center">
                    <span className="text-xs text-slate-500 uppercase tracking-wider">Wallet Conectada</span>
                    <span className="text-xs font-mono text-indigo-300 bg-indigo-900/30 px-3 py-1.5 rounded-full border border-indigo-500/30">
                        {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
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
                    `Confirmar Pago • €${amount.toFixed(2)}`
                )}
            </button>

            <div className="flex items-center justify-center gap-2 mt-4 opacity-50">
                <span className="text-xs text-slate-500">Secured by</span>
                <span className="font-bold text-slate-400 italic">Stripe</span>
            </div>
        </form>
    );
}
