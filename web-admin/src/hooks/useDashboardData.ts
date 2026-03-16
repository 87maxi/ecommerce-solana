'use client';

import { useState, useEffect, useMemo } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { normalizeArrayResponse } from '../lib/contractUtils';
import { useContract } from './useContract';

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
 * If ownerAddress is provided, counts will only include entities related to that owner.
 */
export function useDashboardData(ownerAddress?: string) {
  const { publicKey } = useWallet();
  const { connection } = useConnection();

  // Memoize signer to avoid unnecessary re-renders
  const signer = useMemo(() => (publicKey ? { publicKey } : null), [publicKey?.toBase58()]);

  // Initialize ecommerce contract
  const ecommerceContract = useContract('Ecommerce', connection, signer, null);

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
        console.log('[useDashboardData] Starting data fetch...');

        // 1. Fetch Companies
        const companyIdsResult = await ecommerceContract.getAllCompanies();
        console.log('[useDashboardData] companyIdsResult:', companyIdsResult);
        const allCompanyIds = normalizeArrayResponse(companyIdsResult);

        let ownedCompanyIds: string[] = [];
        let finalCompanyCount = 0;

        if (ownerAddress) {
          // Filter companies owned by this address
          for (const id of allCompanyIds) {
            try {
              const company = await ecommerceContract.getCompany(id);
              // Compare addresses in lowercase to avoid case sensitivity issues
              if (company.owner.toString().toLowerCase() === ownerAddress.toLowerCase()) {
                ownedCompanyIds.push(id.toString());
              }
            } catch (e) {
              console.warn(`Error fetching company ${id}:`, e);
            }
          }
          finalCompanyCount = ownedCompanyIds.length;
        } else {
          finalCompanyCount = allCompanyIds.length;
        }
        console.log('[useDashboardData] finalCompanyCount:', finalCompanyCount);

        // 2. Fetch Products
        const productIdsResult = await ecommerceContract.getAllProducts();
        console.log('[useDashboardData] productIdsResult:', productIdsResult);
        const allProductIds = normalizeArrayResponse(productIdsResult);

        let finalProductCount = 0;

        if (ownerAddress) {
          // Count products belonging to the owner's companies
          // If the user owns multiple companies, we count products for all of them
          for (const pid of allProductIds) {
            try {
              const product = await ecommerceContract.getProduct(pid);
              if (ownedCompanyIds.includes(product.companyId.toString())) {
                finalProductCount++;
              }
            } catch (e) {
              console.warn(`Error fetching product ${pid}:`, e);
            }
          }
        } else {
          finalProductCount = allProductIds.length;
        }

        // 3. Customer and Sales (Placeholders for extended logic)
        // In current Solana contract iteration, global sales and customer counts
        // might require indexing or specific counter accounts.
        const customerCount = 0;
        const totalSales = 0;
        const recentTransactions: any[] = [];

        console.log('[useDashboardData] finalProductCount:', finalProductCount);

        if (isMounted) {
          setData({
            companyCount: finalCompanyCount,
            productCount: finalProductCount,
            customerCount,
            totalSales,
            recentTransactions,
          });
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
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
