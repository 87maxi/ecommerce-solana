export const CONTRACT_ADDRESSES = {
  31337: {
    Ecommerce:
      process.env.NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS ||
      '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    EuroToken:
      process.env.NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS ||
      '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  },
  1: {
    Ecommerce:
      process.env.NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS ||
      '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    EuroToken:
      process.env.NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS ||
      '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  },
};

export function getContractAddress(
  chainId: number,
  contract: 'Ecommerce' | 'EuroToken'
): string {
  console.log(`Getting address for contract ${contract} on chain ${chainId}`);
  console.log('Available addresses:', CONTRACT_ADDRESSES);

  const addresses =
    CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES];
  if (!addresses) {
    throw new Error(
      `Network ${chainId} not supported. Supported networks: ${Object.keys(CONTRACT_ADDRESSES).join(', ')}`
    );
  }

  const address = addresses[contract];
  if (!address) {
    console.error(
      `Missing address for ${contract} on chain ${chainId}. Env vars:`,
      process.env
    );
    throw new Error(
      `Contract ${contract} not configured for network ${chainId}. ` +
        `Check your .env.local file and RESTART the server. ` +
        `Available contracts: ${Object.keys(addresses).join(', ')}`
    );
  }

  // Validar que la dirección tenga el formato correcto
  if (
    typeof address !== 'string' ||
    !address.startsWith('0x') ||
    address.length !== 42
  ) {
    throw new Error(`Invalid contract address for ${contract}: ${address}`);
  }

  return address;
}

export const SUPPORTED_CHAINS = [
  {
    id: Number(process.env.NEXT_PUBLIC_CHAIN_ID) || 31337,
    name: 'Ethereum Local',
    currency: 'ETH',
  },
  {
    id: 1,
    name: 'Ethereum Mainnet',
    currency: 'ETH',
  },
];
