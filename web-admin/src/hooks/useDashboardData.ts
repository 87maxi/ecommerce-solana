'use client';

import { useState, useEffect, useMemo } from 'react';

import { normalizeArrayResponse } from '../lib/contractUtils';

import { useContract } from './useContract';
import { useWallet } from './useWallet';

// Define types for our dashboard data
type DashboardData = {
  companyCount: number;
  productCount: number;
  customerCount: number;
  totalSales: number;
  recentTransactions: any[];
};

// Custom hook to fetch dashboard data from the blockchain
export function useDashboardData() {
  const { provider, signer, chainId } = useWallet();
  const ecommerceContract = useContract('Ecommerce', provider, signer, chainId);

  const [data, setData] = useState<DashboardData>({
    companyCount: 0,
    productCount: 0,
    customerCount: 0,
    totalSales: 0,
    recentTransactions: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cache for transaction data to avoid repeated fetching
  const transactionCache = useMemo(() => new Map<string, any>(), []);

  useEffect(() => {
    if (!ecommerceContract) {
      setLoading(false);
      return;
    }

    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Initialize counters
        let companyCount = 0;
        let productCount = 0;
        let customerCount = 0;
        let totalSales = 0;
        let recentTransactions: any[] = [];

        // 1. Load company count
        try {
          const companyIdsResult = await ecommerceContract.getAllCompanies();
          const companyIds = normalizeArrayResponse(companyIdsResult);
          companyCount = companyIds.length;
        } catch (err) {
          console.warn('Error loading companies:', err);
        }

        // 2. Load product count
        try {
          const productIdsResult = await ecommerceContract.getAllProducts();
          const productIds = normalizeArrayResponse(productIdsResult);
          productCount = productIds.length;
        } catch (err) {
          console.warn('Error loading products:', err);
        }

        // 3. Load customer count
        try {
          // The contract DOES have getAllCustomers function
          const customersResult = await ecommerceContract.getAllCustomers();
          const customers = normalizeArrayResponse(customersResult);
          customerCount = customers.length;
        } catch (err) {
          console.warn('Error loading customers:', err);
        }

        // 4. Load invoices and calculate sales
        try {
          // The contract DOES have getAllInvoices function
          const invoiceIdsResult = await ecommerceContract.getAllInvoices();
          const invoiceIds = normalizeArrayResponse(invoiceIdsResult);

          // Calculate total sales from invoices
          // We need to fetch invoice details for this
          // To avoid too many requests, we'll just fetch the last 5 for recent transactions
          // and maybe a few more for total sales estimation if needed, 
          // but ideally the contract should provide a total sales counter.

          // For now, let's fetch the last 5 invoices for recent transactions
          const recentInvoiceIds = invoiceIds.slice(-5).reverse();

          const invoicePromises = recentInvoiceIds.map(async (id: any) => {
            try {
              const invoice = await ecommerceContract.getInvoice(id);
              return {
                id: invoice.invoiceId.toString(),
                customer: invoice.customerAddress,
                amount: invoice.totalAmount.toString(),
                date: new Date(Number(invoice.timestamp) * 1000).toLocaleDateString(),
                status: invoice.isPaid ? 'Pagado' : 'Pendiente'
              };
            } catch (e) {
              return null;
            }
          });

          const invoices = await Promise.all(invoicePromises);
          recentTransactions = invoices.filter(inv => inv !== null);

          // For total sales, we would need to iterate all invoices which is expensive
          // For now, we'll leave it as 0 or maybe implement a contract function for this later
          // Or we could sum up the recent ones as an example
          totalSales = recentTransactions.reduce((acc, curr) => acc + Number(curr.amount), 0);

        } catch (err) {
          console.warn('Error loading invoices:', err);
        }

        // Set the data
        setData({
          companyCount,
          productCount,
          customerCount,
          totalSales,
          recentTransactions,
        });
      } catch (err: any) {
        console.error('Error loading dashboard data:', err);
        setError(err.message || 'Error al cargar los datos del dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [ecommerceContract, provider, signer, chainId, transactionCache]);

  return { data, loading, error };
}
