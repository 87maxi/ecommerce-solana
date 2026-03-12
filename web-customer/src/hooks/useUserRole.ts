'use client';

import { useState, useEffect } from 'react';

import { useSimpleContract } from './useSimpleContract';
import { useWallet } from './useWallet';

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
  const { account: address, chainId } = useWallet();
  const { contract: ecommerceContract, provider, signer } = useSimpleContract();

  const [roleInfo, setRoleInfo] = useState<UserRoleInfo>({ role: 'loading' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!address || !ecommerceContract) {
      if (address === null) {
        setRoleInfo({ role: 'loading' });
      } else if (!ecommerceContract) {
        setRoleInfo({ role: 'error', error: 'Contrato no disponible' });
      } else {
        setRoleInfo({ role: 'unregistered' });
      }
      setLoading(false);
      return;
    }

    const determineRole = async () => {
      try {
        setLoading(true);

        // First, check if the user is the contract owner (admin)
        const contractOwner = await ecommerceContract.owner();
        if (contractOwner.toLowerCase() === address.toLowerCase()) {
          setRoleInfo({ role: 'admin' });
          setLoading(false);
          return;
        }

        // Check if the user is registered as a customer
        const isCustomerRegistered =
          await ecommerceContract.isCustomerRegistered(address);
        if (isCustomerRegistered) {
          // Try to get customer info
          try {
            const customerInfo = await ecommerceContract.getCustomer(address);
            if (customerInfo && customerInfo.isRegistered) {
              setRoleInfo({ role: 'customer' });
              setLoading(false);
              return;
            }
          } catch (err) {
            // If we can't get customer info, still consider them a customer
            setRoleInfo({ role: 'customer' });
            setLoading(false);
            return;
          }
        }

        // Check if the user owns any companies
        try {
          // Get all companies
          const companyIds = await ecommerceContract.getAllCompanies();

          // Check each company to see if the user is the owner
          for (const companyId of companyIds) {
            try {
              const company = await ecommerceContract.getCompany(companyId);
              if (company.owner.toLowerCase() === address.toLowerCase()) {
                setRoleInfo({
                  role: 'company_owner',
                  companyId: companyId.toString(),
                  companyName: company.name,
                });
                setLoading(false);
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
        setRoleInfo({ role: 'unregistered' });
      } catch (err) {
        console.error('Error determining user role:', err);
        setRoleInfo({
          role: 'error',
          error:
            err instanceof Error
              ? err.message
              : 'Error desconocido al determinar rol',
        });
      } finally {
        setLoading(false);
      }
    };

    determineRole();
  }, [address, ecommerceContract]);

  if (loading) {
    return { role: 'loading' };
  }

  return roleInfo;
}