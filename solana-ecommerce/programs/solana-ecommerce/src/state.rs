use anchor_lang::prelude::*;

#[account]
pub struct GlobalState {
    pub owner: Pubkey,
    pub next_company_id: u64,
    pub next_product_id: u64,
    pub next_invoice_id: u64,
}

impl GlobalState {
    pub const SIZE: usize = 8 + 32 + 8 + 8 + 8;
}

#[account]
pub struct Company {
    pub id: u64,
    pub owner: Pubkey,
    pub name: String,
    pub description: String,
    pub is_active: bool,
    pub created_at: i64,
}

impl Company {
    pub const MAX_SIZE: usize = 8 + 8 + 32 + (4 + 50) + (4 + 200) + 1 + 8;
}

#[account]
pub struct Product {
    pub id: u64,
    pub company_id: u64,
    pub name: String,
    pub description: String,
    pub price: u64,
    pub stock: u64,
    pub image: String,
    pub is_active: bool,
}

impl Product {
    pub const MAX_SIZE: usize = 8 + 8 + 8 + (4 + 50) + (4 + 200) + 8 + 8 + (4 + 100) + 1;
}

#[account]
pub struct Customer {
    pub address: Pubkey,
    pub total_purchases: u64,
    pub total_spent: u64,
    pub created_at: i64,
    pub is_registered: bool,
}

impl Customer {
    pub const SIZE: usize = 8 + 32 + 8 + 8 + 8 + 1;
}

#[account]
pub struct ShoppingCart {
    pub customer: Pubkey,
    pub items: Vec<CartItem>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct CartItem {
    pub product_id: u64,
    pub quantity: u64,
}

impl CartItem {
    pub const SIZE: usize = 8 + 8;
}

impl ShoppingCart {
    pub const MAX_ITEMS: usize = 20;
    pub const MAX_SIZE: usize = 8 + 32 + 4 + (Self::MAX_ITEMS * CartItem::SIZE);
}

#[account]
pub struct Invoice {
    pub invoice_id: u64,
    pub company_id: u64,
    pub customer_address: Pubkey,
    pub total_amount: u64,
    pub timestamp: i64,
    pub status: PaymentStatus,
    pub payment_tx_hash: String,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum PaymentStatus {
    Pending,
    Paid,
    Failed,
    Refunded,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct InvoiceItem {
    pub product_id: u64,
    pub name: String,
    pub quantity: u64,
    pub unit_price: u64,
    pub total_price: u64,
}

impl InvoiceItem {
    pub const MAX_SIZE: usize = 8 + (4 + 50) + 8 + 8 + 8;
}

impl Invoice {
    pub const MAX_SIZE: usize = 8 + 8 + 8 + 32 + 8 + 8 + 1 + (4 + 100);
}
