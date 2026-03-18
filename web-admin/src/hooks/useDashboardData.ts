'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useGlobalContract } from '../contexts/ContractContext';

// Define types for our dashboard data
type DashboardData = {
  companyCount: number;
  productCount: number;
  customerCount: number;
  totalSales: number;
  recentTransactions: any[];
};

/**
 * Hook to fetch dashboard data, with optional filtering by owner address.
 * If ownerAddress is provided, counts and lists will only include entities related to that owner's companies.
 */
export function useDashboardData(ownerAddress?: string) {
  const { publicKey } = useWallet();
  const { ecommerceContract } = useGlobalContract();

  const [data, setData] = useState<DashboardData>({
    companyCount: 0,
    productCount: 0,
    customerCount: 0,
    totalSales: 0,
    recentTransactions: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (!ecommerceContract) {
      if (isMounted) setLoading(false);
      return;
    }

    const fetchDashboardData = async () => {
      try {
        if (isMounted) setLoading(true);
        setError(null);
        console.log('[useDashboardData] Iniciando carga de datos para dashboard...');

        // 1. Fetch all relevant data categories in parallel for maximum efficiency
        // Our hook's getAll... methods use getProgramAccounts (batch fetch)
        const [allCompanies, allProducts, allInvoices] = await Promise.all([
          ecommerceContract.getAllCompanies(),
          ecommerceContract.getAllProducts(),
          ecommerceContract.getAllInvoices(),
        ]);

        console.log('[useDashboardData] Carga masiva completada:', {
          totalCompanies: allCompanies.length,
          totalProducts: allProducts.length,
          totalInvoices: allInvoices.length,
        });

        // 2. Filter Companies by Owner
        let ownedCompanies = allCompanies;
        if (ownerAddress) {
          console.log('[useDashboardData] Filtrando por propietario:', ownerAddress);
          ownedCompanies = allCompanies.filter((c: any) => {
            const isMatch = c.owner.toLowerCase() === ownerAddress.toLowerCase();
            if (isMatch)
              console.log(
                `[useDashboardData] Empresa propia encontrada: ${c.name} (ID: ${c.id}, NumericID: ${c.numericId})`
              );
            return isMatch;
          });
        }

        // Use numeric IDs for filtering products and invoices as stored in Solana contract
        const ownedCompanyNumericIds = ownedCompanies.map(
          (c: any) => c.numericId || c.id.toString()
        );
        const finalCompanyCount = ownedCompanies.length;
        console.log(
          '[useDashboardData] IDs numéricos de empresas propias:',
          ownedCompanyNumericIds
        );

        // 3. Filter Products belonging to those companies
        let relevantProducts = allProducts;
        if (ownerAddress) {
          relevantProducts = allProducts.filter((p: any) => {
            const isRelevant = ownedCompanyNumericIds.includes(p.companyId.toString());
            return isRelevant;
          });
          console.log(
            `[useDashboardData] Productos filtrados: ${relevantProducts.length} de ${allProducts.length}`
          );
        }
        const finalProductCount = relevantProducts.length;

        // 4. Filter Invoices belonging to those companies and calculate sales
        let relevantInvoices = allInvoices;
        if (ownerAddress) {
          relevantInvoices = allInvoices.filter((inv: any) => {
            const isRelevant = ownedCompanyNumericIds.includes(inv.companyId.toString());
            return isRelevant;
          });
          console.log(
            `[useDashboardData] Facturas filtradas: ${relevantInvoices.length} de ${allInvoices.length}`
          );
        }

        const paidInvoices = relevantInvoices.filter((inv: any) => inv.isPaid);
        const totalSales = paidInvoices.reduce(
          (acc: number, inv: any) => acc + parseFloat(inv.totalAmount || '0'),
          0
        );

        // 5. Unique Customers derived from the filtered invoices
        const uniqueCustomers = new Set(relevantInvoices.map((inv: any) => inv.customerAddress));
        const customerCount = uniqueCustomers.size;

        // 6. Map Recent Transactions (latest 5)
        const recentTransactions = relevantInvoices
          .sort((a: any, b: any) => b.timestamp.getTime() - a.timestamp.getTime())
          .slice(0, 5)
          .map((inv: any) => ({
            id: inv.id,
            type: 'Venta',
            amount: `${inv.totalAmount} EURT`,
            from: inv.customerAddress,
            to: inv.companyId,
            timestamp: inv.timestamp.toISOString(),
            status: inv.isPaid ? 'completed' : 'pending',
            ipfsCid: inv.ipfsCid,
          }));

        if (isMounted) {
          setData({
            companyCount: finalCompanyCount,
            productCount: finalProductCount,
            customerCount,
            totalSales,
            recentTransactions,
          });
          console.log('[useDashboardData] Estadísticas actualizadas con éxito.');
        }
      } catch (err) {
        console.error('[useDashboardData] Error fatal cargando dashboard:', err);
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : 'Error desconocido al cargar los datos del dashboard'
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDashboardData();

    return () => {
      isMounted = false;
    };
  }, [ecommerceContract, ownerAddress]);

  return { data, loading, error };
}
