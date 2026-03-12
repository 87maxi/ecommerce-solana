'use client';

import React, { createContext, useContext, ReactNode } from 'react';

import { useUserRole, UserRole, UserRoleInfo } from '../hooks/useUserRole';

type RoleContextType = {
  roleInfo: UserRoleInfo;
  isLoading: boolean;
};

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const roleInfo = useUserRole();
  // Determinar si está cargando basado en el rol
  const isLoading = roleInfo.role === 'loading';

  return (
    <RoleContext.Provider value={{ roleInfo, isLoading }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}
