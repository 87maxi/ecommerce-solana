pragma solidity ^0.8.13;

// Import necessary libraries
import {Test} from  "forge-std/Test.sol";

// Import the main contract
import {Ecommerce} from  "../src/Ecommerce.sol";

// Import libraries (needed for storage layout)
import {CompanyLib}  from "../src/libraries/CompanyLib.sol";
import {ProductLib}  from "../src/libraries/ProductLib.sol";
import {CustomerLib}  from "../src/libraries/CustomerLib.sol";
import {ShoppingCartLib}  from "../src/libraries/ShoppingCartLib.sol";

import "./mock/ERC20Mock.sol";

contract IntegrationTest is Test {
    Ecommerce ecommerce;
    address owner = address(1);
    address companyOwner = address(2);
    address customer = address(3);

    // Mock ERC20 token for testing
    ERC20Mock public euroToken;

    uint256 public companyId;

    // Setup function that runs before each test
    function setUp() public {
        // Deploy mock EuroToken
        euroToken = new ERC20Mock("Euro Token", "EURT", 6);

        // Mint some tokens to the customer for testing payments
        euroToken.mint(customer, 1000000); // 1000.000 EURT (6 decimals)

        // Start prank as owner to deploy contract
        vm.startPrank(owner);
        ecommerce = new Ecommerce();
        vm.stopPrank();

        // Register a company and store its ID
        vm.startPrank(owner);
        companyId = ecommerce.registerCompany(companyOwner, "Test Company", "Test Description");
        vm.stopPrank();

        // Verify company was created successfully
        CompanyLib.Company memory company = ecommerce.getCompany(companyId);
        assertEq(company.id, companyId);
        assertEq(company.owner, companyOwner);
        assertTrue(company.isActive);
    }

    // Test complete purchase flow from customer registration to payment
    function testCompletePurchaseFlow() public {
        // 1. Customer registers
        vm.startPrank(customer);
        bool registered = ecommerce.registerCustomer();
        assertTrue(registered);
        vm.stopPrank();
        
        // 2. Add a product as company owner
        uint256 productId;
        vm.startPrank(companyOwner);
        productId = ecommerce.addProduct(companyId, "Test Product", "Test Description", 100000, "ipfs://image", 10); // 100.000 EURT
        vm.stopPrank();
        
        // 3. Add product to customer's cart
        vm.startPrank(customer);
        ecommerce.addToCart(productId, 2); // Buy 2 units

        // Verify cart has items
        ShoppingCartLib.CartItem[] memory cart = ecommerce.getCart();
        assertEq(cart.length, 1);
        assertEq(cart[0].productId, productId);
        assertEq(cart[0].quantity, 2);

        // Verify total amount is correct (2 * 100.000 = 200.000)
        uint256 total = ecommerce.calculateTotal();
        assertEq(total, 200000);

        // 4. Create invoice
        uint256 invoiceId = ecommerce.createInvoice(companyId);
        
        // Verify invoice was created
        Ecommerce.Invoice memory invoice = ecommerce.getInvoice(invoiceId);
        assertEq(invoice.invoiceId, invoiceId);
        assertEq(invoice.companyId, companyId);
        assertEq(invoice.customerAddress, customer);
        assertEq(invoice.totalAmount, 200000);
        assertEq(uint8(invoice.status), uint8(Ecommerce.PaymentStatus.PENDING));

        // Verify invoice items
        Ecommerce.InvoiceItem[] memory items = ecommerce.getInvoiceItems(invoiceId);
        assertEq(items.length, 1);
        assertEq(items[0].productId, productId);
        assertEq(items[0].quantity, 2);
        assertEq(items[0].unitPrice, 100000);
        assertEq(items[0].totalPrice, 200000);

        // Verify customer's invoice list
        uint256[] memory customerInvoices = ecommerce.getCustomerInvoices(customer);
        assertEq(customerInvoices.length, 1);
        assertEq(customerInvoices[0], invoiceId);

        // Verify company's invoice list
        uint256[] memory companyInvoices = ecommerce.getCompanyInvoices(companyId);
        assertEq(companyInvoices.length, 1);
        assertEq(companyInvoices[0], invoiceId);
        
        vm.stopPrank();
        
        // 5. Approve token transfer and process payment
        vm.startPrank(customer);
        
        // Approve the ecommerce contract to spend customer's tokens
        euroToken.approve(address(ecommerce), 200000);
        
        // Process payment
        bool success = ecommerce.processPayment(invoiceId, "txhash123");
        assertTrue(success);

        // Verify invoice is now paid
        invoice = ecommerce.getInvoice(invoiceId);
        assertEq(uint8(invoice.status), uint8(Ecommerce.PaymentStatus.COMPLETED));
        assertEq(invoice.paymentTxHash, "txhash123");

        // Verify customer's total spent and purchase count
        CustomerLib.Customer memory customerData = ecommerce.getCustomer(customer);
        assertEq(customerData.totalSpent, 200000);
        assertEq(customerData.totalPurchases, 1);

        // Verify cart is empty after purchase
        cart = ecommerce.getCart();
        assertEq(cart.length, 0);

        // Verify product stock was decreased
        ProductLib.Product memory product = ecommerce.getProduct(productId);
        assertEq(product.stock, 8); // Started with 10, bought 2

        vm.stopPrank();
    }

    // Test that customer cannot create invoice with empty cart
    function testCannotCreateInvoiceWithEmptyCart() public {
        vm.startPrank(customer);
        ecommerce.registerCustomer();

        // Try to create invoice with empty cart
        vm.expectRevert(bytes("Ecommerce: Cart is empty"));
        ecommerce.createInvoice(companyId);

        vm.stopPrank();
    }

    // Test that customer cannot process payment for non-existent invoice
    function testCannotProcessPaymentForNonExistentInvoice() public {
        vm.startPrank(customer);
        ecommerce.registerCustomer();

        // Try to process payment for non-existent invoice
        vm.expectRevert(bytes("Ecommerce: Invoice does not exist"));
        ecommerce.processPayment(999, "txhash123");

        vm.stopPrank();
    }

    // Test that customer cannot process payment for already paid invoice
    function testCannotProcessPaymentForAlreadyPaidInvoice() public {
        // We need to use the companyId from setUp
        uint256 productId;
        uint256 invoiceId;

        // 1. Customer registers
        vm.startPrank(customer);
        ecommerce.registerCustomer();
        vm.stopPrank();

        // 2. Add a product as company owner
        vm.startPrank(companyOwner);
        productId = ecommerce.addProduct(companyId, "Test Product", "Test Description", 100000, "ipfs://image", 10); // 100.000 EURT
        vm.stopPrank();

        // 3. Add product to customer's cart
        vm.startPrank(customer);
        ecommerce.addToCart(productId, 2); // Buy 2 units

        // 4. Create invoice
        invoiceId = ecommerce.createInvoice(companyId);

        // 5. Approve token transfer and process payment
        euroToken.approve(address(ecommerce), 200000);
        bool success = ecommerce.processPayment(invoiceId, "txhash123");
        assertTrue(success);
        vm.stopPrank();

        // Try to process payment again for the same invoice
        vm.startPrank(customer);
        vm.expectRevert(bytes("Ecommerce: Invalid payment status for processing"));
        ecommerce.processPayment(invoiceId, "txhash456");
        vm.stopPrank();
    }
}
