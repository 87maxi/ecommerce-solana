'use client';

import { useState, useEffect } from 'react';
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
  // Pass null for chainId as it's not used in the Solana refactor
  const ecommerceContract = useContract('Ecommerce', connection, { publicKey }, null);

  const [roleInfo, setRoleInfo] = useState<UserRoleInfo>({ role: 'loading' });

  useEffect(() => {
    let isMounted = true;
    const address = publicKey?.toBase58();

    if (!address || !ecommerceContract) {
      if (isMounted) {
        if (!address) {
          setRoleInfo({ role: 'loading' });
        } else {
          setRoleInfo({ role: 'error', error: 'Contrato no disponible' });
        }
      }
      return;
    }

    const determineRole = async () => {
      try {
        if (isMounted) setRoleInfo({ role: 'loading' });

        // First, check if the user is the contract owner (admin)
        // In our mock, owner() returns the connected address so it will be admin
        const contractOwner = await ecommerceContract.owner();
        if (contractOwner.toLowerCase() === address.toLowerCase()) {
          if (isMounted) setRoleInfo({ role: 'admin' });
          return;
        }

        // Check if the user is registered as a customer
        const isCustomerRegistered = await ecommerceContract.isCustomerRegistered(address);
        if (isCustomerRegistered) {
          try {
            const customerInfo = await ecommerceContract.getCustomer(address);
            if (customerInfo && customerInfo.isRegistered) {
              if (isMounted) setRoleInfo({ role: 'customer' });
              return;
            }
          } catch (err) {
            if (isMounted) setRoleInfo({ role: 'customer' });
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
                if (isMounted) {
                  setRoleInfo({
                    role: 'company_owner',
                    companyId: companyId.toString(),
                    companyName: company.name,
                  });
                }
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
        if (isMounted) setRoleInfo({ role: 'unregistered' });
      } catch (err) {
        console.error('Error determining user role:', err);
        if (isMounted) {
          setRoleInfo({
            role: 'error',
            error: err instanceof Error ? err.message : 'Error desconocido al determinar rol',
          });
        }
      }
    };

    determineRole();

    return () => {
      isMounted = false;
    };
  }, [publicKey, ecommerceContract]);

  return roleInfo;
}
