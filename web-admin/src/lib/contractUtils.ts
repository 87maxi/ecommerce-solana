import { Product } from '../types';

export type ProductData = {
  name: string;
  description: string;
  price: bigint | string | any;
  image: string;
  stock: bigint | number | any;
  active: boolean;
  companyId: bigint | string | any;
};

/**
 * Normaliza los datos de un producto provenientes del contrato (Ethers o Anchor).
 * Soporta IDs en formato string (PublicKeys de Solana) y BigInt (EVM).
 * Maneja de forma segura entradas nulas, devolviendo null.
 */
export function normalizeProduct(productResult: any, productId: any): Product | null {
  if (!productResult) {
    return null;
  }

  // Normalizar precio (asumiendo 6 decimales para EURT)
  const rawPrice = productResult.price?.toString() || '0';
  const price = (parseFloat(rawPrice) / 1000000).toFixed(2);

  // Normalizar companyId (soporta campo 'company' de Anchor o 'companyId' de Ethers)
  const companyId =
    productResult.companyId?.toString() || (productResult as any).company?.toString() || '';

  // Normalizar stock (soporta BN de Anchor o number de Ethers)
  const stock = productResult.stock?.toNumber
    ? productResult.stock.toNumber()
    : Number(productResult.stock || 0);

  // Normalizar estado activo
  const isActive = productResult.active ?? (productResult as any).isActive ?? true;

  return {
    id: productId.toString(),
    companyId: companyId,
    name: productResult.name || '',
    description: productResult.description || '',
    price: price,
    image: productResult.image || '',
    imageHash: productResult.image || '', // Compatibilidad con código antiguo
    stock: stock,
    active: isActive,
    isActive: isActive,
  } as any;
}

/**
 * Normaliza una respuesta que se espera sea un array.
 * Maneja arrays nativos, arrays anidados de ethers y objetos ProxyResult.
 */
export function normalizeArrayResponse(response: any): any[] {
  if (!response) return [];

  if (Array.isArray(response)) {
    if (response.length > 0 && Array.isArray(response[0])) {
      return response[0];
    }
    return response;
  }

  if (typeof response === 'object' && 'length' in response) {
    return Array.from(response);
  }

  return [response];
}

/**
 * Normaliza los datos de una empresa.
 */
export function normalizeCompany(companyResult: any, companyId: any): any {
  if (!companyResult) return null;

  const id = companyId?.toString() || '';
  const owner = companyResult.owner?.toString() || '';
  const isActive =
    companyResult.active ?? companyResult.isActive ?? (companyResult as any).is_active ?? true;

  let createdAt = new Date().toISOString();
  if (companyResult.createdAt) {
    const timestamp = Number(companyResult.createdAt.toString());
    createdAt = new Date(timestamp * 1000).toISOString();
  }

  return {
    id,
    owner,
    name: companyResult.name || '',
    description: companyResult.description || '',
    isActive,
    active: isActive,
    createdAt,
  };
}
