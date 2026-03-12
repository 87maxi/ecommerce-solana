console.log('=== Debugging web-admin Environment ===');
console.log('Process Environment:', Object.keys(process.env));
console.log('NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS:', process.env.NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS);
console.log('NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS:', process.env.NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS);
console.log('NEXT_PUBLIC_CHAIN_ID:', process.env.NEXT_PUBLIC_CHAIN_ID);
console.log('window.location:', window.location.href);

if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    console.log('=== Window Load Event ===');
    console.log('Available global variables:', Object.keys(window));
    console.log('window.ethereum:', !!window.ethereum);
    if (window.ethereum) {
      console.log('window.ethereum.isMetaMask:', window.ethereum.isMetaMask);
      console.log('window.ethereum.chainId:', window.ethereum.chainId);
    }
  });
}

// Debug contract addresses
import { CONTRACT_ADDRESSES } from '@/lib/contracts/addresses';
console.log('Contract Addresses Config:', CONTRACT_ADDRESSES);

// Debug useWallet
import { useWallet } from '@/hooks/useWallet';
console.log('useWallet available:', typeof useWallet);

// Debug useContract
import { useContract } from '@/hooks/useContract';
console.log('useContract available:', typeof useContract);

// Debug RoleContext
import { useRole } from '@/contexts/RoleContext';
console.log('useRole available:', typeof useRole);
