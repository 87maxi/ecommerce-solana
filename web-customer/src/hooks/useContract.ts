"use client";

import { useGlobalContract } from "../contexts/ContractContext";

/**
 * Re-export useContract to maintain backwards compatibility
 * across all existing imports, but powered by the singleton context.
 */
export const useContract = () => {
  return useGlobalContract();
};
