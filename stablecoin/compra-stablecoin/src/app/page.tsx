"use client";

import EuroTokenPurchase from './components/EuroTokenPurchase';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 mb-4">
            Compra EuroToken (EURT)
          </h1>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto">
            Adquiere tokens EuroToken 1:1 con euros utilizando tu tarjeta de crédito.
            Los tokens serán enviados directamente a tu billetera MetaMask.
          </p>
        </div>

        <div className="flex justify-center">
          <EuroTokenPurchase />
        </div>
      </div>
    </div>
  );
}
