const { getContractAddress } = require('./src/lib/contracts/addresses.ts');

// Mock process.env
process.env.NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS =
  '0x5FbDB2315678afecb367f032d93F642f64180aa3';
process.env.NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS =
  '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';

try {
  console.log('Testing getContractAddress...');
  const address = getContractAddress(31337, 'Ecommerce');
  console.log('Success! Address:', address);

  if (address === '0x5FbDB2315678afecb367f032d93F642f64180aa3') {
    console.log('Verification PASSED');
  } else {
    console.error('Verification FAILED: Address mismatch');
    process.exit(1);
  }
} catch (error) {
  console.error('Error:', error);
  process.exit(1);
}
