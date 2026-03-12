use anchor_lang::prelude::*;

#[error_code]
pub enum EcommerceError {
    #[msg("You are not authorized to perform this action.")]
    Unauthorized,

    #[msg("Company already exists for this owner.")]
    CompanyAlreadyExists,

    #[msg("Company is not active.")]
    CompanyInactive,

    #[msg("Company is already inactive.")]
    CompanyAlreadyInactive,

    #[msg("Company does not exist.")]
    CompanyNotFound,

    #[msg("Product does not exist.")]
    ProductNotFound,

    #[msg("Insufficient stock for the requested product.")]
    InsufficientStock,

    #[msg("Product is already inactive.")]
    ProductAlreadyInactive,

    #[msg("Product is already active.")]
    ProductAlreadyActive,

    #[msg("Customer is already registered.")]
    CustomerAlreadyRegistered,

    #[msg("Customer is not registered.")]
    CustomerNotRegistered,

    #[msg("Cart is empty.")]
    CartEmpty,

    #[msg("Item not found in cart.")]
    ItemNotInCart,

    #[msg("Invalid quantity provided.")]
    InvalidQuantity,

    #[msg("Array length mismatch.")]
    ArrayLengthMismatch,

    #[msg("Invoice already paid.")]
    InvoiceAlreadyPaid,

    #[msg("Invoice not found.")]
    InvoiceNotFound,

    #[msg("Numerical overflow occurred.")]
    Overflow,
}
