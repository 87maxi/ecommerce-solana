import {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  getOrCreateAssociatedTokenAccount,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { Program, AnchorProvider, BN, Idl } from "@coral-xyz/anchor";
import solanaIdl from "./solana_idl.json";

const IDL = solanaIdl as Idl;

/**
 * Mints EuroTokens (EURT) to a specified wallet address after a successful payment.
 * This function corrects the "IncorrectProgramId" error by using the high-level
 * helper functions from @solana/spl-token, which ensures the correct Token
 * Program ID is used for all token-related instructions.
 *
 * @param walletAddress The recipient's Solana wallet address (as a string).
 * @param amount The number of tokens to mint (e.g., 100.00).
 * @param invoice A reference invoice ID for logging.
 * @returns A promise that resolves to an object containing the transaction hash.
 */
export async function mintTokens(
  walletAddress: string,
  amount: number,
  invoice: string,
): Promise<{ transactionHash: string }> {
  console.log(
    `[MINTING] Initiating mint for invoice ${invoice}: ${amount} EURT to ${walletAddress}`,
  );

  // 1. Establish Connection to the Solana cluster.
  const rpcUrl = process.env.RPC_URL;
  if (!rpcUrl) {
    throw new Error("RPC_URL is not defined in environment variables.");
  }
  const connection = new Connection(rpcUrl, "confirmed");
  console.log(`[MINTING] Connected to RPC endpoint: ${rpcUrl}`);

  // 2. Load the Minter's Keypair from the environment variable.
  // This keypair must have minting authority for the EURT token.
  const ownerPrivateKeyString = process.env.OWNER_PRIVATE_KEY;
  if (!ownerPrivateKeyString) {
    throw new Error("OWNER_PRIVATE_KEY is not set in environment variables.");
  }

  // The private key from `~/.config/solana/id.json` is a JSON array of numbers.
  // We parse it into a Uint8Array to load the Keypair.
  const secretKey = Uint8Array.from(JSON.parse(ownerPrivateKeyString));
  const minter = Keypair.fromSecretKey(secretKey);

  // 3. Define the necessary public keys.
  const recipientPublicKey = new PublicKey(walletAddress);
  const mintPublicKeyStr = process.env.NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS;
  if (!mintPublicKeyStr) {
    throw new Error(
      "NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS is not set in environment variables.",
    );
  }
  const mintPublicKey = new PublicKey(mintPublicKeyStr);

  // Diagnostic logging to help debug future issues.
  console.log("[MINTING] Key Information:");
  console.log(`  - Recipient Wallet: ${recipientPublicKey.toBase58()}`);
  console.log(`  - EURT Mint Address: ${mintPublicKey.toBase58()}`);
  console.log(`  - Mint Authority (Payer): ${minter.publicKey.toBase58()}`);

  try {
    // 4. Get or create the Associated Token Account (ATA) for the recipient.
    // The `getOrCreateAssociatedTokenAccount` helper function is crucial as it handles
    // the creation of the ATA if it doesn't exist, using the correct
    // Associated Token Program ID. The `minter` pays for this creation.
    console.log(
      `[MINTING] Looking for or creating ATA for wallet ${recipientPublicKey.toBase58()}...`,
    );
    const associatedTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      minter, // Payer for the transaction if ATA needs to be created
      mintPublicKey, // The mint of the token
      recipientPublicKey, // The owner of the ATA
    );
    console.log(
      `[MINTING] ATA address: ${associatedTokenAccount.address.toBase58()}`,
    );

    // 5. Mint the tokens to the recipient's ATA.
    // The amount needs to be scaled by the token's decimals. We assume 6 for EURT.
    const decimals = 6;
    const amountToMint = amount * Math.pow(10, decimals);

    console.log(
      `[MINTING] Minting ${amount} EURT (which is ${amountToMint} in token units) to ATA...`,
    );

    // Configure Anchor Program
    const programIdStr = process.env.NEXT_PUBLIC_STABLECOIN_PROGRAM_ADDRESS;
    if (!programIdStr) {
      throw new Error("NEXT_PUBLIC_STABLECOIN_PROGRAM_ADDRESS is not set.");
    }
    const programId = new PublicKey(programIdStr);
    const wallet = {
      publicKey: minter.publicKey,
      signTransaction: async (tx: any) => {
        if (tx.version !== undefined) {
          tx.sign([minter]);
        } else {
          tx.partialSign(minter);
        }
        return tx;
      },
      signAllTransactions: async (txs: any[]) => {
        return txs.map((tx) => {
          if (tx.version !== undefined) {
            tx.sign([minter]);
          } else {
            tx.partialSign(minter);
          }
          return tx;
        });
      },
    };
    const provider = new AnchorProvider(connection, wallet as any, {
      commitment: "confirmed",
    });
    const program = new Program(
      { ...IDL, address: programIdStr } as unknown as Idl,
      provider,
    );

    const [mintAuthorityPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("mint_authority")],
      programId,
    );

    // Call Anchor Smart Contract to mint tokens via PDA Authority
    const transactionSignature = await program.methods
      .mintTokens(new BN(amountToMint))
      .accounts({
        mint: mintPublicKey,
        mintAuthority: mintAuthorityPda,
        destination: associatedTokenAccount.address,
        payer: minter.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      } as any)
      .rpc();

    console.log(
      `[MINTING] ✅ Mint successful! Transaction signature: ${transactionSignature}`,
    );

    return { transactionHash: transactionSignature };
  } catch (error: any) {
    console.error(
      "[MINTING] ❌ An error occurred during the minting process:",
      error,
    );
    if (error.logs) {
      console.error("[MINTING] Solana transaction logs:", error.logs);
    }
    throw new Error(`Failed to mint tokens: ${error.message}`);
  }
}

/**
 * Gets the EURT balance for a given wallet address.
 * @param walletAddress The Solana wallet address.
 * @returns The balance as a string.
 */
export async function getBalance(walletAddress: string): Promise<string> {
  try {
    const rpcUrl = process.env.RPC_URL;
    if (!rpcUrl) {
      throw new Error("RPC_URL is not defined in environment variables.");
    }
    const connection = new Connection(rpcUrl, "confirmed");

    const mintPublicKeyStr = process.env.NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS;
    if (!mintPublicKeyStr) {
      throw new Error("NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS is not set.");
    }

    const mint = new PublicKey(mintPublicKeyStr);
    const owner = new PublicKey(walletAddress);

    const accounts = await connection.getParsedTokenAccountsByOwner(owner, {
      mint: mint,
    });

    if (accounts.value.length === 0) {
      return "0";
    }

    return (
      accounts.value[0].account.data.parsed.info.tokenAmount.uiAmountString ||
      "0"
    );
  } catch (error: any) {
    console.error("[BALANCE] Error getting balance:", error);
    return "0";
  }
}
