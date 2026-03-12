'use client';

import { useRole } from '../contexts/RoleContext';

export function RoleIndicator() {
  const { roleInfo, isLoading } = useRole();

  if (isLoading) {
    return (
      <div className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-800/50 border border-cyan-500/30 text-slate-400">
        <div className="w-2 h-2 bg-cyan-400 rounded-full mr-2 animate-pulse"></div>
        Cargando...
      </div>
    );
  }

  const getRoleConfig = () => {
    switch (roleInfo.role) {
      case 'admin':
        return {
          text: 'Administrador',
          bgColor: 'bg-gradient-to-r from-red-500/20 to-rose-500/20',
          textColor: 'text-red-300',
          borderColor: 'border-red-500/30',
        };
      case 'company_owner':
        return {
          text: `Propietario${roleInfo.companyName ? ` de ${roleInfo.companyName}` : ''}`,
          bgColor: 'bg-gradient-to-r from-orange-500/20 to-amber-500/20',
          textColor: 'text-orange-300',
          borderColor: 'border-orange-500/30',
        };
      case 'customer':
        return {
          text: 'Cliente',
          bgColor: 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20',
          textColor: 'text-cyan-300',
          borderColor: 'border-cyan-500/30',
        };
      case 'unregistered':
        return {
          text: 'No registrado',
          bgColor: 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20',
          textColor: 'text-yellow-300',
          borderColor: 'border-yellow-500/30',
        };
      case 'error':
        return {
          text: 'Error',
          bgColor: 'bg-gradient-to-r from-red-500/20 to-rose-500/20',
          textColor: 'text-red-300',
          borderColor: 'border-red-500/30',
        };
      default:
        return {
          text: 'Desconocido',
          bgColor: 'bg-slate-800/50',
          textColor: 'text-slate-400',
          borderColor: 'border-slate-600/30',
        };
    }
  };

  const config = getRoleConfig();

  return (
    <div
      className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium border ${config.bgColor} ${config.textColor} ${config.borderColor}`}
    >
      {config.text}
    </div>
  );
}
