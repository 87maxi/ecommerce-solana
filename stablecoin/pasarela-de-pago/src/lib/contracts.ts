import { ethers } from 'ethers';
import EuroTokenABI from '../contracts/abis/EuroTokenABI.json';

export async function mintTokens(walletAddress: string, amount: number, invoice: string) {
    console.log(`[MINT-TOKENS] Starting mint process:`, {
        walletAddress,
        amount,
        invoice
    });

    // Conexión a la red blockchain (anvil local)
    const rpcUrl = process.env.RPC_URL || 'http://127.0.0.1:8545';
    console.log(`[MINT-TOKENS] Connecting to RPC: ${rpcUrl}`);
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    try {
        const network = await provider.getNetwork();
        console.log(`[MINT-TOKENS] Connected to network: ${network.name} (chainId: ${network.chainId})`);
    } catch (err) {
        console.error(`[MINT-TOKENS] Failed to connect to provider:`, err);
        throw new Error(`Failed to connect to blockchain provider: ${err}`);
    }

    // Wallet del owner que tiene permisos para mintear
    const privateKey = process.env.OWNER_PRIVATE_KEY || process.env.PRIVATE_KEY;
    if (!privateKey) {
        throw new Error('Missing OWNER_PRIVATE_KEY or PRIVATE_KEY in environment');
    }

    const wallet = new ethers.Wallet(privateKey, provider);
    console.log(`[MINT-TOKENS] Using wallet address: ${wallet.address}`);

    // Obtener dirección del contrato
    const contractAddress = process.env.NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS;
    if (!contractAddress) {
        throw new Error('Missing NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS in environment');
    }

    // Crear instancia del contrato
    const contract = new ethers.Contract(contractAddress, EuroTokenABI, wallet);

    // Mintear tokens (convertir a wei - 6 decimales como el contrato EuroToken)
    const amountInWei = ethers.parseUnits(amount.toString(), 6);

    // Verificar que la wallet que mintea sea el owner del contrato
    const contractOwner = await contract.owner();
    console.log(`[MINT-TOKENS] Contract Owner: ${contractOwner}`);
    console.log(`[MINT-TOKENS] Minting Wallet: ${wallet.address}`);
    
    if (wallet.address.toLowerCase() !== contractOwner.toLowerCase()) {
        throw new Error(`Wallet ${wallet.address} is not contract owner ${contractOwner}`);
    }

    console.log(`[MINT-TOKENS] Sending transaction to blockchain...`);
    console.log(`[MINT-TOKENS] Amount in Wei: ${amountInWei} (${amount} EURT with 6 decimals)`);
    
    const tx = await (contract.mint as any)(walletAddress, amountInWei);

    console.log(`[MINT-TOKENS] Transaction sent, waiting for confirmation...`, {
        txHash: tx.hash
    });

    const receipt = await tx.wait();

    console.log(`[MINT-TOKENS] Tokens minted successfully!`, {
        transactionHash: receipt?.hash,
        blockNumber: receipt?.blockNumber,
        walletAddress,
        amount
    });

    return {
        transactionHash: receipt?.hash,
        blockNumber: receipt?.blockNumber,
        walletAddress,
        amount,
        invoice,
        timestamp: new Date().toISOString()
    };
}

export async function getBalance(walletAddress: string) {
    // Conexión a la red blockchain (anvil local)
    const rpcUrl = process.env.RPC_URL || 'http://127.0.0.1:8545';
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    // Obtener dirección del contrato
    const contractAddress = process.env.NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS;
    if (!contractAddress) {
        throw new Error('Missing NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS in environment');
    }

    // Crear instancia del contrato (solo lectura, no necesitamos wallet)
    const contract = new ethers.Contract(contractAddress, EuroTokenABI, provider);

    const balanceBN = await (contract.balanceOf as any)(walletAddress);
    const formatted = ethers.formatUnits(balanceBN, 6); // 6 decimales como el contrato

    return formatted;
}
