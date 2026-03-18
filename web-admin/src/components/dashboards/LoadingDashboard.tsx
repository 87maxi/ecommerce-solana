'use client';

export function LoadingDashboard() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 animate-fade-in">
      <div className="relative mb-8">
        <div className="animate-spin rounded-full h-20 w-20 border-4 border-slate-800"></div>
        <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-cyan-500 absolute top-0 left-0 shadow-lg shadow-cyan-500/50"></div>
      </div>
      <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-4">
        Conectando a tu espacio...
      </h2>
      <p className="text-slate-400 text-lg max-w-md mx-auto">
        Verificando credenciales y preparando el panel de control de forma segura en la blockchain.
      </p>
    </div>
  );
}
