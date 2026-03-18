'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import {
  FileText,
  Search,
  Filter,
  Download,
  ExternalLink,
  Loader2,
  AlertCircle,
  Calendar,
  User,
  Building2,
  RefreshCw,
} from 'lucide-react';

import { useContract } from '../../hooks/useContract';
import { useRole } from '../../contexts/RoleContext';
import { RoleGuard } from '../../components/RoleGuard';
import { formatAddress } from '../../lib/utils';
import { Invoice } from '../../types';

export default function OrdersPage() {
  return (
    <RoleGuard allowedRoles={['admin', 'company_owner']}>
      <OrdersPageContent />
    </RoleGuard>
  );
}

function OrdersPageContent() {
  const { connection } = useConnection();
  const { publicKey, signTransaction, signAllTransactions } = useWallet();
  const { roleInfo, isLoading: roleLoading } = useRole();

  const signer = useMemo(
    () =>
      publicKey && signTransaction && signAllTransactions
        ? { publicKey, signTransaction, signAllTransactions }
        : null,
    [publicKey, signTransaction, signAllTransactions]
  );

  const ecommerceContract = useContract('Ecommerce', connection, signer, null);

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'pending'>('all');

  const loadInvoices = useCallback(async () => {
    if (!ecommerceContract) return;

    try {
      setLoading(true);
      setError(null);
      console.log('[OrdersPage] Cargando facturas desde la blockchain...');

      const allInvoices: Invoice[] = await ecommerceContract.getAllInvoices();

      // Filtrar según el rol
      const filteredByRole = allInvoices.filter((inv: any) => {
        if (roleInfo.role === 'admin') return true;
        if (roleInfo.role === 'company_owner' && roleInfo.companyNumericId) {
          return inv.companyId?.toString() === roleInfo.companyNumericId?.toString();
        }
        return false;
      });

      // Ordenar por fecha descendente
      const sorted = filteredByRole.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      setInvoices(sorted);
    } catch (err: any) {
      console.error('Error fetching invoices:', err);
      setError(err.message || 'Error al cargar el historial de ventas');
    } finally {
      setLoading(false);
    }
  }, [ecommerceContract, roleInfo]);

  useEffect(() => {
    if (!roleLoading) {
      loadInvoices();
    }
  }, [loadInvoices, roleLoading]);

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch =
      inv.customerAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'paid' && inv.isPaid) ||
      (filterStatus === 'pending' && !inv.isPaid);

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight">Historial de Ventas</h1>
          <p className="text-slate-400 mt-2 font-medium">
            {roleInfo.role === 'admin'
              ? 'Supervisión global de todas las facturas emitidas en la red'
              : `Registro de ventas para ${roleInfo.companyName || 'tu empresa'}`}
          </p>
        </div>

        <button
          onClick={loadInvoices}
          disabled={loading}
          className="p-3 rounded-2xl bg-slate-800 text-slate-400 border border-slate-700 hover:text-cyan-400 hover:border-cyan-500/30 transition-all flex items-center gap-2"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          <span className="text-sm font-bold">Actualizar</span>
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por dirección de cliente o hash..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-slate-800/50 border border-slate-700/50 rounded-2xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all backdrop-blur-sm"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as any)}
            className="w-full pl-12 pr-4 py-4 bg-slate-800/50 border border-slate-700/50 rounded-2xl text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 appearance-none transition-all cursor-pointer backdrop-blur-sm"
          >
            <option value="all">Todos los estados</option>
            <option value="paid">Pagadas</option>
            <option value="pending">Pendientes</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-6 flex items-center gap-4 text-rose-300">
          <AlertCircle className="w-6 h-6 flex-shrink-0" />
          <p className="font-medium">{error}</p>
        </div>
      )}

      {/* Table / Cards */}
      {loading && invoices.length === 0 ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div
              key={i}
              className="h-24 bg-slate-800/40 rounded-2xl border border-slate-700/50 animate-pulse"
            />
          ))}
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-3xl p-20 text-center backdrop-blur-sm">
          <FileText className="w-16 h-16 text-slate-700 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-white mb-2">No hay facturas</h2>
          <p className="text-slate-500">No se encontraron ventas que coincidan con los filtros.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredInvoices.map(invoice => (
            <div
              key={invoice.id}
              className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 hover:border-cyan-500/30 transition-all group backdrop-blur-sm"
            >
              <div className="flex flex-col lg:flex-row justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div
                    className={`p-3 rounded-xl ${invoice.isPaid ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}
                  >
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-white text-lg">
                        Factura #{invoice.id.slice(0, 8)}
                      </h3>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                          invoice.isPaid
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}
                      >
                        {invoice.isPaid ? 'Pagada' : 'Pendiente'}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-sm text-slate-500">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {invoice.timestamp.toLocaleDateString()}{' '}
                        {invoice.timestamp.toLocaleTimeString()}
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span className="font-mono">{formatAddress(invoice.customerAddress)}</span>
                      </div>
                      {roleInfo.role === 'admin' && (
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          <span className="font-bold text-slate-400">
                            Empresa: {invoice.companyId}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 lg:text-right">
                  <div className="flex-grow lg:flex-grow-0">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
                      Monto Total
                    </p>
                    <p className="text-2xl font-black text-white font-mono">
                      {invoice.totalAmount} <span className="text-cyan-500 text-sm">EURT</span>
                    </p>
                  </div>

                  <div className="flex gap-2 w-full sm:w-auto">
                    {invoice.ipfsCid && (
                      <a
                        href={`http://localhost:8080/ipfs/${invoice.ipfsCid}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-slate-700/50 hover:bg-cyan-600 text-white rounded-xl text-xs font-bold transition-all border border-slate-600/50"
                      >
                        <Download className="w-4 h-4" />
                        PDF KUBO
                      </a>
                    )}
                    {invoice.paymentTxHash && (
                      <a
                        href={`https://explorer.solana.com/tx/${invoice.paymentTxHash}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all border border-slate-600/50"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Explorer
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
