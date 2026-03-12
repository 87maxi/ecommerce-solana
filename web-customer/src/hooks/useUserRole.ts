"use client";

import { useState, useEffect } from "react";

import { useSimpleContract } from "./useSimpleContract";
import { useWallet } from "./useWallet";

export type UserRole =
  | "admin"
  | "company_owner"
  | "customer"
  | "unregistered"
  | "loading"
  | "error";

export type UserRoleInfo = {
  role: UserRole;
  companyId?: string;
  companyName?: string;
  error?: string;
};

export function useUserRole(): UserRoleInfo {
  const { address } = useWallet();
  const { contract: program } = useSimpleContract();

  const [roleInfo, setRoleInfo] = useState<UserRoleInfo>({ role: "loading" });

  useEffect(() => {
    let isMounted = true;

    if (!address || !program) {
      if (isMounted) {
        if (!address) {
          setRoleInfo({ role: "loading" });
        } else {
          setRoleInfo({ role: "error", error: "Programa no disponible" });
        }
      }
      return;
    }

    const determineRole = async () => {
      try {
        if (isMounted) setRoleInfo({ role: "loading" });

        // En Solana, esto generalmente implicaría buscar un PDA (Program Derived Address)
        // para la cuenta del usuario y leer su estado on-chain mediante Anchor:
        // const userPda = PublicKey.findProgramAddressSync([...], program.programId);
        // const userData = await program.account.userProfile.fetch(userPda);

        console.log(
          "[useUserRole] Mocking role determination for Solana address:",
          address,
        );

        // Simulamos que el usuario tiene el rol de cliente en la transición
        if (isMounted) {
          setRoleInfo({ role: "customer" });
        }
      } catch (err) {
        console.error("Error determining user role:", err);
        if (isMounted) {
          setRoleInfo({
            role: "error",
            error:
              err instanceof Error
                ? err.message
                : "Error desconocido al determinar rol",
          });
        }
      }
    };

    determineRole();

    return () => {
      isMounted = false;
    };
  }, [address, program]);

  return roleInfo;
}
