use anchor_lang::prelude::*;

pub mod constants;
pub mod errors;
pub mod state;

use crate::constants::*;
use crate::errors::EcommerceError;
use crate::state::*;

declare_id!("5vC8pVqZguD8NB4qrrULXkXoN5ebfdsZLitYLmqpJAQj");

#[program]
pub mod solana_ecommerce {
    use super::*;

    /// Initializes the global state of the ecommerce platform
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let global_state = &mut ctx.accounts.global_state;
        global_state.owner = ctx.accounts.admin.key();
        global_state.next_company_id = 1;
        global_state.next_product_id = 1;
        global_state.next_invoice_id = 1;

        msg!(
            "Ecommerce platform initialized by: {:?}",
            global_state.owner
        );
        Ok(())
    }

    /// Registers a new company on the platform
    pub fn register_company(
        ctx: Context<RegisterCompany>,
        name: String,
        description: String,
    ) -> Result<()> {
        let global_state = &mut ctx.accounts.global_state;
        let company = &mut ctx.accounts.company;
        let clock = Clock::get()?;

        // Set company data
        company.id = global_state.next_company_id;
        company.owner = ctx.accounts.owner.key();
        company.name = name;
        company.description = description;
        company.is_active = true;
        company.created_at = clock.unix_timestamp;

        // Increment global counter
        global_state.next_company_id = global_state
            .next_company_id
            .checked_add(1)
            .ok_or(EcommerceError::Overflow)?;

        msg!("Company registered: {} (ID: {})", company.name, company.id);
        Ok(())
    }

    /// Deactivates a company (only by admin or company owner)
    pub fn deactivate_company(ctx: Context<UpdateCompanyStatus>) -> Result<()> {
        let company = &mut ctx.accounts.company;
        require!(company.is_active, EcommerceError::CompanyAlreadyInactive);

        company.is_active = false;
        msg!("Company deactivated: {}", company.id);
        Ok(())
    }

    /// Activates a company (only by admin or company owner)
    pub fn activate_company(ctx: Context<UpdateCompanyStatus>) -> Result<()> {
        let company = &mut ctx.accounts.company;
        require!(!company.is_active, EcommerceError::ProductAlreadyActive);

        company.is_active = true;
        msg!("Company activated: {}", company.id);
        Ok(())
    }

    /// Adds a new product to a company
    pub fn add_product(
        ctx: Context<AddProduct>,
        name: String,
        description: String,
        price: u64,
        image: String,
        stock: u64,
    ) -> Result<()> {
        let global_state = &mut ctx.accounts.global_state;
        let product = &mut ctx.accounts.product;
        let company = &ctx.accounts.company;

        require!(company.is_active, EcommerceError::CompanyInactive);

        product.id = global_state.next_product_id;
        product.company_id = company.id;
        product.name = name;
        product.description = description;
        product.price = price;
        product.stock = stock;
        product.image = image;
        product.is_active = true;

        global_state.next_product_id = global_state
            .next_product_id
            .checked_add(1)
            .ok_or(EcommerceError::Overflow)?;

        msg!("Product added: {} (ID: {})", product.name, product.id);
        Ok(())
    }

    /// Updates the stock level of a product
    pub fn update_stock(ctx: Context<UpdateProductStock>, new_stock: u64) -> Result<()> {
        let product = &mut ctx.accounts.product;
        product.stock = new_stock;

        msg!(
            "Product stock updated: {} (ID: {})",
            product.stock,
            product.id
        );
        Ok(())
    }

    /// Decreases the stock level of a product
    pub fn decrease_stock(ctx: Context<UpdateProductStock>, quantity: u64) -> Result<()> {
        let product = &mut ctx.accounts.product;
        require!(product.stock >= quantity, EcommerceError::InsufficientStock);

        product.stock = product
            .stock
            .checked_sub(quantity)
            .ok_or(EcommerceError::Overflow)?;

        msg!(
            "Product stock decreased: {} (ID: {})",
            product.stock,
            product.id
        );
        Ok(())
    }

    /// Deactivates a product
    pub fn deactivate_product(ctx: Context<UpdateProductStatus>) -> Result<()> {
        let product = &mut ctx.accounts.product;
        require!(product.is_active, EcommerceError::ProductAlreadyInactive);

        product.is_active = false;
        msg!("Product deactivated: {}", product.id);
        Ok(())
    }

    /// Activates a product
    pub fn activate_product(ctx: Context<UpdateProductStatus>) -> Result<()> {
        let product = &mut ctx.accounts.product;
        require!(!product.is_active, EcommerceError::ProductAlreadyActive);

        product.is_active = true;
        msg!("Product activated: {}", product.id);
        Ok(())
    }

    /// Registers a new customer
    pub fn register_customer(ctx: Context<RegisterCustomer>) -> Result<()> {
        let customer = &mut ctx.accounts.customer;
        let clock = Clock::get()?;

        customer.address = ctx.accounts.user.key();
        customer.total_purchases = 0;
        customer.total_spent = 0;
        customer.created_at = clock.unix_timestamp;
        customer.is_registered = true;

        msg!("Customer registered: {:?}", customer.address);
        Ok(())
    }

    /// Adds an item to the user's shopping cart
    pub fn add_to_cart(ctx: Context<UpdateCart>, product_id: u64, quantity: u64) -> Result<()> {
        let cart = &mut ctx.accounts.cart;
        require!(quantity > 0, EcommerceError::InvalidQuantity);

        // Find existing item or add new
        if let Some(item) = cart.items.iter_mut().find(|i| i.product_id == product_id) {
            item.quantity = item
                .quantity
                .checked_add(quantity)
                .ok_or(EcommerceError::Overflow)?;
        } else {
            require!(
                cart.items.len() < ShoppingCart::MAX_ITEMS,
                EcommerceError::Overflow
            );
            cart.items.push(CartItem {
                product_id,
                quantity,
            });
        }

        msg!(
            "Item added to cart: product {} quantity {}",
            product_id,
            quantity
        );
        Ok(())
    }

    /// Removes an item from the shopping cart
    pub fn remove_from_cart(ctx: Context<UpdateCart>, product_id: u64) -> Result<()> {
        let cart = &mut ctx.accounts.cart;
        let index = cart
            .items
            .iter()
            .position(|i| i.product_id == product_id)
            .ok_or(EcommerceError::ItemNotInCart)?;

        cart.items.remove(index);
        msg!("Item removed from cart: product {}", product_id);
        Ok(())
    }

    /// Updates the quantity of an item in the cart
    pub fn update_quantity(ctx: Context<UpdateCart>, product_id: u64, quantity: u64) -> Result<()> {
        let cart = &mut ctx.accounts.cart;
        require!(quantity > 0, EcommerceError::InvalidQuantity);

        let item = cart
            .items
            .iter_mut()
            .find(|i| i.product_id == product_id)
            .ok_or(EcommerceError::ItemNotInCart)?;

        item.quantity = quantity;
        msg!(
            "Cart quantity updated: product {} quantity {}",
            product_id,
            quantity
        );
        Ok(())
    }

    /// Clears all items from the shopping cart
    pub fn clear_cart(ctx: Context<UpdateCart>) -> Result<()> {
        let cart = &mut ctx.accounts.cart;
        cart.items.clear();
        msg!("Cart cleared");
        Ok(())
    }

    /// Creates an invoice from the shopping cart
    pub fn create_invoice(
        ctx: Context<CreateInvoice>,
        company_id: u64,
        total_amount: u64,
    ) -> Result<()> {
        let global_state = &mut ctx.accounts.global_state;
        let cart = &mut ctx.accounts.cart;
        let invoice = &mut ctx.accounts.invoice;
        let clock = Clock::get()?;

        require!(!cart.items.is_empty(), EcommerceError::CartEmpty);

        invoice.invoice_id = global_state.next_invoice_id;
        invoice.company_id = company_id;
        invoice.customer_address = ctx.accounts.user.key();
        invoice.total_amount = total_amount;
        invoice.timestamp = clock.unix_timestamp;
        invoice.status = PaymentStatus::Pending;
        invoice.payment_tx_hash = String::new();

        global_state.next_invoice_id = global_state
            .next_invoice_id
            .checked_add(1)
            .ok_or(EcommerceError::Overflow)?;

        // Clear the cart after creating the invoice
        cart.items.clear();

        msg!("Invoice created: ID {}", invoice.invoice_id);
        Ok(())
    }

    /// Processes a payment for an invoice
    pub fn process_payment(ctx: Context<ProcessPayment>, payment_tx_hash: String) -> Result<()> {
        let invoice = &mut ctx.accounts.invoice;
        let customer = &mut ctx.accounts.customer;

        require!(
            invoice.status == PaymentStatus::Pending,
            EcommerceError::InvoiceAlreadyPaid
        );

        invoice.status = PaymentStatus::Paid;
        invoice.payment_tx_hash = payment_tx_hash;

        // Update customer stats
        customer.total_purchases = customer
            .total_purchases
            .checked_add(1)
            .ok_or(EcommerceError::Overflow)?;
        customer.total_spent = customer
            .total_spent
            .checked_add(invoice.total_amount)
            .ok_or(EcommerceError::Overflow)?;

        msg!("Payment processed for invoice: {}", invoice.invoice_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = admin,
        space = GlobalState::SIZE,
        seeds = [GLOBAL_STATE_SEED],
        bump
    )]
    pub global_state: Account<'info, GlobalState>,

    #[account(mut)]
    pub admin: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RegisterCompany<'info> {
    #[account(mut, seeds = [GLOBAL_STATE_SEED], bump)]
    pub global_state: Account<'info, GlobalState>,

    #[account(
        init,
        payer = owner,
        space = Company::MAX_SIZE,
        seeds = [COMPANY_SEED, global_state.next_company_id.to_le_bytes().as_ref()],
        bump
    )]
    pub company: Account<'info, Company>,

    #[account(mut)]
    pub owner: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateCompanyStatus<'info> {
    #[account(seeds = [GLOBAL_STATE_SEED], bump)]
    pub global_state: Account<'info, GlobalState>,

    #[account(
        mut,
        seeds = [COMPANY_SEED, company.id.to_le_bytes().as_ref()],
        bump,
        constraint = company.owner == owner.key() || global_state.owner == owner.key() @ EcommerceError::Unauthorized
    )]
    pub company: Account<'info, Company>,

    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct AddProduct<'info> {
    #[account(mut, seeds = [GLOBAL_STATE_SEED], bump)]
    pub global_state: Account<'info, GlobalState>,

    #[account(
        seeds = [COMPANY_SEED, company.id.to_le_bytes().as_ref()],
        bump,
        constraint = company.owner == owner.key() @ EcommerceError::Unauthorized
    )]
    pub company: Account<'info, Company>,

    #[account(
        init,
        payer = owner,
        space = Product::MAX_SIZE,
        seeds = [PRODUCT_SEED, global_state.next_product_id.to_le_bytes().as_ref()],
        bump
    )]
    pub product: Account<'info, Product>,

    #[account(mut)]
    pub owner: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateProductStock<'info> {
    #[account(
        seeds = [COMPANY_SEED, company.id.to_le_bytes().as_ref()],
        bump,
        constraint = company.owner == owner.key() @ EcommerceError::Unauthorized
    )]
    pub company: Account<'info, Company>,

    #[account(
        mut,
        seeds = [PRODUCT_SEED, product.id.to_le_bytes().as_ref()],
        bump,
        constraint = product.company_id == company.id @ EcommerceError::Unauthorized
    )]
    pub product: Account<'info, Product>,

    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct RegisterCustomer<'info> {
    #[account(
        init,
        payer = user,
        space = Customer::SIZE,
        seeds = [CUSTOMER_SEED, user.key().as_ref()],
        bump
    )]
    pub customer: Account<'info, Customer>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateInvoice<'info> {
    #[account(mut, seeds = [GLOBAL_STATE_SEED], bump)]
    pub global_state: Account<'info, GlobalState>,

    #[account(
        init,
        payer = user,
        space = Invoice::MAX_SIZE,
        seeds = [INVOICE_SEED, global_state.next_invoice_id.to_le_bytes().as_ref()],
        bump
    )]
    pub invoice: Account<'info, Invoice>,

    #[account(mut, seeds = [CART_SEED, user.key().as_ref()], bump)]
    pub cart: Account<'info, ShoppingCart>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ProcessPayment<'info> {
    #[account(
        mut,
        seeds = [INVOICE_SEED, invoice.invoice_id.to_le_bytes().as_ref()],
        bump,
    )]
    pub invoice: Account<'info, Invoice>,

    #[account(
        mut,
        seeds = [CUSTOMER_SEED, invoice.customer_address.as_ref()],
        bump,
    )]
    pub customer: Account<'info, Customer>,

    #[account(mut)]
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct UpdateCart<'info> {
    #[account(
        init_if_needed,
        payer = user,
        space = ShoppingCart::MAX_SIZE,
        seeds = [CART_SEED, user.key().as_ref()],
        bump
    )]
    pub cart: Account<'info, ShoppingCart>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateProductStatus<'info> {
    #[account(
        seeds = [COMPANY_SEED, company.id.to_le_bytes().as_ref()],
        bump,
        constraint = company.owner == owner.key() @ EcommerceError::Unauthorized
    )]
    pub company: Account<'info, Company>,

    #[account(
        mut,
        seeds = [PRODUCT_SEED, product.id.to_le_bytes().as_ref()],
        bump,
        constraint = product.company_id == company.id @ EcommerceError::Unauthorized
    )]
    pub product: Account<'info, Product>,

    pub owner: Signer<'info>,
}
