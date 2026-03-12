"use client";

import { useState, useEffect } from "react";
import { Connection } from "@solana/web3.js";
import { Program, AnchorProvider, Idl } from "@coral-xyz/anchor";
import EcommerceABI from "@/contracts/abis/EcommerceABI.json";
import { useWallet } from "./useWallet";

const PROGRAM_ID = process.env.NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS || "";

export function useSimpleContract() {
  const [program, setProgram] = useState<Program | null>(null);
  const { provider: connection, address, signer } = useWallet();

  useEffect(() => {
    if (!connection || !address || !signer) {
      return;
    }

    const initProgram = async () => {
      try {
        const anchorProvider = new AnchorProvider(
          connection,
          signer as any,
          AnchorProvider.defaultOptions(),
        );

        if (!PROGRAM_ID) {
          console.warn("Program ID not provided in env.");
          return;
        }

        const idl = { ...(EcommerceABI as any), address: PROGRAM_ID } as Idl;
        const ecommerceProgram = new Program(idl, anchorProvider);

        setProgram(ecommerceProgram);
      } catch (error) {
        console.error("[useSimpleContract] Error initializing program:", error);
      }
    };

    initProgram();
  }, [connection, address, signer]);

  return { contract: program, provider: connection, signer };
}
