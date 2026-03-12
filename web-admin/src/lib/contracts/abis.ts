import EcommerceABI from '../../contracts/abis/EcommerceABI.json';

export const ABIS = {
  Ecommerce: EcommerceABI,
  EuroToken: EcommerceABI, // Using EcommerceABI since EuroToken is deployed as part of Ecommerce
};

export type ContractName = 'Ecommerce' | 'EuroToken';
