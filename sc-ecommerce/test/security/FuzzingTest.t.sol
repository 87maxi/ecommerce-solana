pragma solidity ^0.8.13;

import {Test} from "forge-std/Test.sol";
import {Ecommerce} from "../../src/Ecommerce.sol";
import {ERC20Mock} from "../../test/mock/ERC20Mock.sol";

// Import the libraries to access their types
import {ShoppingCartLib} from "../../src/libraries/ShoppingCartLib.sol";
import {CompanyLib} from "../../src/libraries/CompanyLib.sol";
import {ProductLib} from "../../src/libraries/ProductLib.sol";

contract FuzzingTest is Test {
    Ecommerce public ecommerce;
    ERC20Mock public euroToken;

    address public owner = address(1);
    address public companyOwner = address(2);
    address public customer = address(3);

    uint256 public companyId;
    uint256 public productId;

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
        productId = ecommerce.addProduct(companyId, "Test Product", "Test Description", 100000, "ipfs://image", 100);
        vm.stopPrank();

        // Register customer
        vm.startPrank(customer);
        ecommerce.registerCustomer();
        vm.stopPrank();
    }

    // Fuzz test for adding to cart with various quantities
    function testFuzz_AddToCart(uint256 quantity) public {
        // Bound the quantity to a reasonable range
        quantity = bound(quantity, 1, 10);

        vm.startPrank(customer);
        ecommerce.addToCart(productId, quantity);

        // Verify cart contents - use the correct return type
        ShoppingCartLib.CartItem[] memory cart = ecommerce.getCart();
        assertEq(cart.length, 1);
        assertEq(cart[0].productId, productId);
        assertEq(cart[0].quantity, quantity);

        vm.stopPrank();
    }

    // Fuzz test for updating cart quantity
    function testFuzz_UpdateQuantity(uint256 newQuantity) public {
        // First add to cart
        vm.startPrank(customer);
        ecommerce.addToCart(productId, 5);

        // Bound the new quantity to a reasonable range
        newQuantity = bound(newQuantity, 1, 20);

        // Update quantity
        ecommerce.updateQuantity(productId, newQuantity);

        // Verify cart contents
        ShoppingCartLib.CartItem[] memory cart = ecommerce.getCart();
        assertEq(cart.length, 1);
        assertEq(cart[0].quantity, newQuantity);

        vm.stopPrank();
    }

    // Fuzz test for company registration with different addresses
    function testFuzz_RegisterCompany(address companyAddress) public {
        // Exclude zero address and owner addresses
        vm.assume(companyAddress != address(0));
        vm.assume(companyAddress != owner);
        vm.assume(companyAddress != companyOwner);
        vm.assume(companyAddress != customer);

        vm.startPrank(owner);
        uint256 newCompanyId = ecommerce.registerCompany(companyAddress, "Fuzz Company", "Fuzz Description");

        // Verify company was registered - access the struct fields correctly
        CompanyLib.Company memory company = ecommerce.getCompany(newCompanyId);
        assertEq(company.id, newCompanyId);
        assertEq(company.owner, companyAddress);
        assertEq(company.name, "Fuzz Company");

        vm.stopPrank();
    }

    // Fuzz test for product pricing
    function testFuzz_AddProductWithDifferentPrices(uint256 price) public {
        // Use a reasonable price range (100 to 1000000)
        price = bound(price, 100, 1000000);

        vm.startPrank(companyOwner);
        uint256 newProductId =
            ecommerce.addProduct(companyId, "Fuzz Product", "Fuzz Description", price, "ipfs://image", 10);

        // Verify product was added with correct price - access the struct fields correctly
        ProductLib.Product memory product = ecommerce.getProduct(newProductId);
        assertEq(product.price, price);

        vm.stopPrank();
    }
}
