pragma solidity ^0.8.13;

// Import necessary interfaces
import {ReentrancyGuard}  from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// Import libraries
import {CompanyLib}  from "./libraries/CompanyLib.sol";
import {ProductLib}  from "./libraries/ProductLib.sol";
import {CustomerLib}  from "./libraries/CustomerLib.sol";
import {ShoppingCartLib}  from "./libraries/ShoppingCartLib.sol";

contract Ecommerce is ReentrancyGuard {
    // Constructor to set owner
    constructor() {
        owner = msg.sender;
    }

    // Using libraries for storage
    using CompanyLib for CompanyLib.CompanyStorage;
    using ProductLib for ProductLib.ProductStorage;
    using CustomerLib for CustomerLib.CustomerStorage;
    using ShoppingCartLib for ShoppingCartLib.ShoppingCartStorage;

    // Storage instances
    CompanyLib.CompanyStorage internal companyStorage;
    ProductLib.ProductStorage internal productStorage;
    CustomerLib.CustomerStorage internal customerStorage;
    ShoppingCartLib.ShoppingCartStorage internal shoppingCartStorage;

    // Contract owner
    address public owner;

    // Invoices
    struct Invoice {
        uint256 invoiceId;
        uint256 companyId;
        address customerAddress;
        uint256 totalAmount;
        uint256 timestamp;
        PaymentStatus status;
        string paymentTxHash;
        uint256 paymentExpiration;
        string lastErrorMessage;
    }

    struct InvoiceItem {
        uint256 productId;
        string productName;
        uint256 quantity;
        uint256 unitPrice;
        uint256 totalPrice;
    }

    // Mapping from invoice ID to Invoice
    mapping(uint256 => Invoice) public invoices;

    // Mapping from invoice ID to list of InvoiceItems
    mapping(uint256 => InvoiceItem[]) public invoiceItems;

    // Mapping from customer address to list of their invoice IDs
    mapping(address => uint256[]) public customerInvoices;

    // Mapping from company ID to list of their invoice IDs
    mapping(uint256 => uint256[]) public companyInvoices;

    // Next invoice ID
    uint256 public nextInvoiceId;

    // Array to track all invoice IDs
    uint256[] private allInvoices;

    // Events
    event CompanyCreated(uint256 indexed companyId, address indexed owner, string name, uint256 indexed timestamp);
    event CompanyUpdated(uint256 indexed companyId, address indexed owner, string name, uint256 indexed timestamp);
    event CompanyStatusChanged(uint256 indexed companyId, address indexed owner, bool active, uint256 indexed timestamp);
    event CompanyDeactivated(uint256 indexed companyId);
    event CompanyActivated(uint256 indexed companyId);
    event InvoiceCreated(
        uint256 indexed invoiceId, uint256 indexed companyId, address indexed customerAddress, uint256 totalAmount
    );
    event PaymentProcessed(
        uint256 indexed invoiceId,
        address indexed customer,
        uint256 amount,
        string paymentTxHash,
        PaymentStatus status,
        uint256 indexed timestamp
    );
    event PaymentStatusUpdated(
        uint256 indexed invoiceId,
        PaymentStatus previousStatus,
        PaymentStatus newStatus,
        string reason,
        uint256 indexed timestamp
    );
    event PaymentRefunded(
        uint256 indexed invoiceId,
        address indexed customer,
        uint256 amount,
        string refundTxHash,
        uint256 indexed timestamp
    );
    event ProductCreated(uint256 indexed productId, uint256 indexed companyId, string name, uint256 price, uint256 indexed timestamp);
    event ProductUpdated(uint256 indexed productId, uint256 indexed companyId, string name, uint256 price, uint256 indexed timestamp);
    event ProductStatusChanged(uint256 indexed productId, uint256 indexed companyId, bool active, uint256 indexed timestamp);
    event ProductStockUpdated(uint256 indexed productId, uint256 stock, uint256 indexed timestamp);
    event QuantitiesUpdated(address indexed customer, uint256[] productIds, uint256[] quantities);

    // Payment status enumeration
    enum PaymentStatus { PENDING, COMPLETED, FAILED, REFUNDED }

    // Modifiers
    modifier onlyOwner() {
        _checkOwner();
        _;
    }

    modifier onlyCompanyOwner(uint256 companyId) {
        _checkCompanyOwner(companyId);
        _;
    }

    // Internal functions for modifier logic
    function _checkOwner() internal view {
        require(owner == msg.sender, "Ecommerce: Not contract owner");
    }

    function _checkCompanyOwner(uint256 companyId) internal view {
        require(companyStorage.getCompany(companyId).owner == msg.sender, "Ecommerce: Not company owner");
    }

    // Company functions
    function registerCompany(address companyAddress, string memory name, string memory description)
        external
        onlyOwner
        returns (uint256)
    {
        uint256 companyId = companyStorage.registerCompany(companyAddress, name, description);
        emit CompanyCreated(companyId, companyAddress, name, block.timestamp);
        return companyId;
    }

    function deactivateCompany(uint256 companyId) external onlyOwner {
        companyStorage.deactivateCompany(companyId);
        emit CompanyDeactivated(companyId);
    }

    function activateCompany(uint256 companyId) external {
        companyStorage.activateCompany(companyId);
        emit CompanyActivated(companyId);
    }

    function getCompany(uint256 companyId) external view returns (CompanyLib.Company memory) {
        return companyStorage.getCompany(companyId);
    }

    function getCompanyByAddress(address companyAddress) external view returns (CompanyLib.Company memory) {
        return companyStorage.getCompanyByOwner(companyAddress);
    }

    function getAllCompanies() external view returns (uint256[] memory) {
        return companyStorage.getAllCompanies();
    }

    function isCompanyActive(uint256 companyId) external view returns (bool) {
        CompanyLib.Company memory company = companyStorage.getCompany(companyId);
        return company.isActive;
    }

    // Product functions
    function addProduct(
        uint256 companyId,
        string memory name,
        string memory description,
        uint256 price,
        string memory image,
        uint256 stock
    ) external onlyCompanyOwner(companyId) returns (uint256) {
        return productStorage.addProduct(companyId, name, description, price, image, stock);
    }

    function updateStock(uint256 productId, uint256 stock) external returns (bool) {
        uint256 companyId = productStorage.products[productId].companyId;
        require(companyId != 0, "Ecommerce: Product does not exist");

        productStorage.updateStock(productId, stock);
        return true;
    }

    function decreaseStock(uint256 productId, uint256 quantity) external returns (bool) {
        uint256 companyId = productStorage.products[productId].companyId;
        require(companyId != 0, "Ecommerce: Product does not exist");

        productStorage.decreaseStock(productId, quantity);
        return true;
    }

    function deactivateProduct(uint256 productId) external returns (bool) {
        uint256 companyId = productStorage.products[productId].companyId;
        require(companyId != 0, "Ecommerce: Product does not exist");

        productStorage.deactivateProduct(productId);
        return true;
    }

    function activateProduct(uint256 productId) external returns (bool) {
        uint256 companyId = productStorage.products[productId].companyId;
        require(companyId != 0, "Ecommerce: Product does not exist");

        productStorage.activateProduct(productId);
        return true;
    }

    function getProduct(uint256 productId) external view returns (ProductLib.Product memory) {
        return productStorage.getProduct(productId);
    }

    function getProductsByCompany(uint256 companyId) external view returns (uint256[] memory) {
        return productStorage.getProductsByCompany(companyId);
    }

    function getAllProducts() external view returns (uint256[] memory) {
        return productStorage.getAllProducts();
    }

    function getProductsByCompanyAndStatus(uint256 companyId, bool activeStatus) external view returns (uint256[] memory) {
        return productStorage.getProductsByCompanyAndStatus(companyId, activeStatus);
    }

    function isProductAvailable(uint256 productId, uint256 quantity) external view returns (bool) {
        return productStorage.isProductAvailable(productId, quantity);
    }

    // Customer functions
    function registerCustomer() external returns (bool) {
        // Skip if already registered
        if (customerStorage.isCustomerRegistered(msg.sender)) {
            return false;
        }
        
        customerStorage.registerCustomer(msg.sender);
        
        return true;
    }

    // Invoice functions
    function createInvoice(uint256 companyId) external nonReentrant returns (uint256) {
        // Validate customer registration
        require(customerStorage.isCustomerRegistered(msg.sender), "Ecommerce: Customer not registered");

        // Validate company
        CompanyLib.Company memory company = companyStorage.getCompany(companyId);
        require(company.id != 0, "Ecommerce: Company does not exist");
        require(company.isActive, "Ecommerce: Company is not active");

        // Get customer's cart
        ShoppingCartLib.CartItem[] memory cartItems = shoppingCartStorage.getCart(msg.sender);
        require(cartItems.length > 0, "Ecommerce: Cart is empty");

        // Calculate total amount
        uint256 totalAmount = calculateTotal();
        require(totalAmount > 0, "Ecommerce: Total amount must be greater than 0");

        // Validate all products are available
        for (uint256 i = 0; i < cartItems.length; i++) {
            require(
                productStorage.isProductAvailable(cartItems[i].productId, cartItems[i].quantity),
                "Ecommerce: Product not available or insufficient stock"
            );
        }

        // Create invoice with post-increment
        uint256 invoiceId = ++nextInvoiceId;

        invoices[invoiceId] = Invoice({
            invoiceId: invoiceId,
            companyId: companyId,
            customerAddress: msg.sender,
            totalAmount: totalAmount,
            timestamp: block.timestamp,
            status: PaymentStatus.PENDING,
            paymentTxHash: "",
            paymentExpiration: block.timestamp + 30 days,
            lastErrorMessage: ""
        });

        // Add invoice items
        for (uint256 i = 0; i < cartItems.length; i++) {
            ProductLib.Product memory product = productStorage.getProduct(cartItems[i].productId);
            invoiceItems[invoiceId].push(
                InvoiceItem({
                    productId: cartItems[i].productId,
                    productName: product.name,
                    quantity: cartItems[i].quantity,
                    unitPrice: product.price,
                    totalPrice: product.price * cartItems[i].quantity
                })
            );
        }

        // Add to customer's invoice list
        customerInvoices[msg.sender].push(invoiceId);

        // Add to company's invoice list
        companyInvoices[companyId].push(invoiceId);

        // Add to all invoices list
        allInvoices.push(invoiceId);

        // Clear customer's cart
        shoppingCartStorage.clearCart(msg.sender);

        emit InvoiceCreated(invoiceId, companyId, msg.sender, totalAmount);

        return invoiceId;
    }

    function getInvoice(uint256 invoiceId) external view returns (Invoice memory) {
        require(invoices[invoiceId].invoiceId != 0, "Ecommerce: Invoice does not exist");
        return invoices[invoiceId];
    }

    function getInvoiceItems(uint256 invoiceId) external view returns (InvoiceItem[] memory) {
        require(invoices[invoiceId].invoiceId != 0, "Ecommerce: Invoice does not exist");
        return invoiceItems[invoiceId];
    }

    function getCustomerInvoices(address customerAddress) external view returns (uint256[] memory) {
        return customerInvoices[customerAddress];
    }

    function getCompanyInvoices(uint256 companyId) external view returns (uint256[] memory) {
        return companyInvoices[companyId];
    }

    function getAllInvoices() external view returns (uint256[] memory) {
        return allInvoices;
    }

    // Payment functions
    function processPayment(
        uint256 _invoiceId, 
        string memory _paymentTxHash
    ) external nonReentrant returns (bool) {
        // Validate invoice exists and status
        require(invoices[_invoiceId].invoiceId != 0, "Ecommerce: Invoice does not exist");
        require(
            invoices[_invoiceId].status == PaymentStatus.PENDING || 
            invoices[_invoiceId].status == PaymentStatus.FAILED,
            "Ecommerce: Invalid payment status for processing"
        );

        Invoice storage invoice = invoices[_invoiceId];
        
        // Validate customer ownership
        require(invoice.customerAddress == msg.sender, "Ecommerce: Not invoice owner");
        
        // Validate expiration
        require(block.timestamp <= invoice.paymentExpiration, "Ecommerce: Payment expired");
        
        // Process payment
        invoice.paymentTxHash = _paymentTxHash;
        
        // Complete processing
        invoice.status = PaymentStatus.COMPLETED;
        
        // Update customer stats
        customerStorage.customers[msg.sender].totalSpent += invoice.totalAmount;
        customerStorage.customers[msg.sender].totalPurchases++;
        
        // Decrease stock
        for (uint256 i = 0; i < invoiceItems[_invoiceId].length; i++) {
            productStorage.decreaseStock(invoiceItems[_invoiceId][i].productId, invoiceItems[_invoiceId][i].quantity);
        }
        
        // Emit processed event
        emit PaymentProcessed(
            _invoiceId, 
            msg.sender, 
            invoice.totalAmount, 
            _paymentTxHash, 
            invoice.status, 
            block.timestamp
        );
        
        return true;
    }
    
    function failPayment(
        uint256 _invoiceId,
        string memory _errorCode
    ) external onlyOwner returns (bool) {
        require(invoices[_invoiceId].invoiceId != 0, "Ecommerce: Invoice does not exist");
        require(
            invoices[_invoiceId].status == PaymentStatus.PENDING,
            "Ecommerce: Invalid payment status for failure"
        );
        
        Invoice storage invoice = invoices[_invoiceId];
        
        // Update payment status
        emit PaymentStatusUpdated(
            _invoiceId, 
            invoice.status, 
            PaymentStatus.FAILED, 
            _errorCode,
            block.timestamp
        );
        invoice.status = PaymentStatus.FAILED;
        invoice.lastErrorMessage = _errorCode;
        
        // Set expiration to 7 days in the future for retry window
        invoice.paymentExpiration = block.timestamp + 7 days;
        
        return true;
    }
    
    function refundPayment(
        uint256 _invoiceId,
        string memory _refundTxHash
    ) external onlyOwner returns (bool) {
        require(invoices[_invoiceId].invoiceId != 0, "Ecommerce: Invoice does not exist");
        require(
            invoices[_invoiceId].status == PaymentStatus.COMPLETED,
            "Ecommerce: Invalid payment status for refund"
        );
        
        Invoice storage invoice = invoices[_invoiceId];
        
        // Update payment status
        invoice.status = PaymentStatus.REFUNDED;
        
        // Emit refund event
        emit PaymentRefunded(
            _invoiceId, 
            invoice.customerAddress, 
            invoice.totalAmount, 
            _refundTxHash,
            block.timestamp
        );
        
        return true;
    }
    
    // Shopping cart functions

    function addToCart(uint256 productId, uint256 quantity) external {
        require(customerStorage.isCustomerRegistered(msg.sender), "Ecommerce: Customer not registered");
        shoppingCartStorage.addToCart(msg.sender, productId, quantity);
    }

    function removeFromCart(uint256 productId) external {
        require(customerStorage.isCustomerRegistered(msg.sender), "Ecommerce: Customer not registered");
        shoppingCartStorage.removeFromCart(msg.sender, productId);
    }

    function updateQuantity(uint256 productId, uint256 quantity) external {
        require(customerStorage.isCustomerRegistered(msg.sender), "Ecommerce: Customer not registered");
        shoppingCartStorage.updateQuantity(msg.sender, productId, quantity);
    }

    function getCart() external view returns (ShoppingCartLib.CartItem[] memory) {
        require(customerStorage.isCustomerRegistered(msg.sender), "Ecommerce: Customer not registered");
        return shoppingCartStorage.getCart(msg.sender);
    }

    function clearCart() external {
        require(customerStorage.isCustomerRegistered(msg.sender), "Ecommerce: Customer not registered");
        shoppingCartStorage.clearCart(msg.sender);
    }

    function calculateTotal() public view returns (uint256) {
        return shoppingCartStorage.calculateTotal(productStorage, msg.sender);
    }

    function getCartItemCount() external view returns (uint256) {
        require(customerStorage.isCustomerRegistered(msg.sender), "Ecommerce: Customer not registered");
        return shoppingCartStorage.getCartItemCount(msg.sender);
    }

    function getCustomer(address customerAddress) external view returns (CustomerLib.Customer memory) {
        return customerStorage.getCustomer(customerAddress);
    }

    function isCustomerRegistered(address customerAddress) external view returns (bool) {
        return customerStorage.isCustomerRegistered(customerAddress);
    }
}
