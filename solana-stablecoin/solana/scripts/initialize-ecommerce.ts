import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
} from "@solana/web3.js";
import * as fs from "fs";
import { execSync } from "child_process";
import { createHash } from "crypto";

async function main() {
  console.log("--------------------------------------------------");
  console.log("🚀 INITIALIZING ECOMMERCE GLOBAL STATE");

  let rpcUrl = "http://127.0.0.1:8899";
  let walletPath = "~/.config/solana/id.json";
  try {
    const solanaConfig = execSync("solana config get").toString();
    const rpcMatch = solanaConfig.match(/RPC URL: (.+)/);
    const walletMatch = solanaConfig.match(/Keypair Path: (.+)/);
    if (rpcMatch) rpcUrl = rpcMatch[1].trim();
    if (walletMatch) walletPath = walletMatch[1].trim();
  } catch (e) {
    console.warn("⚠️ Usando configuración de red por defecto (localhost).");
  }

  const connection = new Connection(rpcUrl, "confirmed");
  const fullWalletPath = walletPath.replace(/^~/, process.env.HOME || "");
  const secretKey = Uint8Array.from(
    JSON.parse(fs.readFileSync(fullWalletPath, "utf-8"))
  );
  const payer = Keypair.fromSecretKey(secretKey);

  const programIdStr = process.argv[2];
  if (!programIdStr) {
    console.error("❌ Error: Program ID no provisto.");
    process.exit(1);
  }
  const programId = new PublicKey(programIdStr);

  console.log(`📡 RPC:     ${rpcUrl}`);
  console.log(`👤 Payer:   ${payer.publicKey.toBase58()}`);
  console.log(`🆔 Program: ${programId.toBase58()}`);

  // 1. Calcular PDA para GlobalState
  const [globalStatePda] = PublicKey.findProgramAddressSync(
    [Buffer.from("global-state")],
    programId
  );
  console.log(`📍 Global State PDA: ${globalStatePda.toBase58()}`);

  // 2. Verificar si ya está inicializado
  const accountInfo = await connection.getAccountInfo(globalStatePda);
  if (accountInfo) {
    console.log("⚠️ Global State ya está inicializado. Saltando...");
    return;
  }

  // 3. Generar discriminador para 'initialize'
  const hash = createHash("sha256");
  hash.update("global:initialize");
  const discriminator = hash.digest().slice(0, 8);

  // 4. Construir instrucción
  const instruction = new TransactionInstruction({
    keys: [
      { pubkey: globalStatePda, isSigner: false, isWritable: true },
      { pubkey: payer.publicKey, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    programId,
    data: discriminator,
  });

  const transaction = new Transaction().add(instruction);
  transaction.feePayer = payer.publicKey;
  const { blockhash } = await connection.getLatestBlockhash("confirmed");
  transaction.recentBlockhash = blockhash;
  transaction.sign(payer);

  try {
    const signature = await connection.sendRawTransaction(transaction.serialize());
    await connection.confirmTransaction(signature, "confirmed");
    console.log(`✅ Inicialización exitosa! Hash: ${signature}`);
  } catch (err: any) {
    console.error(`❌ Error al inicializar: ${err.message}`);
    if (err.logs) {
      console.error("📜 Logs:");
      err.logs.forEach((l: string) => console.error(`  ${l}`));
    }
  }
}

main().catch(console.error);
