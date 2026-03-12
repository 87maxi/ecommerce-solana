'use client';

export function LoadingDashboard() {
  return (
    <div className="min-h-screen bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent sm:text-5xl sm:tracking-tight">
            Panel de Administración
          </h1>
          <p className="mt-4 text-lg text-slate-400">
            Cargando información del usuario...
          </p>
        </div>

        <div className="mt-8">
          <div className="flex justify-center items-center py-12">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-700"></div>
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-cyan-500 absolute top-0 left-0 shadow-lg shadow-cyan-500/50"></div>
            </div>
            <span className="ml-4 text-slate-300 font-medium">
              Determinando rol de usuario...
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
