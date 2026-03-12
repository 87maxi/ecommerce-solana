import { Contract } from 'ethers';
import { BrowserProvider, JsonRpcSigner } from 'ethers';
import { useMemo } from 'react';

import { ABIS, ContractName } from '../lib/contracts/abis';
import {
  getContractAddress,
  CONTRACT_ADDRESSES,
} from '../lib/contracts/addresses';

export function useContract(
  contractName: ContractName,
  provider: BrowserProvider | null,
  signer: JsonRpcSigner | null,
  chainId: number | null
): Contract | null {
  return useMemo(() => {
    if (!provider || !signer || !chainId) return null;

    try {
      // Verificar si la red está soportada antes de intentar obtener la dirección
      const supportedNetworks = Object.keys(CONTRACT_ADDRESSES).map(Number);
      if (!supportedNetworks.includes(chainId)) {
        console.warn(
          `Network ${chainId} not supported. Supported: ${supportedNetworks.join(', ')}`
        );
        return null;
      }

      const address = getContractAddress(chainId, contractName);
      const abi = ABIS[contractName];
      return new Contract(address, abi, signer);
    } catch (error) {
      console.error(`Error al cargar el contrato ${contractName}:`, error);
      return null;
    }
  }, [contractName, provider, signer, chainId]);
}
