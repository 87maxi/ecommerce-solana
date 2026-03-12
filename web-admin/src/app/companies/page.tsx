'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

import { useContract } from '../../hooks/useContract';
import { useWallet } from '../../hooks/useWallet';
import {
  normalizeCompany,
  normalizeArrayResponse,
} from '../../lib/contractUtils';
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
  const { isConnected, provider, signer, chainId, switchNetwork } = useWallet();
  const ecommerceContract = useContract('Ecommerce', provider, signer, chainId);

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
    if (!ecommerceContract) {
      setLoading(false);
      return;
    }

    const loadCompanies = async () => {
      try {
        setLoading(true);
        console.log('Loading companies...');

        const companyIdsResult = await ecommerceContract.getAllCompanies();

        // Handle different return types using utility function
        const companyIds = normalizeArrayResponse(companyIdsResult);

        // Validate company IDs
        if (companyIds.length === 0) {
          setCompanies([]);
          return;
        }

        const companyDataPromises = companyIds.map(async (id: any) => {
          try {
            // Ensure ID is in correct format
            const companyId = typeof id === 'bigint' ? id : BigInt(id);

            const companyResult = await ecommerceContract.getCompany(companyId);

            // Normalize company data using utility function
            const normalizedCompany = normalizeCompany(companyResult, id);

            return normalizedCompany;
          } catch (err) {
            console.error(`Error loading company ${id}:`, err);
            return null;
          }
        });

        const companyDataResults = await Promise.all(companyDataPromises);
        const companyData = companyDataResults.filter(
          (c: Company | null): c is Company => c !== null
        );

        setCompanies(companyData);
      } catch (err) {
        console.error('Error loading companies:', err);
        setError(
          'Failed to load companies: ' +
          (err instanceof Error ? err.message : String(err))
        );
      } finally {
        setLoading(false);
      }
    };

    loadCompanies();
  }, [ecommerceContract]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!ecommerceContract) {
      if (isConnected && chainId !== 31337 && chainId !== 1) {
        try {
          // Try to switch to local network first, if that fails, show error
          await switchNetwork(31337);
        } catch (err) {
          console.error('Failed to switch network:', err);
          setError(
            'Error al cambiar de red. Por favor, cambia manualmente a Localhost 8545 o Ethereum Mainnet.'
          );
        }
      }
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      console.log('Registering company with data:', formData);
      const tx = await ecommerceContract.registerCompany(
        formData.address,
        formData.name,
        formData.description
      );
      console.log('Transaction sent:', tx);
      await tx.wait();
      console.log('Transaction confirmed');

      // Refresh companies list
      const companyIdsResult = await ecommerceContract.getAllCompanies();
      const companyIds = normalizeArrayResponse(companyIdsResult);

      const companyDataPromises = companyIds.map(async (id: any) => {
        try {
          const companyResult = await ecommerceContract.getCompany(id);
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

      setCompanies(companyData);
      setFormData({ address: '', name: '', description: '' });
    } catch (err: any) {
      console.error('Error registering company:', err);
      setError(err.message || 'Failed to register company');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-slate-200">
            Acceso Restringido
          </h1>
          <p className="mt-4 text-lg text-slate-400">
            Por favor, conecta tu billetera para acceder al panel de
            administración.
          </p>
          <div className="mt-8">
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Conectar Billetera
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-200">
              Gestión de Empresas
            </h1>
            <p className="mt-2 text-sm text-slate-300">
              Registra nuevas empresas y gestiona las existentes en el
              e-commerce descentralizado.
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-4 py-2 border border-cyan-500/30 rounded-md shadow-sm text-sm font-medium text-slate-300 bg-slate-800/50 hover:bg-slate-700/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg
              className="-ml-1 mr-2 h-5 w-5 text-slate-400"
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulario de Registro */}
          <div className="bg-[var(--card)] shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-slate-200 mb-6">
              Registrar Nueva Empresa
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-md text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="address"
                  className="block text-sm font-medium text-slate-300"
                >
                  Dirección de la Empresa
                </label>
                <input
                  type="text"
                  id="address"
                  value={formData.address}
                  onChange={e =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="mt-1 block w-full border border-[var(--muted-light)] rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[var(--primary)] focus:border-[var(--primary)] bg-[var(--card)] text-[var(--foreground)]"
                  placeholder="0x..."
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-slate-300"
                >
                  Nombre
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={e =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="mt-1 block w-full border border-[var(--muted-light)] rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[var(--primary)] focus:border-[var(--primary)] bg-[var(--card)] text-[var(--foreground)]"
                  placeholder="Nombre de la empresa"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-slate-300"
                >
                  Descripción
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={e =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  className="mt-1 block w-full border border-[var(--muted-light)] rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[var(--primary)] focus:border-[var(--primary)] bg-[var(--card)] text-[var(--foreground)]"
                  placeholder="Descripción de la empresa"
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${!ecommerceContract && isConnected
                    ? 'bg-yellow-600 hover:bg-yellow-700'
                    : 'bg-[var(--primary)] hover:bg-[var(--primary-dark)]'
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary)] disabled:opacity-50`}
                >
                  {submitting
                    ? 'Procesando...'
                    : !ecommerceContract && isConnected
                      ? 'Cambiar a Red Soportada'
                      : 'Registrar Empresa'}
                </button>
              </div>
            </form>
          </div>

          {/* Lista de Empresas */}
          <div className="bg-[var(--card)] shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-slate-200 mb-6">
              Empresas Registradas
            </h2>

            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <span className="ml-2 text-slate-300">Cargando empresas...</span>
              </div>
            ) : companies.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-8m8 0v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4h18z"
                  />
                </svg>
                <p className="mt-2">
                  {!ecommerceContract && isConnected
                    ? 'Conecta a la red Localhost para ver las empresas'
                    : 'No hay empresas registradas'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {companies.map(company => (
                  <div
                    key={company.id}
                    className="border border-[var(--border)] rounded-lg p-4 hover:bg-[var(--muted-light)]"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium text-slate-200">
                          {company.name}
                        </h3>
                        <p className="text-sm text-slate-300 mt-1">
                          {company.description}
                        </p>
                        <div className="mt-2 text-xs text-slate-400 space-y-1">
                          <p>ID: {company.id}</p>
                          <p>Propietario: {formatAddress(company.owner)}</p>
                          <p>
                            Estado: {company.isActive ? 'Activa' : 'Inactiva'}
                          </p>
                          <p>Registrada: {formatDate(company.createdAt)}</p>
                        </div>
                      </div>
                      <Link
                        href={`/company/${company.id}`}
                        className="ml-4 px-3 py-1 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700"
                      >
                        Gestionar
                      </Link>
                    </div>
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
