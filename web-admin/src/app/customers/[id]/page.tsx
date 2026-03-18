'use client';

import { useParams } from 'next/navigation';
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Loader2, AlertCircle, ArrowLeft, FileText, ExternalLink } from 'lucide-react';
import { useGlobalContract } from '../../../contexts/ContractContext';
import { useRole } from '../../../contexts/RoleContext';
import { RoleGuard } from '../../../components/RoleGuard';
import { formatAddress } from '../../../lib/utils';
import { getIPFSUrl } from '../../../lib/ipfs-local';
import { Invoice } from '../../../types';

function CustomerDetailPageContent() {
  const params = useParams();
  const customerAddress = params?.id ? (Array.isArray(params.id) ? params.id[0] : params.id) : null;

  const { roleInfo } = useRole();
  const { ecommerceContract } = useGlobalContract();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadInvoiceData = useCallback(async () => {
    if (!ecommerceContract || !customerAddress) return;

    setLoading(true);
    setError(null);
    try {
      let invoiceData = await ecommerceContract.getCustomerInvoices(customerAddress);

      // Si es dueño de empresa, filtrar para ver solo sus facturas
      if (roleInfo.role === 'company_owner' && roleInfo.companyNumericId) {
        invoiceData = invoiceData.filter(
          (inv: any) => inv.companyId?.toString() === roleInfo.companyNumericId?.toString()
        );
      }

      setInvoices(
        invoiceData.sort((a: Invoice, b: Invoice) => b.timestamp.getTime() - a.timestamp.getTime())
      );
    } catch (err: any) {
      setError(err.message || 'Error al cargar las facturas del cliente.');
    } finally {
      setLoading(false);
    }
  }, [ecommerceContract, customerAddress, roleInfo]);

  useEffect(() => {
    loadInvoiceData();
  }, [loadInvoiceData]);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/customers" className="p-3 bg-slate-800 rounded-xl hover:bg-slate-700">
          <ArrowLeft className="w-5 h-5 text-slate-300" />
        </Link>
        <div>
          <h1 className="text-3xl font-black text-white">Historial de Compras</h1>
          <p className="text-slate-500 font-mono text-xs">{customerAddress}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-12 h-12 animate-spin text-cyan-500" />
        </div>
      ) : error ? (
        <div className="p-8 bg-rose-500/10 text-rose-300 rounded-2xl">
          <AlertCircle className="inline w-6 h-6 mr-2" />
          {error}
        </div>
      ) : (
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-3xl">
          {invoices.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <FileText className="w-12 h-12 mx-auto mb-4" />
              <p>Este cliente no tiene facturas registradas.</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-700/50">
              {invoices.map(invoice => (
                <li key={invoice.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-white">Compra #{invoice.id.slice(0, 8)}...</p>
                      <p className="text-xs text-slate-400">{invoice.timestamp.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-xl text-cyan-400 font-mono">
                        {invoice.totalAmount} EURT
                      </p>
                      <a
                        href={getIPFSUrl(invoice.ipfsCid)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-slate-500 hover:text-cyan-400 transition-colors flex items-center gap-1 justify-end"
                      >
                        Ver Factura IPFS <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-700/50 text-xs font-mono text-slate-500">
                    <p>
                      <strong>Tx Hash:</strong> {invoice.paymentTxHash}
                    </p>
                    <p>
                      <strong>CID:</strong> {invoice.ipfsCid}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default function CustomerDetailPage() {
  return (
    <RoleGuard allowedRoles={['admin', 'company_owner']}>
      <CustomerDetailPageContent />
    </RoleGuard>
  );
}
