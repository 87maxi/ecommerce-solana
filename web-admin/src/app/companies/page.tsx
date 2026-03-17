'use client';

import Link from 'next/link';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import {
  Building,
  Plus,
  Loader2,
  AlertCircle,
  Search,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { useContract } from '../../hooks/useContract';
import { formatAddress, formatDate } from '../../lib/utils';
import { Company } from '../../types';
import { RoleGuard } from '../../components/RoleGuard';

type CompanyFormData = {
  name: string;
  description: string;
};

export default function CompaniesPage() {
  return (
    <RoleGuard allowedRoles={['admin']}>
      <CompaniesPageContent />
    </RoleGuard>
  );
}

function CompaniesPageContent() {
  const { publicKey, signTransaction, signAllTransactions } = useWallet();
  const { connection } = useConnection();
  const signer = useMemo(
    () =>
      publicKey && signTransaction && signAllTransactions
        ? { publicKey, signTransaction, signAllTransactions }
        : null,
    [publicKey, signTransaction, signAllTransactions]
  );
  const ecommerceContract = useContract('Ecommerce', connection, signer, null);

  console.log('[CompaniesPage] Wallet conectada:', publicKey?.toBase58());
  console.log('[CompaniesPage] Contrato inicializado:', !!ecommerceContract);

  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CompanyFormData>({ name: '', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const loadCompanies = useCallback(async () => {
    if (!ecommerceContract) return;

    setLoading(true);
    setError(null);
    try {
      console.log('[CompaniesPage] Cargando empresas desde la blockchain...');
      // The contract hook is now optimized to return full company data
      const allCompaniesData = await ecommerceContract.getAllCompanies();
      console.log('[CompaniesPage] Datos crudos recibidos:', allCompaniesData);

      // Relajamos el filtro: mostramos cualquier empresa que tenga un ID válido,
      // ignorando temporalmente el flag isActive por si hay inconsistencias on-chain.
      const visibleCompanies = allCompaniesData.filter((c: Company) => c && c.id);
      console.log('[CompaniesPage] Empresas filtradas para visualización:', visibleCompanies);

      setCompanies(visibleCompanies);
    } catch (err: any) {
      setError(err.message || 'Error al cargar las empresas desde la blockchain.');
    } finally {
      setLoading(false);
    }
  }, [ecommerceContract]);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.description) {
      setError('Nombre y descripción son obligatorios.');
      return;
    }
    if (!ecommerceContract || ecommerceContract.isReadOnly) {
      setError('Conecta tu wallet para registrar una empresa.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const tx = await ecommerceContract.registerCompany(formData.name, formData.description);
      await tx.wait();

      setFormData({ name: '', description: '' });
      setShowForm(false);
      await loadCompanies(); // Refresh list
    } catch (err: any) {
      setError(err.message || 'Fallo al registrar la empresa.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight">Gestión de Empresas</h1>
          <p className="text-slate-400 mt-2 font-medium">
            Registra y supervisa las empresas activas en la plataforma.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-2xl shadow-xl shadow-cyan-500/20 transition-all transform hover:-translate-y-1 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span>{showForm ? 'Ocultar Formulario' : 'Registrar Empresa'}</span>
        </button>
      </div>

      {/* Add Company Form (Collapsible) */}
      {showForm && (
        <div className="bg-slate-800/40 p-8 rounded-3xl border border-slate-700/50 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-300">
          <form onSubmit={handleSubmit} className="space-y-6">
            <h3 className="text-xl font-bold text-white mb-6">Nueva Empresa</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 ml-1">
                  Nombre de la Empresa
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-900/50 border border-white/5 rounded-2xl px-5 py-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all font-semibold"
                  placeholder="Ej: Tech Innovators"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 ml-1">
                  Descripción Corta
                </label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-900/50 border border-white/5 rounded-2xl px-5 py-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all resize-none"
                  placeholder="Venta de hardware y software..."
                  rows={2}
                />
              </div>
            </div>
            {error && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-sm font-bold flex items-center gap-3">
                <AlertCircle className="w-5 h-5" />
                {error}
              </div>
            )}
            <div className="flex justify-end pt-4 border-t border-white/5">
              <button
                type="submit"
                disabled={submitting}
                className="px-8 py-3 rounded-xl text-sm font-black uppercase tracking-widest text-white bg-cyan-600 hover:bg-cyan-500 shadow-lg shadow-cyan-900/20 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirmar Registro'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Companies List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="h-48 bg-slate-800/40 rounded-3xl border border-slate-700/50 animate-pulse"
            />
          ))}
        </div>
      ) : companies.length === 0 ? (
        <div className="bg-slate-800/30 border-2 border-slate-700/50 rounded-3xl p-16 text-center backdrop-blur-sm border-dashed">
          <Building className="w-16 h-16 text-slate-600 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-white mb-2">No hay empresas activas</h2>
          <p className="text-slate-500 max-w-md mx-auto">
            Actualmente no hay empresas registradas o activas en la plataforma. Utiliza el
            formulario para añadir la primera.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.map(company => (
            <div
              key={company.id}
              className="group bg-slate-800/40 rounded-3xl border border-slate-700/50 hover:border-cyan-500/30 transition-all duration-300 p-6 flex flex-col"
            >
              <div className="flex-grow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors">
                    {company.name}
                  </h3>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Activa
                  </div>
                </div>
                <p className="text-slate-400 text-sm line-clamp-2 mb-6 h-10">
                  {company.description}
                </p>
              </div>
              <div className="mt-auto pt-6 border-t border-white/5 space-y-3">
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <span>Propietario</span>
                  <span className="text-slate-300 font-mono">{formatAddress(company.owner)}</span>
                </div>
                <Link
                  href={`/company/${company.id}`}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700/50 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-600/50 transition-all"
                >
                  Gestionar Empresa
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
