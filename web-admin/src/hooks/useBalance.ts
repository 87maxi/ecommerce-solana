'use client';

import { useState, useEffect } from 'react';

const PASARELA_PAGO_URL =
  process.env.NEXT_PUBLIC_PASARELA_PAGO_URL || 'http://localhost:3034';

export type BalanceData = {
  balance: string;
  address: string;
  currency: string;
};

export function useBalance(walletAddress: string | null) {
  const [balance, setBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!walletAddress) {
        setBalance(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${PASARELA_PAGO_URL}/api/balance/${walletAddress}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Error al obtener balance: ${response.status}`);
        }

        const data: BalanceData = await response.json();
        setBalance(data.balance);
      } catch (err) {
        console.error('Error fetching balance from API:', err);
        setError('No se pudo obtener el balance de EURT');
        setBalance(null);
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();

    // Polling cada 10 segundos para actualizar el balance
    const interval = setInterval(fetchBalance, 10000);
    return () => clearInterval(interval);
  }, [walletAddress]);

  return { balance, loading, error };
}
