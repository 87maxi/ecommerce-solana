import { ethers } from 'ethers';
import EuroTokenABI from '@/contracts/abis/EuroTokenABI.json';

/**
 * Verify that a transaction hash corresponds to a valid EURT transfer
 */
export async function verifyTransfer(
    txHash: string,
    expectedAmount: string,
    expectedRecipient: string
): Promise<{ valid: boolean; amount: string; from: string; to: string; blockNumber: number | null }> {
    try {
        const rpcUrl = process.env.RPC_URL || 'http://127.0.0.1:8545';
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const contractAddress = process.env.NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS;

        if (!contractAddress) {
            throw new Error('NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS not configured');
        }

        // Get transaction receipt
        const receipt = await provider.getTransactionReceipt(txHash);

        if (!receipt) {
            return { valid: false, amount: '0', from: '', to: '', blockNumber: null };
        }

        // Parse transfer events from the receipt
        const contract = new ethers.Contract(contractAddress, EuroTokenABI, provider);
        const transferEvents = receipt.logs
            .filter(log => log.address.toLowerCase() === contractAddress.toLowerCase())
            .map(log => {
                try {
                    return contract.interface.parseLog({ topics: [...log.topics], data: log.data });
                } catch {
                    return null;
                }
            })
            .filter(event => event && event.name === 'Transfer');

        if (transferEvents.length === 0) {
            return { valid: false, amount: '0', from: '', to: '', blockNumber: receipt.blockNumber };
        }

        // Get the first transfer event (should only be one for a simple transfer)
        const transferEvent = transferEvents[0];
        const from = transferEvent?.args?.from || '';
        const to = transferEvent?.args?.to || '';
        const value = transferEvent?.args?.value || ethers.toBigInt(0);

        const amount = ethers.formatUnits(value, 6); // 6 decimales como el contrato
        const valid =
            to.toLowerCase() === expectedRecipient.toLowerCase() &&
            parseFloat(amount) >= parseFloat(expectedAmount);

        return {
            valid,
            amount,
            from,
            to,
            blockNumber: receipt.blockNumber
        };
    } catch (error) {
        console.error('Error verifying transfer:', error);
        return { valid: false, amount: '0', from: '', to: '', blockNumber: null };
    }
}

/**
 * Get transaction details for a given hash
 */
export async function getTransactionDetails(txHash: string) {
    try {
        const rpcUrl = process.env.RPC_URL || 'http://127.0.0.1:8545';
        const provider = new ethers.JsonRpcProvider(rpcUrl);

        const tx = await provider.getTransaction(txHash);
        const receipt = await provider.getTransactionReceipt(txHash);

        return {
            transaction: tx,
            receipt: receipt
        };
    } catch (error) {
        console.error('Error getting transaction details:', error);
        return null;
    }
}

/**
 * Burn tokens (remove from circulation after purchase completion)
 */
export async function burnTokens(amount: string): Promise<{ success: boolean; txHash?: string }> {
    try {
        const rpcUrl = process.env.RPC_URL || 'http://127.0.0.1:8545';
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const contractAddress = process.env.NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS;
        const privateKey = process.env.OWNER_PRIVATE_KEY;

        if (!contractAddress || !privateKey) {
            throw new Error('Missing configuration for burning tokens');
        }

        const wallet = new ethers.Wallet(privateKey, provider);
        const contract = new ethers.Contract(contractAddress, EuroTokenABI, wallet);

        const amountInWei = ethers.parseUnits(amount, 6); // 6 decimales como el contrato
        const tx = await (contract.burn as any)(amountInWei);
        await tx.wait();

        return { success: true, txHash: tx.hash };
    } catch (error) {
        console.error('Error burning tokens:', error);
        return { success: false };
    }
}
