import {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  sendAndConfirmTransaction,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  getAccount,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import bs58 from "bs58";
import crypto from "crypto";

/**
 * Mints EuroTokens to a user's Solana wallet
 */
export async function mintTokens(
  walletAddress: string,
  amount: number,
  invoice: string,
) {
  console.log(`[MINT-TOKENS] Starting mint process:`, {
    walletAddress,
    amount,
    invoice,
  });

  const rpcUrl = process.env.RPC_URL || "http://127.0.0.1:8899";
  console.log(`[MINT-TOKENS] Connecting to RPC: ${rpcUrl}`);
  const connection = new Connection(rpcUrl, "confirmed");

  const privateKeyStr =
    process.env.OWNER_PRIVATE_KEY || process.env.PRIVATE_KEY;
  if (!privateKeyStr) {
    throw new Error("Missing OWNER_PRIVATE_KEY or PRIVATE_KEY in environment");
  }

  let secretKey: Uint8Array;
  try {
    // Check if the key is a JSON array
    secretKey = Uint8Array.from(JSON.parse(privateKeyStr));
  } catch {
    // Fallback to base58
    secretKey = bs58.decode(privateKeyStr);
  }

  const wallet = Keypair.fromSecretKey(secretKey);
  console.log(
    `[MINT-TOKENS] Using wallet address: ${wallet.publicKey.toBase58()}`,
  );

  const mintAddressStr = process.env.NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS;
  if (!mintAddressStr) {
    throw new Error(
      "Missing NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS in environment",
    );
  }

  const mint = new PublicKey(mintAddressStr);
  const userPubKey = new PublicKey(walletAddress);
  const programId = new PublicKey(
    "8yCgaxbTDGiWe6XuMAq6XUimC8ovSx5J4GEJnEKuhGk5",
  );

  console.log(
    `[MINT-TOKENS] Fetching or creating Associated Token Account for user...`,
  );
  const userAta = await getAssociatedTokenAddress(mint, userPubKey);

  const tx = new Transaction();

  try {
    await getAccount(connection, userAta);
    console.log(`[MINT-TOKENS] User ATA already exists: ${userAta.toBase58()}`);
  } catch (e: any) {
    console.log(
      `[MINT-TOKENS] User ATA not found, adding creation instruction for: ${userAta.toBase58()}`,
    );
    tx.add(
      createAssociatedTokenAccountInstruction(
        wallet.publicKey, // payer
        userAta, // ata
        userPubKey, // owner
        mint, // mint
      ),
    );
  }

  const [mintAuthority] = PublicKey.findProgramAddressSync(
    [Buffer.from("mint_authority")],
    programId,
  );

  // EuroToken has 6 decimals
  const amountInSmallestUnit = Math.floor(amount * 1_000_000);
  console.log(
    `[MINT-TOKENS] Sending transaction to Solana... Amount: ${amountInSmallestUnit}`,
  );

  // Compute the 8-byte discriminator for 'global:mint_tokens'
  const discriminator = crypto
    .createHash("sha256")
    .update("global:mint_tokens")
    .digest()
    .subarray(0, 8);

  // Build data buffer: 8 bytes discriminator + 8 bytes u64 amount
  const data = Buffer.alloc(16);
  discriminator.copy(data, 0);
  data.writeBigUInt64LE(BigInt(amountInSmallestUnit), 8);

  // Build the instruction mapping exactly to the MintTokens struct in our Anchor program
  const mintIx = new TransactionInstruction({
    programId: programId,
    keys: [
      { pubkey: mint, isSigner: false, isWritable: true },
      { pubkey: mintAuthority, isSigner: false, isWritable: false },
      { pubkey: userAta, isSigner: false, isWritable: true },
      { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
    data: data,
  });

  tx.add(mintIx);

  const signature = await sendAndConfirmTransaction(connection, tx, [wallet]);

  console.log(`[MINT-TOKENS] Tokens minted successfully!`, {
    transactionHash: signature,
    walletAddress,
    amount,
  });

  return {
    transactionHash: signature,
    walletAddress,
    amount,
    invoice,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Gets the EuroToken balance for a user's wallet
 */
export async function getBalance(walletAddress: string) {
  const rpcUrl = process.env.RPC_URL || "http://127.0.0.1:8899";
  const connection = new Connection(rpcUrl, "confirmed");

  const mintAddressStr = process.env.NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS;
  if (!mintAddressStr) {
    throw new Error(
      "Missing NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS in environment",
    );
  }

  try {
    const mint = new PublicKey(mintAddressStr);
    const userPubKey = new PublicKey(walletAddress);

    const userAta = await getAssociatedTokenAddress(mint, userPubKey);
    const accountInfo = await connection.getTokenAccountBalance(userAta);

    return accountInfo.value.uiAmountString || "0";
  } catch (error) {
    console.error(
      `[BALANCE] Error fetching balance or account not initialized:`,
      error,
    );
    return "0";
  }
}
