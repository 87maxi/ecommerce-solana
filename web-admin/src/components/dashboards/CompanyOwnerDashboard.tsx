'use client';

import { useDashboardData } from '@/hooks/useDashboardData';

import { RoleAwareNavigation } from '../RoleAwareNavigation';
import { StatsCard } from '../StatsCard';

type CompanyOwnerDashboardProps = {
  companyId?: string;
  companyName?: string;
};

export function CompanyOwnerDashboard({
  companyId,
  companyName,
}: CompanyOwnerDashboardProps) {
  const {
    data: dashboardData,
    loading: dashboardLoading,
    error: dashboardError,
  } = useDashboardData();

  // Filter products and sales for this company only
  // This would require modifications to useDashboardData to filter by company

  // For now, we'll show all data but with a notice about company ownership

  const stats = [
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
    {
      title: 'Ventas',
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
      title: 'Facturas',
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
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
      color: 'bg-blue-500',
    },
    {
      title: 'Clientes',
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
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
      color: 'bg-purple-500',
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            Mi Empresa{companyName ? `: ${companyName}` : ''}
          </h1>
          <p className="text-sm sm:text-base text-slate-400 mt-2">
            Gestiona tus productos y pedidos
          </p>
        </div>
        <div className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-gradient-to-r from-orange-500/20 to-amber-500/20 text-orange-300 border border-orange-500/30 self-start">
          Rol: Propietario de Empresa
        </div>
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
