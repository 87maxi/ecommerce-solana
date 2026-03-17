'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import Link from 'next/link';
import { Users, Loader2, AlertCircle, FileText, ArrowRight } from 'lucide-react';
import { useContract } from '../../hooks/useContract';
import { RoleGuard } from '../../components/RoleGuard';
import { formatAddress } from '../../lib/utils';
import { Invoice } from '../../types';

type CustomerData = {
  address: string;
  purchaseCount: number;
};

function CustomersPageContent() {
  const { connection } = useConnection();
  const ecommerceContract = useContract('Ecommerce', connection, null, null);

  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCustomerData = async () => {
      if (!ecommerceContract) return;

      setLoading(true);
      setError(null);
      try {
        const allInvoices: Invoice[] = await ecommerceContract.getAllInvoices();

        if (!allInvoices || allInvoices.length === 0) {
          setCustomers([]);
          return;
        }

        // Agrupar facturas por cliente para generar la lista de clientes
        const customerMap = new Map<string, number>();
        allInvoices.forEach(invoice => {
          const address = invoice.customerAddress.toString();
          customerMap.set(address, (customerMap.get(address) || 0) + 1);
        });

        const customerList: CustomerData[] = Array.from(customerMap.entries()).map(
          ([address, purchaseCount]) => ({ address, purchaseCount })
        );

        setCustomers(customerList);
      } catch (err: any) {
        setError(err.message || 'Error al procesar los datos de los clientes.');
      } finally {
        setLoading(false);
      }
    };

    loadCustomerData();
  }, [ecommerceContract]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight">Directorio de Clientes</h1>
          <p className="text-slate-400 mt-2 font-medium">
            Listado de todas las wallets que han realizado compras en la plataforma.
          </p>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-10 h-10 text-cyan-500 animate-spin" />
        </div>
      )}

      {error && (
        <div className="p-8 bg-rose-500/10 text-rose-300 rounded-2xl text-center">
          <AlertCircle className="mx-auto w-10 h-10 mb-4" />
          <p className="font-bold">{error}</p>
        </div>
      )}

      {!loading &&
        !error &&
        (customers.length === 0 ? (
          <div className="p-16 text-center bg-slate-800/30 rounded-3xl border-dashed border-2 border-slate-700">
            <Users className="w-16 h-16 text-slate-600 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white">Aún no hay clientes</h2>
            <p className="text-slate-500">
              Cuando se realice la primera compra, el cliente aparecerá aquí.
            </p>
          </div>
        ) : (
          <div className="bg-slate-800/40 rounded-3xl border border-slate-700/50 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {customers.map(customer => (
                <Link
                  href={`/customers/${customer.address}`}
                  key={customer.address}
                  className="group p-6 border-b border-r border-slate-700/50 hover:bg-cyan-500/5 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                        <Users className="w-5 h-5 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase text-slate-500 tracking-widest">
                          Cliente
                        </p>
                        <p className="font-mono text-sm text-cyan-400 group-hover:underline">
                          {formatAddress(customer.address)}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-700/50 flex items-center gap-2 text-sm text-slate-300">
                    <FileText className="w-4 h-4 text-slate-500" />
                    <strong>{customer.purchaseCount}</strong>
                    <span>
                      {customer.purchaseCount === 1 ? 'compra registrada' : 'compras registradas'}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
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
