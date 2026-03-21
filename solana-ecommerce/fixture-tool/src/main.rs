#![allow(deprecated)]

use anchor_client::solana_sdk::commitment_config::CommitmentConfig;
use anchor_client::solana_sdk::pubkey::Pubkey;
use anchor_client::solana_sdk::signature::read_keypair_file;
use anchor_client::solana_sdk::system_program;
use anchor_client::Client;
use anchor_client::Cluster;
use anyhow::{anyhow, Result};
use clap::Parser;
use serde::{Deserialize, Serialize};
use std::fs;
use std::rc::Rc;
use std::str::FromStr;

#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
struct Args {
    #[arg(short, long)]
    fixture: String,

    #[arg(short, long)]
    program_id: Option<String>,

    #[arg(short, long, default_value = "/home/maxi/.config/solana/id.json")]
    keypair: String,
}

#[derive(Serialize, Deserialize, Debug)]
struct FixtureData {
    #[serde(rename = "programId")]
    program_id: String,
    steps: Vec<Step>,
}

#[derive(Serialize, Deserialize, Debug)]
struct Step {
    instruction: String,
    description: String,
    args: Vec<serde_json::Value>,
}

fn main() -> Result<()> {
    let args = Args::parse();

    // 1. Load Fixture
    let fixture_str = fs::read_to_string(&args.fixture)?;
    let fixture: FixtureData = serde_json::from_str(&fixture_str)?;

    let program_id_str = args.program_id.unwrap_or(fixture.program_id);
    let program_id = Pubkey::from_str(&program_id_str)?;

    // 2. Setup Client
    let payer =
        read_keypair_file(&args.keypair).map_err(|e| anyhow!("Failed to read keypair: {}", e))?;
    let cluster = Cluster::Localnet;
    let client = Client::new_with_options(cluster, Rc::new(payer), CommitmentConfig::confirmed());
    let program = client.program(program_id)?;

    println!("--------------------------------------------------");
    println!("🚀 NATIVE RUST FIXTURE SEEDER");
    println!("📡 RPC:     http://127.0.0.1:8899");
    println!("👤 Payer:   {}", program.payer());
    println!("🆔 Program: {}", program_id);
    println!("--------------------------------------------------");

    let (global_pda, _) = Pubkey::find_program_address(&[b"global-state"], &program_id);

    // 3. Auto-initialize global state if not yet done
    let rpc = program.rpc();
    match rpc.get_account(&global_pda) {
        Err(_) => {
            println!("\n🔧 Inicializando Global State...");
            let sig = program
                .request()
                .accounts(solana_ecommerce::accounts::Initialize {
                    global_state: global_pda,
                    admin: program.payer(),
                    system_program: system_program::ID,
                })
                .args(solana_ecommerce::instruction::Initialize {})
                .send()
                .map_err(|e| anyhow!("Failed to initialize: {:?}", e))?;
            println!("   ✅ Global State inicializado: {}", sig);
        }
        Ok(_) => {
            println!("\n✅ Global State ya existe, continuando...");
        }
    }

    // 4. Context for PDAs
    let mut context: std::collections::HashMap<String, Pubkey> = std::collections::HashMap::new();

    // 5. Execute Steps
    for (i, step) in fixture.steps.iter().enumerate() {
        println!(
            "\n🔹 [{}/{}] {}",
            i + 1,
            fixture.steps.len(),
            step.description
        );

        match step.instruction.as_str() {
            "register_company" => {
                let name = step.args[0].as_str().ok_or(anyhow!("Invalid name"))?;
                let description = step.args[1]
                    .as_str()
                    .ok_or(anyhow!("Invalid description"))?;

                // Read current next_company_id from chain
                let global_data: solana_ecommerce::state::GlobalState =
                    program.account(global_pda)?;
                let company_id = global_data.next_company_id;
                let company_id_bytes = company_id.to_le_bytes();

                let (company_pda, _) = Pubkey::find_program_address(
                    &[b"company", company_id_bytes.as_ref()],
                    &program_id,
                );
                context.insert("@company_pda".to_string(), company_pda);

                match program
                    .request()
                    .accounts(solana_ecommerce::accounts::RegisterCompany {
                        global_state: global_pda,
                        company: company_pda,
                        owner: program.payer(),
                        system_program: system_program::ID,
                    })
                    .args(solana_ecommerce::instruction::RegisterCompany {
                        name: name.to_string(),
                        description: description.to_string(),
                    })
                    .send()
                {
                    Ok(sig) => println!("   ✅ Éxito! Hash: {}", sig),
                    Err(e) => println!("   ⚠️ Saltando: {:?}", e),
                }
            }
            "add_product" => {
                let name = step.args[0].as_str().ok_or(anyhow!("Invalid name"))?;
                let description = step.args[1]
                    .as_str()
                    .ok_or(anyhow!("Invalid description"))?;
                let price = step.args[2].as_u64().ok_or(anyhow!("Invalid price"))?;
                let stock = step.args[3].as_u64().ok_or(anyhow!("Invalid stock"))?;

                let company_pda = *context
                    .get("@company_pda")
                    .ok_or(anyhow!("Company PDA not set — run register_company first"))?;

                // Read current next_product_id from chain
                let global_data: solana_ecommerce::state::GlobalState =
                    program.account(global_pda)?;
                let product_id = global_data.next_product_id;
                let product_id_bytes = product_id.to_le_bytes();

                let (product_pda, _) = Pubkey::find_program_address(
                    &[b"product", product_id_bytes.as_ref()],
                    &program_id,
                );

                // Find the company account to get its company_id
                let company_data: solana_ecommerce::state::Company =
                    program.account(company_pda)?;
                // Validate company is active
                if !company_data.is_active {
                    println!("   ⚠️ Saltando: Company is inactive");
                    continue;
                }

                match program
                    .request()
                    .accounts(solana_ecommerce::accounts::AddProduct {
                        global_state: global_pda,
                        company: company_pda,
                        product: product_pda,
                        owner: program.payer(),
                        system_program: system_program::ID,
                    })
                    .args(solana_ecommerce::instruction::AddProduct {
                        name: name.to_string(),
                        description: description.to_string(),
                        price,
                        stock,
                    })
                    .send()
                {
                    Ok(sig) => println!("   ✅ Éxito! Hash: {}", sig),
                    Err(e) => println!("   ⚠️ Saltando: {:?}", e),
                }
            }
            _ => {
                println!("   ❌ Instrucción no soportada: {}", step.instruction);
            }
        }
    }

    println!("\n✨ Importación de datos finalizada.");
    Ok(())
}
