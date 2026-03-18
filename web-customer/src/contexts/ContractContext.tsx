"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { useContract as useAnchorContract } from "../hooks/useAnchorContract";

// Definimos el tipo del contexto basándonos en lo que devuelve useContract
type ContractContextType = ReturnType<typeof useAnchorContract>;

const ContractContext = createContext<ContractContextType | undefined>(
  undefined,
);

export function ContractProvider({ children }: { children: ReactNode }) {
  // Inicializamos el contrato aquí una sola vez
  const contractInstance = useAnchorContract();

  return (
    <ContractContext.Provider value={contractInstance}>
      {children}
    </ContractContext.Provider>
  );
}

// Hook personalizado para usar el contrato global
export function useGlobalContract() {
  const context = useContext(ContractContext);
  if (context === undefined) {
    throw new Error("useGlobalContract must be used within a ContractProvider");
  }
  return context;
}
