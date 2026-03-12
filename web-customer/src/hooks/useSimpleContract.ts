"use client";

import { useState, useEffect } from "react";
import { Connection } from "@solana/web3.js";
import { Program, AnchorProvider, Idl } from "@coral-xyz/anchor";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import EcommerceABI from "@/contracts/abis/EcommerceABI.json";

const PROGRAM_ID = process.env.NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS || "";

export function useSimpleContract() {
  const [program, setProgram] = useState<Program | null>(null);
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const address = publicKey?.toBase58();

  // Mock signer for read-only operations
  const signer = publicKey ? { publicKey } : null;

  useEffect(() => {
    let isMounted = true;

    if (!connection || !address || !signer) {
      if (isMounted) setProgram(null);
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

        if (isMounted) {
          setProgram(ecommerceProgram);
        }
      } catch (error) {
        console.error("[useSimpleContract] Error initializing program:", error);
      }
    };

    initProgram();

    return () => {
      isMounted = false;
    };
  }, [connection, address, signer, publicKey]);

  const mockedContract: any = program
    ? {
        ...program,
        owner: async () => {
          return address;
        },
        isCustomerRegistered: async () => true,
        getCustomer: async () => ({
          isRegistered: true,
          customerAddress: address,
        }),
      }
    : null;

  return { contract: mockedContract, provider: connection, signer };
}
