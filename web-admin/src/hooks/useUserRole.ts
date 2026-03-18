'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useGlobalContract } from '../contexts/ContractContext';

export type UserRole =
  | 'admin'
  | 'company_owner'
  | 'customer'
  | 'unregistered'
  | 'disconnected'
  | 'loading'
  | 'error';

export type UserRoleInfo = {
  role: UserRole;
  companyId?: string;
  companyNumericId?: string;
  companyName?: string;
  error?: string;
};

export function useUserRole(): UserRoleInfo {
  const { publicKey } = useWallet();
  const { ecommerceContract } = useGlobalContract();

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
          safeSetRoleInfo({ role: 'disconnected' });
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

        console.log('[useUserRole] Verificando rol para:', address);

        // First, check if the user owns any companies (Optimized)
        try {
          console.log('[useUserRole] Consultando empresas para verificar propiedad...');
          const companies = await ecommerceContract.getAllCompanies();
          console.log(`[useUserRole] Empresas encontradas on-chain: ${companies.length}`);

          const myCompany = companies.find(
            (c: any) => c.owner.toString().toLowerCase() === address.toLowerCase()
          );

          if (myCompany) {
            console.log('[useUserRole] Rol detectado: Dueño de empresa -', myCompany.name);
            safeSetRoleInfo({
              role: 'company_owner',
              companyId: myCompany.id.toString(), // Use PDA address for routing
              companyNumericId: myCompany.numericId, // Use numeric ID for data filtering
              companyName: myCompany.name,
            });
            return;
          }
        } catch (err) {
          console.error('[useUserRole] Error consultando empresas:', err);
        }

        // Then check if the user is the contract owner (admin)
        const contractOwner = await ecommerceContract.owner();
        console.log('[useUserRole] Admin del contrato on-chain:', contractOwner);

        if (contractOwner && contractOwner.toLowerCase() === address.toLowerCase()) {
          console.log('[useUserRole] Rol detectado: Admin');
          safeSetRoleInfo({ role: 'admin' });
          return;
        }

        // Check if the user is registered as a customer
        try {
          const isCustomerRegistered = await ecommerceContract.isCustomerRegistered(address);
          if (isCustomerRegistered) {
            const customerInfo = await ecommerceContract.getCustomer(address);
            if (customerInfo && customerInfo.isRegistered) {
              console.log('[useUserRole] Rol detectado: Cliente');
              safeSetRoleInfo({ role: 'customer' });
              return;
            }
          }
        } catch (err) {
          console.warn('[useUserRole] Error verificando cliente:', err);
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
