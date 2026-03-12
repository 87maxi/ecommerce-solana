import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SolanaEcommerce } from "../target/types/solana_ecommerce";
import { expect } from "chai";

describe("solana-ecommerce", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.solanaEcommerce as Program<SolanaEcommerce>;

  const admin = (provider.wallet as anchor.Wallet).payer;
  const companyOwner = anchor.web3.Keypair.generate();
  const customer = anchor.web3.Keypair.generate();

  const [globalStatePda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("global-state")],
    program.programId
  );

  const getCompanyPda = (id: number) => {
    const buf = Buffer.alloc(8);
    new anchor.BN(id).toArrayLike(Buffer, "le", 8).copy(buf);
    return anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("company"), buf],
      program.programId
    )[0];
  };

  const getProductPda = (id: number) => {
    const buf = Buffer.alloc(8);
    new anchor.BN(id).toArrayLike(Buffer, "le", 8).copy(buf);
    return anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("product"), buf],
      program.programId
    )[0];
  };

  const getCustomerPda = (pubkey: anchor.web3.PublicKey) => {
    return anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("customer"), pubkey.toBuffer()],
      program.programId
    )[0];
  };

  const getCartPda = (pubkey: anchor.web3.PublicKey) => {
    return anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("shopping-cart"), pubkey.toBuffer()],
      program.programId
    )[0];
  };

  const getInvoicePda = (id: number) => {
    const buf = Buffer.alloc(8);
    new anchor.BN(id).toArrayLike(Buffer, "le", 8).copy(buf);
    return anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("invoice"), buf],
      program.programId
    )[0];
  };

  before(async () => {
    const signature1 = await provider.connection.requestAirdrop(
      companyOwner.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(signature1);

    const signature2 = await provider.connection.requestAirdrop(
      customer.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(signature2);
  });

  it("Initializes the platform", async () => {
    await program.methods
      .initialize()
      .accounts({
        globalState: globalStatePda,
        admin: admin.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      } as any)
      .rpc();

    const state = await program.account.globalState.fetch(globalStatePda);
    expect(state.owner.toBase58()).to.equal(admin.publicKey.toBase58());
    expect(state.nextCompanyId.toNumber()).to.equal(1);
    expect(state.nextProductId.toNumber()).to.equal(1);
    expect(state.nextInvoiceId.toNumber()).to.equal(1);
  });

  it("Registers a company", async () => {
    const companyName = "Test Company";
    const companyDesc = "A test company description";
    const companyPda = getCompanyPda(1);

    await program.methods
      .registerCompany(companyName, companyDesc)
      .accounts({
        globalState: globalStatePda,
        company: companyPda,
        owner: companyOwner.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      } as any)
      .signers([companyOwner])
      .rpc();

    const company = await program.account.company.fetch(companyPda);
    expect(company.id.toNumber()).to.equal(1);
    expect(company.name).to.equal(companyName);
    expect(company.owner.toBase58()).to.equal(
      companyOwner.publicKey.toBase58()
    );
    expect(company.isActive).to.be.true;

    const state = await program.account.globalState.fetch(globalStatePda);
    expect(state.nextCompanyId.toNumber()).to.equal(2);
  });

  it("Adds a product", async () => {
    const productName = "Test Product";
    const productDesc = "Product description";
    const price = new anchor.BN(100);
    const stock = new anchor.BN(50);
    const image = "http://image.url";

    const companyPda = getCompanyPda(1);
    const productPda = getProductPda(1);

    await program.methods
      .addProduct(productName, productDesc, price, image, stock)
      .accounts({
        globalState: globalStatePda,
        company: companyPda,
        product: productPda,
        owner: companyOwner.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      } as any)
      .signers([companyOwner])
      .rpc();

    const product = await program.account.product.fetch(productPda);
    expect(product.id.toNumber()).to.equal(1);
    expect(product.companyId.toNumber()).to.equal(1);
    expect(product.name).to.equal(productName);
    expect(product.price.toNumber()).to.equal(100);
    expect(product.stock.toNumber()).to.equal(50);

    const state = await program.account.globalState.fetch(globalStatePda);
    expect(state.nextProductId.toNumber()).to.equal(2);
  });

  it("Updates product stock", async () => {
    const productPda = getProductPda(1);
    const companyPda = getCompanyPda(1);
    const newStock = new anchor.BN(100);

    await program.methods
      .updateStock(newStock)
      .accounts({
        company: companyPda,
        product: productPda,
        owner: companyOwner.publicKey,
      } as any)
      .signers([companyOwner])
      .rpc();

    const product = await program.account.product.fetch(productPda);
    expect(product.stock.toNumber()).to.equal(100);
  });

  it("Decreases product stock", async () => {
    const productPda = getProductPda(1);
    const companyPda = getCompanyPda(1);
    const quantity = new anchor.BN(10);

    await program.methods
      .decreaseStock(quantity)
      .accounts({
        company: companyPda,
        product: productPda,
        owner: companyOwner.publicKey,
      } as any)
      .signers([companyOwner])
      .rpc();

    const product = await program.account.product.fetch(productPda);
    expect(product.stock.toNumber()).to.equal(90);
  });

  it("Registers a customer", async () => {
    const customerPda = getCustomerPda(customer.publicKey);

    await program.methods
      .registerCustomer()
      .accounts({
        customer: customerPda,
        user: customer.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      } as any)
      .signers([customer])
      .rpc();

    const customerAcc = await program.account.customer.fetch(customerPda);
    expect(customerAcc.isRegistered).to.be.true;
    expect(customerAcc.address.toBase58()).to.equal(
      customer.publicKey.toBase58()
    );
  });

  it("Manages shopping cart", async () => {
    const cartPda = getCartPda(customer.publicKey);
    const productId = new anchor.BN(1);
    const quantity = new anchor.BN(2);

    // Add to cart
    await program.methods
      .addToCart(productId, quantity)
      .accounts({
        cart: cartPda,
        user: customer.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      } as any)
      .signers([customer])
      .rpc();

    let cart = await program.account.shoppingCart.fetch(cartPda);
    expect(cart.items.length).to.equal(1);
    expect(cart.items[0].productId.toNumber()).to.equal(1);
    expect(cart.items[0].quantity.toNumber()).to.equal(2);

    // Update quantity
    const newQuantity = new anchor.BN(5);
    await program.methods
      .updateQuantity(productId, newQuantity)
      .accounts({
        cart: cartPda,
        user: customer.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      } as any)
      .signers([customer])
      .rpc();

    cart = await program.account.shoppingCart.fetch(cartPda);
    expect(cart.items[0].quantity.toNumber()).to.equal(5);

    // Remove from cart
    await program.methods
      .removeFromCart(productId)
      .accounts({
        cart: cartPda,
        user: customer.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      } as any)
      .signers([customer])
      .rpc();

    cart = await program.account.shoppingCart.fetch(cartPda);
    expect(cart.items.length).to.equal(0);
  });

  it("Creates an invoice and clears cart", async () => {
    const invoicePda = getInvoicePda(1);
    const cartPda = getCartPda(customer.publicKey);
    const companyId = new anchor.BN(1);
    const productId = new anchor.BN(1);
    const quantity = new anchor.BN(3);
    const totalAmount = new anchor.BN(300); // 3 * 100

    // Add to cart first
    await program.methods
      .addToCart(productId, quantity)
      .accounts({
        cart: cartPda,
        user: customer.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      } as any)
      .signers([customer])
      .rpc();

    // Create invoice
    await program.methods
      .createInvoice(companyId, totalAmount)
      .accounts({
        globalState: globalStatePda,
        invoice: invoicePda,
        cart: cartPda,
        user: customer.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      } as any)
      .signers([customer])
      .rpc();

    const invoice = await program.account.invoice.fetch(invoicePda);
    expect(invoice.invoiceId.toNumber()).to.equal(1);
    expect(invoice.totalAmount.toNumber()).to.equal(300);
    expect(invoice.customerAddress.toBase58()).to.equal(
      customer.publicKey.toBase58()
    );
    expect(invoice.status).to.have.property("pending");

    // Cart should be cleared
    const cart = await program.account.shoppingCart.fetch(cartPda);
    expect(cart.items.length).to.equal(0);

    const state = await program.account.globalState.fetch(globalStatePda);
    expect(state.nextInvoiceId.toNumber()).to.equal(2);
  });

  it("Processes a payment", async () => {
    const invoicePda = getInvoicePda(1);
    const customerPda = getCustomerPda(customer.publicKey);
    const txHash = "solana_transaction_hash_example";

    await program.methods
      .processPayment(txHash)
      .accounts({
        invoice: invoicePda,
        customer: customerPda,
        authority: admin.publicKey,
      } as any)
      .signers([admin])
      .rpc();

    const invoice = await program.account.invoice.fetch(invoicePda);
    expect(invoice.status).to.have.property("paid");
    expect(invoice.paymentTxHash).to.equal(txHash);

    const customerAcc = await program.account.customer.fetch(customerPda);
    expect(customerAcc.totalPurchases.toNumber()).to.equal(1);
    expect(customerAcc.totalSpent.toNumber()).to.equal(300);
  });

  it("Deactivates and activates a company", async () => {
    const companyPda = getCompanyPda(1);

    // Deactivate
    await program.methods
      .deactivateCompany()
      .accounts({
        globalState: globalStatePda,
        company: companyPda,
        owner: companyOwner.publicKey,
      } as any)
      .signers([companyOwner])
      .rpc();

    let company = await program.account.company.fetch(companyPda);
    expect(company.isActive).to.be.false;

    // Activate
    await program.methods
      .activateCompany()
      .accounts({
        globalState: globalStatePda,
        company: companyPda,
        owner: companyOwner.publicKey,
      } as any)
      .signers([companyOwner])
      .rpc();

    company = await program.account.company.fetch(companyPda);
    expect(company.isActive).to.be.true;
  });

  it("Deactivates and activates a product", async () => {
    const productPda = getProductPda(1);
    const companyPda = getCompanyPda(1);

    // Deactivate
    await program.methods
      .deactivateProduct()
      .accounts({
        company: companyPda,
        product: productPda,
        owner: companyOwner.publicKey,
      } as any)
      .signers([companyOwner])
      .rpc();

    let product = await program.account.product.fetch(productPda);
    expect(product.isActive).to.be.false;

    // Activate
    await program.methods
      .activateProduct()
      .accounts({
        company: companyPda,
        product: productPda,
        owner: companyOwner.publicKey,
      } as any)
      .signers([companyOwner])
      .rpc();

    product = await program.account.product.fetch(productPda);
    expect(product.isActive).to.be.true;
  });
});
