pragma solidity ^0.8.13;

import  {Test} from "forge-std/Test.sol";
import {Ecommerce} from "../../src/Ecommerce.sol";
import {ERC20Mock} from "../../test/mock/ERC20Mock.sol";

contract ReentrancyTest is Test {
    Ecommerce public ecommerce;
    ERC20Mock public euroToken;

    address public owner = address(1);
    address public companyOwner = address(2);
    address public customer = address(3);

    uint256 public companyId;
    uint256 public productId;
    uint256 public invoiceId;

    function setUp() public {
        // Deploy mock EuroToken
        euroToken = new ERC20Mock("Euro Token", "EURT", 6);

        // Deploy Ecommerce contract
        vm.startPrank(owner);
        ecommerce = new Ecommerce();
        vm.stopPrank();

        // Register a company
        vm.startPrank(owner);
        companyId = ecommerce.registerCompany(companyOwner, "Test Company", "Test Description");
        vm.stopPrank();

        // Add a product
        vm.startPrank(companyOwner);
        productId = ecommerce.addProduct(companyId, "Test Product", "Test Description", 100000, "ipfs://image", 10);
        vm.stopPrank();
        
        // Register customer
        vm.startPrank(customer);
        ecommerce.registerCustomer();
        // Add product to cart
        ecommerce.addToCart(productId, 2);
        // Create invoice
        invoiceId = ecommerce.createInvoice(companyId);
        vm.stopPrank();

        // Mint tokens to customer
        euroToken.mint(customer, 1000000);
    }

    // Malicious contract to attempt reentrancy attack
    MaliciousPaymentReceiver public malicious;

    function setUpMaliciousContract() public {
        malicious = new MaliciousPaymentReceiver(address(ecommerce), invoiceId);
        // Transfer some funds to the malicious contract
        vm.deal(address(malicious), 1);
    }

    // Test that reentrancy attack fails
    function testReentrancyAttackFails() public {
        setUpMaliciousContract();

        vm.startPrank(address(malicious));

        // Expect the payment to fail due to reentrancy guard
        vm.expectRevert();
        malicious.callProcessPayment();

        vm.stopPrank();

        // Verify invoice is still unpaid
        Ecommerce.Invoice memory invoice = ecommerce.getInvoice(invoiceId);
        assertEq(uint8(invoice.status), uint8(Ecommerce.PaymentStatus.PENDING));
    }
}

// Malicious contract that tries to re-enter the payment function
contract MaliciousPaymentReceiver {
    Ecommerce public ecommerce;
    uint256 public invoiceId;

    constructor(address _ecommerce, uint256 _invoiceId) {
        ecommerce = Ecommerce(_ecommerce);
        invoiceId = _invoiceId;
    }

    // This function will be called by the ecommerce contract
    // It will try to re-enter the payment function
    function receivePayment() external {
        // Try to process payment again (reentrancia attack)
        ecommerce.processPayment(invoiceId, "txhash123");
    }

    // Function to initiate the payment process
    function callProcessPayment() external {
        // Set up the payment
        ecommerce.processPayment(invoiceId, "txhash123");
    }

    // Receive function to accept ETH
    receive() external payable {}
}
