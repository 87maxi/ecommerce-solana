// @ts-nocheck
import * as anchor from "@coral-xyz/anchor";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";
import * as fs from "fs";
import * as path from "path";

const TOKEN_PROGRAM_ID = new PublicKey(
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
);

async function main() {
  console.log("🚀 Initializing Stablecoin Contract...");

  // 1. Connect to local Solana cluster
  const connection = new Connection("http://127.0.0.1:8899", "confirmed");

  // 2. Load the deployer wallet
  const walletPath = process.env.HOME + "/.config/solana/id.json";
  if (!fs.existsSync(walletPath)) {
    console.error(`❌ Wallet not found at ${walletPath}`);
    process.exit(1);
  }
  const secretKey = Uint8Array.from(
    JSON.parse(fs.readFileSync(walletPath, "utf-8"))
  );
  const payer = Keypair.fromSecretKey(secretKey);

  // 3. Setup Anchor Provider
  const wallet = new anchor.Wallet(payer);
  const provider = new anchor.AnchorProvider(
    connection,
    wallet,
    anchor.AnchorProvider.defaultOptions()
  );
  anchor.setProvider(provider);

  // 4. Load the compiled IDL
  const idlPath = path.resolve(__dirname, "../target/idl/solana.json");
  if (!fs.existsSync(idlPath)) {
    throw new Error(
      `❌ IDL not found at ${idlPath}. Make sure to run 'anchor build' first.`
    );
  }
  const idl = JSON.parse(fs.readFileSync(idlPath, "utf-8"));

  // 5. Define Program and PDAs
  // New stablecoin program ID to prevent collision with ecommerce program
  const programId = new PublicKey(
    "FYss1r2Dy5C4L1EvNq2PeAtrQbFzZ1zSdnmuS6fsrZ9j"
  );
  idl.address = programId.toBase58();
  const program = new anchor.Program(idl, provider);

  const mintKeypair = Keypair.generate();

  const [mintAuthorityPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("mint_authority")],
    programId
  );

  console.log("Program ID:         ", programId.toBase58());
  console.log("Mint Authority PDA: ", mintAuthorityPda.toBase58());
  console.log("New Mint Address:   ", mintKeypair.publicKey.toBase58());

  // 6. Execute Initialization Instruction
  try {
    const tx = await program.methods
      .initialize()
      .accounts({
        payer: payer.publicKey,
        mintAuthority: mintAuthorityPda,
        mint: mintKeypair.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      } as any)
      .signers([mintKeypair])
      .rpc();

    console.log("✅ Stablecoin initialized successfully!");
    console.log("Transaction Hash:", tx);

    // Save the generated mint address so deploy.sh can use it for frontend .env generation
    fs.writeFileSync(
      path.resolve(__dirname, "../mint_address.txt"),
      mintKeypair.publicKey.toBase58()
    );
    console.log(
      "💾 Saved mint address to solana-stablecoin/solana/mint_address.txt"
    );
  } catch (error) {
    console.error("❌ Initialization failed:", error);
    process.exit(1);
  }
}

main();
