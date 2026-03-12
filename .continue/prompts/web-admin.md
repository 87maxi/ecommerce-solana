# Web Admin Platform

Web admin platform for ecommerce marketplace using Next.js, TypeScript, and web3 technologies.

## Project Structure

- `/src/app` - Next.js App Router pages and layout
- `/src/components` - React components
- `/src/hooks` - Custom React hooks for web3 and app logic
- `/src/contexts` - React context providers
- `/src/lib` - Utility functions, contracts configuration
- `/src/types` - TypeScript type definitions

## Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run linting
- `npm run test` - Run tests

## Web3 Integration

The platform integrates with Ethereum blockchain through:

- **Ethers.js** - Web3 library for contract interaction
- **MetaMask** - Wallet connectivity
- **Foundry** - Smart contract development and testing

Key web3 features:

- Wallet connection and account management
- Contract interaction through custom hooks
- Role-based access control (Admin, Company Owner, Customer)
- Transaction monitoring and state management

## Smart Contracts

The platform interacts with Solidity smart contracts deployed on the blockchain. Key contracts include:

- **Ecommerce.sol** - Main marketplace contract handling products, orders, companies
- **EuroToken.sol** - ERC-20 stablecoin contract

Contract ABIs are located in `src/contracts/abis/` and addresses are configured in `src/lib/contracts/addresses.ts`.

## State Management

- **React Context** - For global state like wallet connection and user roles
- **React Hooks** - Custom hooks for encapsulating web3 logic
- **localStorage** - Persisting wallet connection across sessions