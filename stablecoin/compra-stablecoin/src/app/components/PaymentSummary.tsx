"use client";

import { type FC } from 'react';

interface PaymentSummaryProps {
    amount: number;
    walletAddress: string;
    invoice?: string;
    fees?: number;
}

const PaymentSummary: FC<PaymentSummaryProps> = ({
    amount,
    walletAddress,
    invoice,
    fees = 0
}) => {
    const total = amount + fees;
    const tokensToReceive = amount; // 1:1 ratio

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="text-center space-y-2">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/20 animate-in zoom-in duration-300">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                </div>
                <h3 className="text-xl font-bold text-white">Resumen de Compra</h3>
                <p className="text-slate-400 text-sm">Verifica los detalles antes de continuar</p>
            </div>

            {/* Main Summary Card */}
            <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 backdrop-blur-sm overflow-hidden">
                {/* Amount Section */}
                <div className="p-6 space-y-4">
                    <div className="flex justify-between items-center pb-4 border-b border-slate-700/50">
                        <div className="text-slate-400 text-sm font-medium uppercase tracking-wider">
                            Monto a Pagar
                        </div>
                        <div className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent font-mono">
                            €{amount.toFixed(2)}
                        </div>
                    </div>

                    {/* Fees (if any) */}
                    {fees > 0 && (
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-400">Comisión de procesamiento</span>
                            <span className="text-slate-300 font-mono">€{fees.toFixed(2)}</span>
                        </div>
                    )}

                    {/* Tokens to Receive */}
                    <div className="flex justify-between items-center py-3 border-t border-slate-700/50">
                        <div className="text-slate-400 text-sm font-medium uppercase tracking-wider">
                            Tokens a Recibir
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent font-mono">
                                {tokensToReceive.toFixed(2)}
                            </div>
                            <span className="text-cyan-500/70 text-sm font-bold">EURT</span>
                        </div>
                    </div>

                    {/* Exchange Rate Info */}
                    <div className="flex items-center justify-center gap-2 py-2 px-4 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                        <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-xs text-indigo-300">
                            Tasa de cambio: <strong>1 EUR = 1 EURT</strong>
                        </span>
                    </div>
                </div>

                {/* Wallet & Invoice Section */}
                <div className="px-6 pb-6 space-y-3">
                    {/* Wallet Address */}
                    <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-700/30">
                        <div className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <div className="flex-1 min-w-0">
                                <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                                    Wallet de Destino
                                </div>
                                <div className="font-mono text-sm text-slate-200 break-all">
                                    {walletAddress}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Invoice (if provided) */}
                    {invoice && (
                        <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-700/30">
                            <div className="flex items-center gap-3">
                                <svg className="w-5 h-5 text-cyan-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                <div className="flex-1">
                                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">
                                        Referencia
                                    </div>
                                    <div className="font-mono text-sm text-slate-300">
                                        {invoice}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Total Section */}
                {fees > 0 && (
                    <div className="px-6 py-4 bg-slate-900/30 border-t border-slate-700/50">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-bold text-white uppercase tracking-wider">
                                Total a Pagar
                            </span>
                            <span className="text-2xl font-bold text-white font-mono">
                                €{total.toFixed(2)}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Security Notice */}
            <div className="flex items-start gap-3 p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/20">
                <svg className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <div className="flex-1">
                    <p className="text-xs text-emerald-300 leading-relaxed">
                        <strong className="font-semibold">Transacción Segura:</strong> Todos tus datos están protegidos con encriptación de última generación. Los tokens se enviarán automáticamente a tu wallet tras confirmar el pago.
                    </p>
                </div>
            </div>

            {/* Estimated Time */}
            <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Tiempo estimado de procesamiento: <strong className="text-slate-400">1-2 minutos</strong></span>
            </div>
        </div>
    );
};

export default PaymentSummary;
