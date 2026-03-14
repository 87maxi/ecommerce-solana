use anchor_lang::prelude::*;
use anchor_spl::token::{self, Burn, Mint, MintTo, Token, TokenAccount};

declare_id!("4ourUpEhfq64WVb1gRwR7fxkWbKZnMPmbx6D6dFwvGCq");

#[program]
pub mod solana {
    use super::*;

    pub fn initialize(_ctx: Context<Initialize>) -> Result<()> {
        msg!("EuroToken Mint Initialized with PDA Authority");
        Ok(())
    }

    pub fn mint_tokens(ctx: Context<MintTokens>, amount: u64) -> Result<()> {
        let seeds = &["mint_authority".as_bytes(), &[ctx.bumps.mint_authority]];
        let signer = &[&seeds[..]];

        let cpi_accounts = MintTo {
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.destination.to_account_info(),
            authority: ctx.accounts.mint_authority.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);

        token::mint_to(cpi_ctx, amount)?;
        msg!("Minted {} EURT tokens", amount);
        Ok(())
    }

    pub fn burn_tokens(ctx: Context<BurnTokens>, amount: u64) -> Result<()> {
        let cpi_accounts = Burn {
            mint: ctx.accounts.mint.to_account_info(),
            from: ctx.accounts.from.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

        token::burn(cpi_ctx, amount)?;
        msg!("Burned {} EURT tokens", amount);
        Ok(())
    }

    // --- E-commerce Instructions ---

    pub fn register_company(
        ctx: Context<RegisterCompany>,
        name: String,
        description: String,
    ) -> Result<()> {
        let company = &mut ctx.accounts.company;
        company.owner = ctx.accounts.owner.key();
        company.name = name.clone();
        company.description = description;
        company.is_active = true;
        msg!("Company registered: {}", name);
        Ok(())
    }

    pub fn add_product(
        ctx: Context<AddProduct>,
        name: String,
        price: u64,
        stock: u64,
    ) -> Result<()> {
        let product = &mut ctx.accounts.product;
        product.company = ctx.accounts.company.key();
        product.name = name.clone();
        product.price = price;
        product.stock = stock;
        msg!("Product added: {} with price {}", name, price);
        Ok(())
    }
}

#[account]
pub struct Company {
    pub owner: Pubkey,
    pub name: String,
    pub description: String,
    pub is_active: bool,
}

#[account]
pub struct Product {
    pub company: Pubkey,
    pub name: String,
    pub price: u64,
    pub stock: u64,
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    /// CHECK: PDA Mint Authority
    #[account(
        seeds = [b"mint_authority"],
        bump
    )]
    pub mint_authority: UncheckedAccount<'info>,

    #[account(
        init,
        payer = payer,
        mint::decimals = 6,
        mint::authority = mint_authority,
    )]
    pub mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct MintTokens<'info> {
    #[account(
        mut,
        mint::authority = mint_authority,
    )]
    pub mint: Account<'info, Mint>,

    /// CHECK: PDA Mint Authority
    #[account(
        seeds = [b"mint_authority"],
        bump
    )]
    pub mint_authority: UncheckedAccount<'info>,

    #[account(mut)]
    pub destination: Account<'info, TokenAccount>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct BurnTokens<'info> {
    #[account(mut)]
    pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub from: Account<'info, TokenAccount>,

    pub authority: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(name: String, description: String)]
pub struct RegisterCompany<'info> {
    #[account(
        init,
        payer = owner,
        space = 8 + 32 + 100 + 200 + 1,
        seeds = [b"company", owner.key().as_ref()],
        bump
    )]
    pub company: Account<'info, Company>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(name: String, price: u64, stock: u64)]
pub struct AddProduct<'info> {
    #[account(
        init,
        payer = owner,
        space = 8 + 32 + 100 + 8 + 8,
        seeds = [b"product", company.key().as_ref(), name.as_bytes()],
        bump
    )]
    pub product: Account<'info, Product>,
    pub company: Account<'info, Company>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}
