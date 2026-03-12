/**
 * Configuración de direcciones de programas y tokens para el ecosistema Solana.
 * Se ha migrado de Ethereum (Anvil 31337) a Solana (Surfpool/Localnet 1337).
 */
export const CONTRACT_ADDRESSES = {
  // Red Local de Solana (Surfpool / Localnet)
  1337: {
    Ecommerce:
      process.env.NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS ||
      '675k16uTf5h3qf4Bf9f9f9f9f9f9f9f9f9f9f9f9f9f', // Program ID en Base58
    EuroToken:
      process.env.NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS ||
      '789k16uTf5h3qf4Bf9f9f9f9f9f9f9f9f9f9f9f9f9f', // Mint Address en Base58
  },
};

/**
 * Obtiene la dirección de un programa o mint basándose en el Chain ID.
 * En el contexto de Solana, el Chain ID 1337 se usa para identificar la red local de Surfpool.
 */
export function getContractAddress(
  chainId: number | string | null,
  contract: 'Ecommerce' | 'EuroToken'
): string {
  // Siempre priorizamos la red 1337 para desarrollo local con Surfpool
  const networkId = 1337;

  const addresses = CONTRACT_ADDRESSES[networkId];
  const address = addresses[contract];

  if (!address) {
    throw new Error(
      `Configuración faltante para ${contract} en la red ${networkId}. ` +
        `Verifica las variables de entorno NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS y NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS.`
    );
  }

  return address;
}

/**
 * Definición de redes soportadas.
 * Se ha eliminado Ethereum para centrarse exclusivamente en Solana.
 */
export const SUPPORTED_CHAINS = [
  {
    id: 1337,
    name: 'Solana Local (Surfpool)',
    currency: 'SOL',
    rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || 'http://127.0.0.1:8899',
  },
  {
    id: 101, // Mainnet Beta ID estándar en Solana
    name: 'Solana Mainnet',
    currency: 'SOL',
    rpcUrl: 'https://api.mainnet-beta.solana.com',
  },
];
