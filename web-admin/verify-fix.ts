import { getContractAddress } from './src/lib/contracts/addresses';

try {
  const address = getContractAddress(31337, 'Ecommerce');
  console.log('Success! Address:', address);
} catch (error) {
  console.error('Error:', error);
  process.exit(1);
}
