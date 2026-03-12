"use client";

import PaymentForm from './components/PaymentForm';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4" data-test="pasarela-page">
      <div className="w-full max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 mb-4">
            Pasarela Web3
          </h1>
          <p className="text-slate-400">Adquiere EuroTokens de forma segura y descentralizada.</p>
        </header>
        <PaymentForm />
      </div>
    </div>
  );
}