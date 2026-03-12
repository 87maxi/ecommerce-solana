import { Product } from '../types';

export type ProductData = {
  name: string;
  description: string;
  price: bigint | string;
  image: string;
  stock: bigint | number;
  active: boolean;
  companyId: bigint | string;
};

export function normalizeProduct(
  productResult: ProductData,
  productId: bigint
): Product {
  // Handle possible BigNumber values from ethers
  const price =
    typeof productResult.price === 'bigint'
      ? productResult.price.toString()
      : productResult.price;
  const companyId =
    typeof productResult.companyId === 'bigint'
      ? productResult.companyId.toString()
      : productResult.companyId;

  // Ensure values are strings, not arrays
  const cleanedPrice = Array.isArray(price)
    ? price[0].toString()
    : price.toString();
  const cleanedCompanyId = Array.isArray(companyId)
    ? companyId[0].toString()
    : companyId.toString();

  return {
    id: productId.toString(),
    companyId: cleanedCompanyId,
    name: productResult.name,
    description: productResult.description,
    price: (parseInt(cleanedPrice) / 1000000).toFixed(2), // Assuming 6 decimals
    imageHash: productResult.image || '',
    stock: Number(productResult.stock),
    isActive: productResult.active,
  };
}

export function normalizeArrayResponse(response: any): any[] {
  if (!response) return [];

  // Handle ethers ProxyResult which behaves like an array
  // We can convert it to a regular array using Array.from or spread
  const arrayResponse = Array.isArray(response)
    ? response
    : (typeof response === 'object' && 'length' in response)
      ? Array.from(response)
      : [response];

  if (arrayResponse.length === 0) return [];

  // Check if it's a nested array (e.g. [[1, 2, 3]])
  // Use explicit check for array-like structure on the first element
  const firstItem = arrayResponse[0];
  if (Array.isArray(firstItem) || (typeof firstItem === 'object' && firstItem !== null && 'length' in firstItem && typeof firstItem !== 'bigint')) {
    return Array.from(firstItem);
  }

  return arrayResponse;
}

export function normalizeCompany(companyResult: any, companyId: string): any {
  const owner =
    companyResult.owner?.toString() || companyResult[1]?.toString() || '';

  return {
    id: companyId,
    owner,
    name: companyResult.name,
    description: companyResult.description,
    isActive: companyResult.active,
    createdAt: companyResult.createdAt
      ? new Date(Number(companyResult.createdAt) * 1000).toISOString()
      : new Date().toISOString(),
  };
}
