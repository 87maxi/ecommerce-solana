// Get addresses from environment variables
export const ECOMMERCE_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS || '0xdc64a140aa3e981100a9beca4e685f962f0cf6c9';
export const EUROTOKEN_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS || '0x5fc8d32690cc91d4c39d9d3abcbd16989f875707';

export function getContractAddress(chainId: number, contractName: string): string {
  if (chainId === 31337) { // Local network
    if (contractName === 'Ecommerce') return ECOMMERCE_CONTRACT_ADDRESS;
    if (contractName === 'EuroToken') return EUROTOKEN_CONTRACT_ADDRESS;
  }
  throw new Error(`Contract ${contractName} not found for chainId ${chainId}`);
}