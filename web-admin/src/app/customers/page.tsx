'use client';

import React from 'react';
import Link from 'next/link';
import { RoleGuard } from '../../components/RoleGuard';
import { Users, Code, ArrowLeft } from 'lucide-react';

function CustomersPageContent() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Users className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-white tracking-tight">Gestión de Clientes</h1>
            <p className="text-slate-400 mt-1 font-medium">
              Listado y gestión de usuarios registrados en la plataforma.
            </p>
          </div>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition-all border border-slate-700 text-sm font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Dashboard
        </Link>
      </div>

      {/* Under Development Notice */}
      <div className="flex flex-col items-center justify-center text-center bg-slate-800/40 border border-amber-500/20 rounded-3xl p-12 sm:p-20 backdrop-blur-sm">
        <div className="w-24 h-24 rounded-full bg-amber-500/10 flex items-center justify-center border-2 border-amber-500/20 mb-8">
          <Code className="w-12 h-12 text-amber-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">Funcionalidad en Desarrollo</h2>
        <p className="text-slate-400 max-w-lg mx-auto leading-relaxed">
          La gestión de clientes es una característica planificada que requiere una actualización
          del programa on-chain. Próximamente podrás ver y administrar los perfiles de tus
          compradores desde aquí.
        </p>
      </div>
    </div>
  );
}

export default function CustomersPage() {
  return (
    <RoleGuard allowedRoles={['admin']}>
      <CustomersPageContent />
    </RoleGuard>
  );
}
