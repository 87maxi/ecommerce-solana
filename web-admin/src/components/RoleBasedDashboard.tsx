'use client';

import { useRole } from '../contexts/RoleContext';

import { AdminDashboard } from './dashboards/AdminDashboard';
import { CompanyOwnerDashboard } from './dashboards/CompanyOwnerDashboard';
import { CustomerDashboard } from './dashboards/CustomerDashboard';
import { ErrorDashboard } from './dashboards/ErrorDashboard';
import { LoadingDashboard } from './dashboards/LoadingDashboard';
import { UnregisteredDashboard } from './dashboards/UnregisteredDashboard';

export function RoleBasedDashboard() {
  const { roleInfo, isLoading, isDisconnected } = useRole();

  if (isDisconnected) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 animate-fade-in">
        <div className="w-24 h-24 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-full flex items-center justify-center mb-8 border border-cyan-500/30 shadow-lg shadow-cyan-500/20">
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
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
            />
          </svg>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-6 tracking-tight">
          Bienvenido al Panel de Administración
        </h1>
        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Para comenzar a gestionar tu e-commerce, por favor conecta tu billetera usando el botón en
          la parte superior.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingDashboard />;
  }

  switch (roleInfo.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'company_owner':
      return (
        <CompanyOwnerDashboard companyId={roleInfo.companyId} companyName={roleInfo.companyName} />
      );
    case 'customer':
      return <CustomerDashboard />;
    case 'unregistered':
      return <UnregisteredDashboard />;
    case 'error':
      return <ErrorDashboard error={roleInfo.error} />;
    default:
      return <UnregisteredDashboard />;
  }
}
