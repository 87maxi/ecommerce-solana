'use client';

import Link from 'next/link';

export function UnregisteredDashboard() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 animate-fade-in">
      <div className="max-w-4xl mx-auto w-full">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 rounded-full mb-6 shadow-lg shadow-cyan-500/20">
            <svg
              className="w-12 h-12 text-cyan-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent sm:text-5xl mb-4">
            Bienvenido a la Plataforma
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Tu billetera está conectada. Elige cómo quieres participar en nuestro ecosistema.
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-xl border border-cyan-500/20 p-8 mb-8">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-lg font-semibold text-slate-200 mb-2">Comienza tu Experiencia</h3>
              <div className="text-slate-300 space-y-2">
                <p>
                  Para interactuar con la plataforma y gestionar productos o compras, necesitas un
                  perfil activo:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1 text-slate-400">
                  <li>
                    <strong className="text-slate-300">Empresa:</strong> Si deseas vender y
                    administrar tus productos
                  </li>
                  <li>
                    <strong className="text-slate-300">Cliente:</strong> Si deseas explorar y
                    comprar productos (próximamente)
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-xl border border-cyan-500/20 p-8 mb-8">
          <h3 className="text-lg font-semibold text-slate-200 mb-6 text-center">
            Selecciona tu Perfil
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link
              href="/companies"
              className="group relative flex flex-col items-center p-6 border-2 border-cyan-500/30 rounded-xl hover:border-cyan-400/50 hover:shadow-lg hover:shadow-cyan-500/20 transition-all duration-200 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 hover:from-cyan-500/20 hover:to-purple-500/20"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-cyan-500/30 group-hover:shadow-cyan-500/50 transition-all">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-cyan-300 mb-2">Registrar Empresa</h4>
              <p className="text-sm text-slate-400 text-center">
                Crea tu empresa y comienza a vender productos en la plataforma
              </p>
            </Link>

            <div className="group relative flex flex-col items-center p-6 border-2 border-slate-600/30 rounded-xl bg-slate-700/20 opacity-60 cursor-not-allowed">
              <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-slate-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-slate-500 mb-2">Registrar Cliente</h4>
              <p className="text-sm text-slate-600 text-center">
                Próximamente disponible para comprar productos
              </p>
              <span className="absolute top-4 right-4 inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-700/50 border border-slate-600/30 text-slate-500">
                Próximamente
              </span>
            </div>
          </div>
        </div>

        {/* Info Footer */}
        <div className="mt-8 text-center text-sm text-slate-500">
          <p>¿Necesitas ayuda? Contacta al administrador del sistema</p>
        </div>
      </div>
    </div>
  );
}
