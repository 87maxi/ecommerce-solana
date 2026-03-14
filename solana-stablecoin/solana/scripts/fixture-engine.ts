import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
  sendAndConfirmTransaction,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import { createHash } from "crypto";

/**
 * Motor de Fixtures Dinámico y Agnóstico para Solana (Borsh Native)
 *
 * Este script prescinde por completo de `@coral-xyz/anchor`.
 * En su lugar, lee el fixture, serializa los argumentos usando Borsh
 * y envía transacciones crudas usando `@solana/web3.js`.
 * Esto elimina todos los problemas de compatibilidad de IDL y versiones de Anchor.
 */
async function main() {
  console.log("--------------------------------------------------");
  console.log("🚀 SOLANA NATIVE FIXTURE ENGINE (Web3.js + Borsh)");

  // 1. Obtener configuración de red y wallet desde Solana CLI
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

  // 2. Configurar Conexión y Wallet
  const connection = new Connection(rpcUrl, "confirmed");
  const fullWalletPath = walletPath.replace(/^~/, process.env.HOME || "");
  const secretKey = Uint8Array.from(
    JSON.parse(fs.readFileSync(fullWalletPath, "utf-8"))
  );
  const payer = Keypair.fromSecretKey(secretKey);

  console.log(`📡 RPC:     ${rpcUrl}`);
  console.log(`👤 Payer:   ${payer.publicKey.toBase58()}`);

  // 3. Cargar Fixture JSON
  const fixturePath = process.argv[2];
  const overrideProgramId = process.argv[3];

  if (!fixturePath || !fs.existsSync(fixturePath)) {
    console.error(`❌ Error: Fixture no encontrado: ${fixturePath}`);
    process.exit(1);
  }

  const fixtureData = JSON.parse(fs.readFileSync(fixturePath, "utf-8"));
  const programIdStr = overrideProgramId || fixtureData.programId;

  if (!programIdStr) {
    console.error(
      `❌ Error: "programId" no definido en el JSON ni como argumento.`
    );
    process.exit(1);
  }

  const programId = new PublicKey(programIdStr);
  console.log(`🆔 Program: ${programId.toBase58()}`);

  // Verificar si el programa está desplegado
  const programAccount = await connection.getAccountInfo(programId);
  if (!programAccount) {
    console.error(
      `❌ ERROR CRÍTICO: El programa NO está desplegado en esta red.`
    );
    process.exit(1);
  }

  console.log("--------------------------------------------------");

  // Contexto para almacenar PDAs y claves generadas
  const context: Record<string, PublicKey> = {
    "@wallet": payer.publicKey,
  };

  // Variables estáticas comunes
  const systemProgramId = SystemProgram.programId;

  // Funciones manuales precisas de serialización Borsh

  // Serializar String en Borsh: 4 bytes (longitud en bytes) + bytes UTF-8
  const serializeBorshString = (str: string): Buffer => {
    const strBuffer = Buffer.from(str, "utf8");
    const lenBuffer = Buffer.alloc(4);
    lenBuffer.writeUInt32LE(strBuffer.length, 0); // OJO: Es la longitud en BYTES, no str.length
    return Buffer.concat([lenBuffer, strBuffer]);
  };

  // Serializar u64 en Borsh: 8 bytes Little Endian
  const serializeBorshU64 = (num: number | bigint): Buffer => {
    const buffer = Buffer.alloc(8);
    buffer.writeBigUInt64LE(BigInt(num), 0);
    return buffer;
  };

  // Función para obtener el discriminador de Anchor (hash sha256("global:<nombre_instruccion>")[0..8])
  const getDiscriminator = (instructionName: string): Buffer => {
    const hash = createHash("sha256");
    hash.update(`global:${instructionName}`);
    return hash.digest().slice(0, 8);
  };

  // 4. Ejecutar cada paso del Fixture
  for (let i = 0; i < fixtureData.steps.length; i++) {
    const step = fixtureData.steps[i];
    console.log(
      `\n🔹 [${i + 1}/${fixtureData.steps.length}] ${step.description}`
    );

    try {
      // --- A. Resolver Cuentas ---
      const keys: Array<{
        pubkey: PublicKey;
        isSigner: boolean;
        isWritable: boolean;
      }> = [];

      // Determinar cuentas basándonos en nombres estándar de Anchor
      // En Anchor puro, el orden importa. Como no usamos IDL, dependemos
      // de que el fixture JSON las liste en el orden correcto.
      for (const [keyName, accountDef] of Object.entries(step.accounts)) {
        let pubkey: PublicKey;

        // Resolver el valor
        if (typeof accountDef === "string") {
          if (accountDef === "11111111111111111111111111111111")
            pubkey = systemProgramId;
          else if (accountDef === "SysvarRent111111111111111111111111111111111")
            pubkey = SYSVAR_RENT_PUBKEY;
          else if (accountDef.startsWith("@"))
            pubkey = getContextRef(accountDef, context);
          else pubkey = new PublicKey(accountDef);
        } else if (typeof accountDef === "object" && (accountDef as any).pda) {
          const seeds = ((accountDef as any).pda as string[]).map((seed) => {
            if (seed.startsWith("@"))
              return getContextRef(seed, context).toBuffer();
            return Buffer.from(seed);
          });
          const [pda] = PublicKey.findProgramAddressSync(seeds, programId);
          pubkey = pda;
          context[`@${keyName}_pda`] = pda; // Guardar para pasos futuros
        } else {
          throw new Error(`Definición de cuenta inválida para: ${keyName}`);
        }

        // Inferir mutabilidad/firma basado en nombres comunes (heurística simple)
        // Esto asume convenciones de Anchor. En producción real sin IDL,
        // el JSON debería especificar "isWritable" e "isSigner".
        let isWritable = true;
        let isSigner = false;

        if (
          keyName === "system_program" ||
          keyName === "rent" ||
          keyName.includes("program")
        ) {
          isWritable = false;
        }
        if (
          keyName === "owner" ||
          keyName === "payer" ||
          keyName === "authority"
        ) {
          isSigner = true;
        }

        // Si es el wallet del ejecutante, siempre es firmante
        if (pubkey.equals(payer.publicKey)) {
          isSigner = true;
        }

        keys.push({ pubkey, isSigner, isWritable });
      }

      // --- B. Calcular Discriminador y Serializar Argumentos ---
      const discriminator = getDiscriminator(step.instruction);
      let serializedArgs = Buffer.alloc(0);

      if (step.args && step.args.length > 0) {
        const buffers: Buffer[] = [];

        if (step.instruction === "register_company") {
          // name: String, description: String
          buffers.push(serializeBorshString(step.args[0]));
          buffers.push(serializeBorshString(step.args[1]));
        } else if (step.instruction === "add_product") {
          // name: String, price: u64, stock: u64
          buffers.push(serializeBorshString(step.args[0]));
          buffers.push(serializeBorshU64(step.args[1]));
          buffers.push(serializeBorshU64(step.args[2]));
        } else {
          throw new Error(
            `Serialización manual no soportada para instrucción: ${step.instruction}`
          );
        }

        serializedArgs = Buffer.concat(buffers);
      }

      // --- C. Construir Payload Final ---
      const data = Buffer.concat([discriminator, serializedArgs]);

      // --- E. Crear y Enviar Transacción ---
      const instruction = new TransactionInstruction({
        keys,
        programId,
        data,
      });

      const transaction = new Transaction().add(instruction);

      // Pagar la transacción
      transaction.feePayer = payer.publicKey;
      const latestBlockhash = await connection.getLatestBlockhash();
      transaction.recentBlockhash = latestBlockhash.blockhash;

      // Enviar
      const signature = await sendAndConfirmTransaction(
        connection,
        transaction,
        [payer]
      );

      console.log(`   ✅ Éxito! Hash: ${signature}`);
    } catch (err: any) {
      console.error(`   ❌ Fallo: ${err.message || err}`);
      if (err.logs) {
        console.error("   📜 Logs:");
        err.logs.forEach((l: string) => console.error(`      ${l}`));
      }
      process.exit(1);
    }
  }
  console.log("\n✨ Importación de datos finalizada.");
}

function getContextRef(
  ref: string,
  context: Record<string, PublicKey>
): PublicKey {
  const val = context[ref];
  if (!val) throw new Error(`Referencia a contexto '${ref}' no encontrada.`);
  return val;
}

main().catch(console.error);
