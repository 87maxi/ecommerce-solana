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

export function useDashboardData() {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  // Pass null for chainId as it's not used in the Solana refactor
  const ecommerceContract = useContract('Ecommerce', connection, { publicKey }, null);

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

        // Fetch company count
        let companyCount = 0;
        try {
          const companyIdsResult = await ecommerceContract.getAllCompanies();
          const companyIds = normalizeArrayResponse(companyIdsResult);
          companyCount = companyIds.length;
        } catch (e) {
          console.warn('Could not fetch companies:', e);
        }

        // Fetch product count
        let productCount = 0;
        try {
          const productIdsResult = await ecommerceContract.getAllProducts();
          const productIds = normalizeArrayResponse(productIdsResult);
          productCount = productIds.length;
        } catch (e) {
          console.warn('Could not fetch products:', e);
        }

        // In a real Anchor program, getting customer count might require fetching all PDA accounts
        // of a specific type or keeping a counter in the global state.
        // For the mock transition, we'll return a dummy value or what the mock provides.
        const customerCount = 0;

        // Same for sales and transactions.
        const totalSales = 0;
        const recentTransactions: any[] = [];

        if (isMounted) {
          setData({
            companyCount,
            productCount,
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

    // Optionally set up polling or subscriptions here

    return () => {
      isMounted = false;
    };
  }, [ecommerceContract]);

  return { data, loading, error };
}
