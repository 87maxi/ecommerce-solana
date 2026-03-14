'use client';

import Link from 'next/link';
import React, { useState, useEffect, useMemo } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';

import { useContract } from '../../hooks/useContract';
import { normalizeCompany, normalizeArrayResponse } from '../../lib/contractUtils';
import { formatAddress, formatDate } from '../../lib/utils';
import { Company } from '../../types';
import { RoleGuard } from '../../components/RoleGuard';

type CompanyFormData = {
  address: string;
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
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const publicKeyString = publicKey?.toBase58();
  const signer = useMemo(() => (publicKey ? { publicKey } : null), [publicKeyString]);
  const ecommerceContract = useContract('Ecommerce', connection, signer, null);

  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<CompanyFormData>({
    address: '',
    name: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (!connected || !ecommerceContract) {
      if (isMounted) setLoading(false);
      return;
    }

    const loadCompanies = async () => {
      try {
        if (isMounted) {
          setLoading(true);
          setError(null);
        }
        console.log('Loading companies...');

        const companyIdsResult = await ecommerceContract.getAllCompanies();
        const companyIds = normalizeArrayResponse(companyIdsResult);

        if (companyIds.length === 0) {
          if (isMounted) setCompanies([]);
          return;
        }

        const companyDataPromises = companyIds.map(async (id: any) => {
          try {
            const companyId = typeof id === 'bigint' ? id : BigInt(id);
            const companyResult = await ecommerceContract.getCompany(companyId);
            return normalizeCompany(companyResult, id);
          } catch (err) {
            console.error(`Error loading company ${id}:`, err);
            return null;
          }
        });

        const companyDataResults = await Promise.all(companyDataPromises);
        const companyData = companyDataResults.filter(
          (c: Company | null): c is Company => c !== null
        );

        if (isMounted) setCompanies(companyData);
      } catch (err) {
        console.error('Error loading companies:', err);
        if (isMounted) {
          setError(
            'Failed to load companies: ' + (err instanceof Error ? err.message : String(err))
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadCompanies();

    return () => {
      isMounted = false;
    };
  }, [ecommerceContract, connected, publicKeyString]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!ecommerceContract) {
      setError('Contrato no disponible. Verifica tu conexión.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      console.log('Registering company with data:', formData);
      const tx = await ecommerceContract.registerCompany(
        formData.address, // En Solana esto sería una PublicKey (string base58)
        formData.name,
        formData.description
      );
      console.log('Transaction sent/mocked:', tx);
      if (tx && typeof tx.wait === 'function') {
        await tx.wait();
      }
      console.log('Transaction confirmed');

      // Refresh companies list (mocked for now)
      const companyIdsResult = await ecommerceContract.getAllCompanies();
      const companyIds = normalizeArrayResponse(companyIdsResult);

      const companyDataPromises = companyIds.map(async (id: any) => {
        try {
          const companyResult = await ecommerceContract.getCompany(id);
          return normalizeCompany(companyResult, id);
        } catch (err) {
          return null;
        }
      });

      const companyDataResults = await Promise.all(companyDataPromises);
      const companyData = companyDataResults.filter(
        (c: Company | null): c is Company => c !== null
      );

      setCompanies(companyData);
      setFormData({ address: '', name: '', description: '' });
    } catch (err: any) {
      console.error('Error registering company:', err);
      setError(err.message || 'Failed to register company');
    } finally {
      setSubmitting(false);
    }
  };

  if (!connected) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 bg-slate-900 rounded-2xl border border-cyan-500/20 shadow-2xl">
        <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/30 mb-6 animate-pulse">
          <svg
            className="w-10 h-10 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-8m8 0v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4h18zm-4-12v.01M8 13v.01M12 13v.01M8 17v.01M12 17v.01M8 9v.01M12 9v.01"
            />
          </svg>
        </div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-4 text-center">
          Acceso Restringido
        </h2>
        <p className="text-slate-400 text-center max-w-md mb-8">
          Por favor, conecta tu billetera de Solana para acceder a la gestión de empresas del
          E-Commerce.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Gestión de Empresas</h1>
          <p className="mt-2 text-sm text-slate-400">
            Registra nuevas empresas y gestiona las existentes en el e-commerce descentralizado.
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center px-4 py-2 border border-slate-700 rounded-xl shadow-sm text-sm font-medium text-slate-300 bg-slate-800/50 hover:bg-slate-700 hover:text-white focus:outline-none transition-all"
        >
          <svg
            className="-ml-1 mr-2 h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
              clipRule="evenodd"
            />
          </svg>
          Actualizar
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Formulario de Registro */}
        <div className="xl:col-span-1">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 shadow-xl rounded-2xl p-6 sticky top-24">
            <h2 className="text-xl font-semibold text-white mb-6">Registrar Nueva Empresa</h2>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-sm flex items-start gap-3">
                <svg
                  className="w-5 h-5 flex-shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="address"
                  className="block text-sm font-medium text-slate-300 mb-1.5"
                >
                  Dirección de la Empresa (Pubkey) <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  id="address"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
                  placeholder="Ej: 8yCgaxbTDGiWe6Xu..."
                  required
                />
              </div>

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-1.5">
                  Nombre <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
                  placeholder="Nombre de la empresa"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-slate-300 mb-1.5"
                >
                  Descripción
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all resize-none"
                  placeholder="Descripción detallada..."
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting || !ecommerceContract}
                  className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-cyan-500/20 text-sm font-bold text-white bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5"
                >
                  {submitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                      Procesando...
                    </>
                  ) : (
                    'Registrar Empresa'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Lista de Empresas */}
        <div className="xl:col-span-2">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 shadow-xl rounded-2xl p-6 min-h-[500px]">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <svg
                className="w-5 h-5 text-cyan-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-8m8 0v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4h18zm-4-12v.01M8 13v.01M12 13v.01M8 17v.01M12 17v.01M8 9v.01M12 9v.01"
                />
              </svg>
              Empresas Registradas
            </h2>

            {loading ? (
              <div className="flex flex-col justify-center items-center py-20 space-y-4">
                <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-slate-400 font-medium">
                  Cargando directorio de empresas...
                </span>
              </div>
            ) : companies.length === 0 ? (
              <div className="text-center py-20 bg-slate-900/30 rounded-xl border border-dashed border-slate-700">
                <svg
                  className="mx-auto h-16 w-16 text-slate-600 mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-8m8 0v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4h18zm-4-12v.01M8 13v.01M12 13v.01M8 17v.01M12 17v.01M8 9v.01M12 9v.01"
                  />
                </svg>
                <p className="text-lg font-medium text-slate-300">No hay empresas registradas</p>
                <p className="text-sm text-slate-500 mt-1">
                  Utiliza el formulario para registrar la primera empresa.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
                {companies.map(company => (
                  <div
                    key={company.id}
                    className="group border border-slate-700/50 bg-slate-800/80 rounded-xl p-5 hover:bg-slate-700/50 hover:border-cyan-500/30 transition-all duration-300 shadow-md hover:shadow-cyan-500/10 flex flex-col h-full"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-cyan-400 font-bold shadow-inner">
                          {company.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-lg leading-tight group-hover:text-cyan-400 transition-colors">
                            {company.name}
                          </h3>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider mt-1 ${
                              company.isActive
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}
                          >
                            {company.isActive ? 'Activa' : 'Inactiva'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-slate-400 mb-6 line-clamp-3 flex-grow">
                      {company.description || 'Sin descripción disponible.'}
                    </p>

                    <div className="space-y-2 mb-6 bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">ID</span>
                        <span className="text-slate-300 font-mono">#{company.id}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Propietario</span>
                        <span className="text-cyan-400 font-mono" title={company.owner}>
                          {formatAddress(company.owner)}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Registro</span>
                        <span className="text-slate-300">{formatDate(company.createdAt)}</span>
                      </div>
                    </div>

                    <Link
                      href={`/company/${company.id}`}
                      className="w-full py-2.5 bg-slate-700 text-white text-sm font-medium rounded-lg hover:bg-cyan-600 transition-colors flex items-center justify-center gap-2 group-hover:shadow-lg"
                    >
                      <span>Gestionar Empresa</span>
                      <svg
                        className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M14 5l7 7m0 0l-7 7m7-7H3"
                        />
                      </svg>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
