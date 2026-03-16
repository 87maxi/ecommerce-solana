'use client';

import React from 'react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useWallet } from '@solana/wallet-adapter-react';
import { RoleAwareNavigation } from '../RoleAwareNavigation';
import { StatsCard } from '../StatsCard';
import {
  ShoppingBag,
  TrendingUp,
  FileText,
  Users,
  Building2,
  PlusCircle,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

type CompanyOwnerDashboardProps = {
  companyId?: string;
  companyName?: string;
};

export function CompanyOwnerDashboard({ companyId, companyName }: CompanyOwnerDashboardProps) {
  const { publicKey } = useWallet();
  const {
    data: dashboardData,
    loading: dashboardLoading,
    error: dashboardError,
  } = useDashboardData(publicKey?.toBase58());

  const stats = [
    {
      title: 'Mis Productos',
      value: dashboardData?.productCount?.toLocaleString() || '0',
      icon: <ShoppingBag className="h-6 w-6 text-white" />,
      color: 'bg-emerald-500',
      description: 'Items activos en catálogo',
    },
    {
      title: 'Ventas Totales',
      value: dashboardData?.totalSales?.toLocaleString() || '0',
      icon: <TrendingUp className="h-6 w-6 text-white" />,
      color: 'bg-amber-500',
      description: 'Volumen acumulado (EURT)',
    },
    {
      title: 'Facturas',
      value: dashboardData?.recentTransactions?.length.toString() || '0',
      icon: <FileText className="h-6 w-6 text-white" />,
      color: 'bg-blue-500',
      description: 'Documentos generados',
    },
    {
      title: 'Empresas',
      value: dashboardData?.companyCount?.toLocaleString() || '0',
      icon: <Building2 className="h-6 w-6 text-white" />,
      color: 'bg-purple-500',
      description: 'Registradas a tu nombre',
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      {/* Header section with business context */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Panel de Control
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
            {companyName ? `Bienvenido, ${companyName}` : 'Mi Negocio'}
          </h1>
          <p className="text-slate-400 max-w-2xl leading-relaxed">
            Gestiona el inventario de tu empresa, revisa tus facturas de venta y supervisa el
            rendimiento de tus productos en la red Solana.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/products"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 transition-all border border-slate-700 text-sm font-semibold"
          >
            <ShoppingBag className="w-4 h-4" />
            Gestionar Stock
          </Link>
          <Link
            href="/products"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:from-cyan-500 hover:to-blue-500 shadow-lg shadow-cyan-500/20 transition-all text-sm font-semibold"
          >
            <PlusCircle className="w-4 h-4" />
            Nuevo Producto
          </Link>
        </div>
      </div>

      {dashboardError ? (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-6 backdrop-blur-md flex items-center gap-4">
          <div className="p-3 rounded-full bg-rose-500/20">
            <svg
              className="w-6 h-6 text-rose-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-rose-200 font-bold">Error al cargar datos</h3>
            <p className="text-rose-300/70 text-sm">{dashboardError}</p>
          </div>
        </div>
      ) : dashboardLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map(i => (
            <div
              key={i}
              className="h-32 bg-slate-800/50 rounded-2xl border border-slate-700/50 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <>
          {/* Quick Actions / Role Badge */}
          <div className="flex items-center gap-4 p-4 bg-slate-800/30 rounded-2xl border border-slate-700/50 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
              <Users className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-tighter">
                Estado de Cuenta
              </p>
              <p className="text-sm text-slate-200 font-medium">
                Propietario de Empresa Autorizado
              </p>
            </div>
            <div className="ml-auto hidden sm:block">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-[11px] text-slate-400">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                Conectado a Solana Devnet
              </div>
            </div>
          </div>

          {/* Estadísticas Filtradas */}
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

          {/* Quick Shortcuts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-800/40 p-6 rounded-3xl border border-slate-700/50 hover:border-cyan-500/30 transition-all group">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-cyan-400" />
                Control de Inventario
              </h3>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                Revisa el stock actual de tus productos. Mantén los precios actualizados y asegúrate
                de que los productos tengan imágenes adecuadas para mejorar las ventas.
              </p>
              <Link
                href="/products"
                className="inline-flex items-center text-cyan-400 text-sm font-bold hover:text-cyan-300 transition-colors"
              >
                Ir al catálogo de productos{' '}
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="bg-slate-800/40 p-6 rounded-3xl border border-slate-700/50 hover:border-purple-500/30 transition-all group">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-400" />
                Mis Facturas
              </h3>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                Accede al historial completo de ventas. Descarga facturas para tu contabilidad y
                realiza un seguimiento del estado de los pagos on-chain.
              </p>
              <button className="inline-flex items-center text-purple-400 text-sm font-bold hover:text-purple-300 transition-colors opacity-50 cursor-not-allowed">
                Ver historial de facturación <ArrowRight className="ml-2 w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="pt-4">
            <RoleAwareNavigation />
          </div>
        </>
      )}
    </div>
  );
}
