'use client';

import { useDashboardData } from '@/hooks/useDashboardData';

import { RoleAwareNavigation } from '../RoleAwareNavigation';
import { StatsCard } from '../StatsCard';

export function CustomerDashboard() {
  const {
    data: dashboardData,
    loading: dashboardLoading,
    error: dashboardError,
  } = useDashboardData();

  const stats = [
    {
      title: 'Ordenes',
      value: '0',
      icon: (
        <svg
          className="h-6 w-6 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9v6m14-6v-2a2 2 0 00-2-2H9a2 2 0 00-2 2"
          />
        </svg>
      ),
      color: 'bg-blue-500',
    },
    {
      title: 'Total Gastado',
      value: '0',
      icon: (
        <svg
          className="h-6 w-6 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      color: 'bg-yellow-500',
    },
    {
      title: 'Última Compra',
      value: 'Nunca',
      icon: (
        <svg
          className="h-6 w-6 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      color: 'bg-purple-500',
    },
    {
      title: 'Productos',
      value: '0',
      icon: (
        <svg
          className="h-6 w-6 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
      ),
      color: 'bg-green-500',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/30 mb-4">
          Rol: Cliente
        </div>
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent sm:text-5xl sm:tracking-tight">
          Panel del Cliente
        </h1>
        <p className="mt-4 text-lg text-slate-400">
          Gestiona tus órdenes, productos y actividad en el e-commerce
          descentralizado
        </p>
      </div>

      {dashboardError ? (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 backdrop-blur-sm">
          <p className="text-red-300">{dashboardError}</p>
        </div>
      ) : dashboardLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-700"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-cyan-500 absolute top-0 left-0 shadow-lg shadow-cyan-500/50"></div>
          </div>
          <span className="ml-4 text-slate-300 font-medium">Cargando datos...</span>
        </div>
      ) : (
        <>
          {/* Estadísticas */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => (
              <StatsCard
                key={index}
                title={stat.title}
                value={stat.value}
                icon={stat.icon}
                color={stat.color}
              />
            ))}
          </div>

          <RoleAwareNavigation />
        </>
      )}
    </div>
  );
}
