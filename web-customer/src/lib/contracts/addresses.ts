// Get addresses from environment variables
// These should be Solana Program IDs or Mint Addresses in Base58 format
export const ECOMMERCE_CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS || "";
export const EUROTOKEN_CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS || "";

/**
 * Obtiene la dirección del programa o token basándose en el Chain ID.
 * Se ha migrado de Ethereum (31337) a Solana (Surfpool 1337).
 */
export function getContractAddress(
  chainId: number | string | null,
  contractName: string,
): string {
  // En el ecosistema migrado a Solana, usamos 1337 para identificar la red local de Surfpool
  const effectiveChainId = Number(chainId) || 1337;

  if (effectiveChainId === 1337 || effectiveChainId === 31337) {
    if (contractName === "Ecommerce") return ECOMMERCE_CONTRACT_ADDRESS;
    if (contractName === "EuroToken") return EUROTOKEN_CONTRACT_ADDRESS;
  }

  // Si no se encuentra una configuración específica, intentamos devolver el valor de la env var
  if (contractName === "Ecommerce" && ECOMMERCE_CONTRACT_ADDRESS)
    return ECOMMERCE_CONTRACT_ADDRESS;
  if (contractName === "EuroToken" && EUROTOKEN_CONTRACT_ADDRESS)
    return EUROTOKEN_CONTRACT_ADDRESS;

  throw new Error(
    `Contract ${contractName} not found for chainId ${effectiveChainId}. Check your environment variables.`,
  );
}
