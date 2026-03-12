'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

import { useContract } from '../../hooks/useContract';
import { useWallet } from '../../hooks/useWallet';
import { formatAddress, formatDate } from '../../lib/utils';
import { Customer } from '../../types';

export default function CustomersPage() {
  const { isConnected, provider, signer, chainId } = useWallet();
  const ecommerceContract = useContract('Ecommerce', provider, signer, chainId);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ecommerceContract) return;

    const loadCustomers = async () => {
      try {
        setLoading(true);
        // Esta función necesita ser implementada en el contrato
        // Por ahora mostramos un mensaje indicando que se implementará
        setError('Funcionalidad pendiente de implementación en el contrato');
      } catch (err) {
        console.error('Error loading customers:', err);
        setError('Failed to load customers');
      } finally {
        setLoading(false);
      }
    };

    loadCustomers();
  }, [ecommerceContract]);

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-200">
            Gestión de Clientes
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            Gestiona todos los clientes registrados en el e-commerce
            descentralizado.
          </p>
        </div>

        <div className="bg-[var(--card)] shadow rounded-lg p-6">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <span className="ml-2 text-slate-300">Cargando clientes...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
                <p className="text-yellow-800">{error}</p>
              </div>
              <Link
                href="/companies"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Ver Empresas
              </Link>
            </div>
          ) : customers.length === 0 ? (
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
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <p className="mt-2">No hay clientes registrados</p>
            </div>
          ) : (
            <div className="space-y-4">
              {customers.map(customer => (
                <div
                  key={customer.id}
                  className="border border-[var(--border)] rounded-lg p-4 hover:bg-[var(--muted-light)]"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium text-slate-200">
                        {customer.name}
                      </h3>
                      <p className="text-sm text-slate-300 mt-1">
                        {customer.email}
                      </p>
                      <div className="mt-2 text-xs text-slate-400 space-y-1">
                        <p>ID: {customer.id}</p>
                        <p>Dirección: {formatAddress(customer.address)}</p>
                        <p>Registrado: {formatDate(customer.registeredAt)}</p>
                        <p>
                          Estado: {customer.isActive ? 'Activo' : 'Inactivo'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
