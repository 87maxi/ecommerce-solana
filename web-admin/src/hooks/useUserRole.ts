'use client';

import { useState, useEffect, useMemo } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useContract } from './useContract';

export type UserRole =
  | 'admin'
  | 'company_owner'
  | 'customer'
  | 'unregistered'
  | 'loading'
  | 'error';

export type UserRoleInfo = {
  role: UserRole;
  companyId?: string;
  companyName?: string;
  error?: string;
};

export function useUserRole(): UserRoleInfo {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const signer = useMemo(() => (publicKey ? { publicKey } : null), [publicKey]);

  // Pass null for chainId as it's not used in the Solana refactor
  const ecommerceContract = useContract('Ecommerce', connection, signer, null);

  const [roleInfo, setRoleInfo] = useState<UserRoleInfo>({ role: 'loading' });

  useEffect(() => {
    let isMounted = true;
    const address = publicKey?.toBase58();

    const safeSetRoleInfo = (newInfo: UserRoleInfo) => {
      if (isMounted) {
        setRoleInfo(prev => {
          if (
            prev.role === newInfo.role &&
            prev.companyId === newInfo.companyId &&
            prev.companyName === newInfo.companyName &&
            prev.error === newInfo.error
          ) {
            return prev;
          }
          return newInfo;
        });
      }
    };

    if (!address || !ecommerceContract) {
      if (isMounted) {
        if (!address) {
          safeSetRoleInfo({ role: 'loading' });
        } else {
          safeSetRoleInfo({ role: 'error', error: 'Contrato no disponible' });
        }
      }
      return;
    }

    const determineRole = async () => {
      try {
        // Evitamos ciclos innecesarios si ya estamos en loading
        setRoleInfo(prev => (prev.role === 'loading' ? prev : { role: 'loading' }));

        // First, check if the user is the contract owner (admin)
        // In our mock, owner() returns the connected address so it will be admin
        const contractOwner = await ecommerceContract.owner();
        if (contractOwner.toLowerCase() === address.toLowerCase()) {
          safeSetRoleInfo({ role: 'admin' });
          return;
        }

        // Check if the user is registered as a customer
        const isCustomerRegistered = await ecommerceContract.isCustomerRegistered(address);
        if (isCustomerRegistered) {
          try {
            const customerInfo = await ecommerceContract.getCustomer(address);
            if (customerInfo && customerInfo.isRegistered) {
              safeSetRoleInfo({ role: 'customer' });
              return;
            }
          } catch (err) {
            safeSetRoleInfo({ role: 'customer' });
            return;
          }
        }

        // Check if the user owns any companies
        try {
          const companyIds = await ecommerceContract.getAllCompanies();

          for (const companyId of companyIds) {
            try {
              const company = await ecommerceContract.getCompany(companyId);
              if (company.owner.toLowerCase() === address.toLowerCase()) {
                safeSetRoleInfo({
                  role: 'company_owner',
                  companyId: companyId.toString(),
                  companyName: company.name,
                });
                return;
              }
            } catch (err) {
              console.warn(`Error checking company ${companyId}:`, err);
              continue;
            }
          }
        } catch (err) {
          console.warn('Error checking company ownership:', err);
        }

        // If we get here, the user is not registered in any specific role
        safeSetRoleInfo({ role: 'unregistered' });
      } catch (err) {
        console.error('Error determining user role:', err);
        safeSetRoleInfo({
          role: 'error',
          error: err instanceof Error ? err.message : 'Error desconocido al determinar rol',
        });
      }
    };

    determineRole();

    return () => {
      isMounted = false;
    };
  }, [publicKey?.toBase58(), ecommerceContract]);

  return roleInfo;
}
