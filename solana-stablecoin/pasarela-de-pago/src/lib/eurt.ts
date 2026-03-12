import {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  sendAndConfirmTransaction,
  ParsedTransactionWithMeta,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createBurnInstruction,
} from "@solana/spl-token";
import bs58 from "bs58";

/**
 * Verify that a transaction signature corresponds to a valid EURT transfer on Solana
 */
export async function verifyTransfer(
  txHash: string,
  expectedAmount: string,
  expectedRecipient: string,
): Promise<{
  valid: boolean;
  amount: string;
  from: string;
  to: string;
  blockNumber: number | null;
}> {
  try {
    const rpcUrl = process.env.RPC_URL || "http://127.0.0.1:8899";
    const connection = new Connection(rpcUrl, "confirmed");
    const mintAddressStr = process.env.NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS;

    if (!mintAddressStr) {
      throw new Error("NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS not configured");
    }

    // Get parsed transaction
    const tx = await connection.getParsedTransaction(txHash, {
      maxSupportedTransactionVersion: 0,
    });

    if (!tx || !tx.meta) {
      return { valid: false, amount: "0", from: "", to: "", blockNumber: null };
    }

    let preBalance = 0;
    let postBalance = 0;

    const preTokenBalance = tx.meta.preTokenBalances?.find(
      (b) => b.mint === mintAddressStr && b.owner === expectedRecipient,
    );
    if (preTokenBalance && preTokenBalance.uiTokenAmount.uiAmountString) {
      preBalance = parseFloat(preTokenBalance.uiTokenAmount.uiAmountString);
    }

    const postTokenBalance = tx.meta.postTokenBalances?.find(
      (b) => b.mint === mintAddressStr && b.owner === expectedRecipient,
    );
    if (postTokenBalance && postTokenBalance.uiTokenAmount.uiAmountString) {
      postBalance = parseFloat(postTokenBalance.uiTokenAmount.uiAmountString);
    }

    const diff = postBalance - preBalance;
    const amountReceived = diff > 0 ? diff.toString() : "0";
    const valid = diff >= parseFloat(expectedAmount);

    // Finding the 'from' address by looking for the account that lost balance
    let fromAddress = tx.transaction.message.accountKeys[0].pubkey.toString(); // Payer usually fallback
    const senderBalance = tx.meta.preTokenBalances?.find(
      (b) =>
        b.mint === mintAddressStr &&
        b.owner !== expectedRecipient &&
        tx.meta?.postTokenBalances?.find(
          (pb) =>
            pb.accountIndex === b.accountIndex &&
            parseFloat(pb.uiTokenAmount.uiAmountString || "0") <
              parseFloat(b.uiTokenAmount.uiAmountString || "0"),
        ),
    );

    if (senderBalance && senderBalance.owner) {
      fromAddress = senderBalance.owner;
    }

    return {
      valid,
      amount: amountReceived,
      from: fromAddress,
      to: expectedRecipient,
      blockNumber: tx.slot,
    };
  } catch (error) {
    console.error("Error verifying transfer:", error);
    return { valid: false, amount: "0", from: "", to: "", blockNumber: null };
  }
}

/**
 * Get transaction details for a given signature
 */
export async function getTransactionDetails(
  txHash: string,
): Promise<ParsedTransactionWithMeta | null> {
  try {
    const rpcUrl = process.env.RPC_URL || "http://127.0.0.1:8899";
    const connection = new Connection(rpcUrl, "confirmed");

    const tx = await connection.getParsedTransaction(txHash, {
      maxSupportedTransactionVersion: 0,
    });

    return tx;
  } catch (error) {
    console.error("Error getting transaction details:", error);
    return null;
  }
}

/**
 * Burn tokens (remove from circulation after purchase completion)
 */
export async function burnTokens(
  amount: string,
): Promise<{ success: boolean; txHash?: string }> {
  try {
    const rpcUrl = process.env.RPC_URL || "http://127.0.0.1:8899";
    const connection = new Connection(rpcUrl, "confirmed");
    const mintAddressStr = process.env.NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS;
    const privateKeyStr =
      process.env.OWNER_PRIVATE_KEY || process.env.PRIVATE_KEY;

    if (!mintAddressStr || !privateKeyStr) {
      throw new Error("Missing configuration for burning tokens");
    }

    let secretKey: Uint8Array;
    try {
      secretKey = Uint8Array.from(JSON.parse(privateKeyStr));
    } catch {
      secretKey = bs58.decode(privateKeyStr);
    }

    const wallet = Keypair.fromSecretKey(secretKey);
    const mint = new PublicKey(mintAddressStr);

    const userAta = await getAssociatedTokenAddress(mint, wallet.publicKey);

    // Check if ATA exists and has balance
    try {
      await connection.getTokenAccountBalance(userAta);
    } catch (e) {
      console.warn("Wallet does not have an ATA or balance to burn from.");
      return { success: false };
    }

    const amountInSmallestUnit = Math.floor(parseFloat(amount) * 1_000_000); // 6 decimals

    const tx = new Transaction().add(
      createBurnInstruction(
        userAta,
        mint,
        wallet.publicKey,
        amountInSmallestUnit,
      ),
    );

    const signature = await sendAndConfirmTransaction(connection, tx, [wallet]);

    return { success: true, txHash: signature };
  } catch (error) {
    console.error("Error burning tokens:", error);
    return { success: false };
  }
}
