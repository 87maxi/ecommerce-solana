'use client';

import Link from 'next/link';

type ErrorDashboardProps = {
  error?: string;
};

export function ErrorDashboard({ error }: ErrorDashboardProps) {
  return (
    <div className="min-h-screen bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent sm:text-5xl sm:tracking-tight">
            Error en el Panel
          </h1>
          <p className="mt-4 text-lg text-slate-400">
            Ocurrió un error al determinar su rol de usuario
          </p>
        </div>

        <div className="mt-8">
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 max-w-2xl mx-auto backdrop-blur-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 001.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-300">
                  Error al determinar rol
                </h3>
                <div className="mt-2 text-sm text-red-400">
                  <p>
                    {error ||
                      'Ocurrió un error desconocido al determinar su rol en el sistema.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/"
              className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-lg text-white bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all duration-200"
            >
              Reintentar
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
