pragma solidity ^0.8.13;

// Import necessary libraries
import {Test} from  "forge-std/Test.sol";

// Import the main contract
import {Ecommerce} from "../src/Ecommerce.sol";

// Import libraries (needed for storage layout)
import {CompanyLib}  from "../src/libraries/CompanyLib.sol";

contract CompanyRegistryTest is Test {
    Ecommerce ecommerce;
    address owner = address(1);
    address companyOwner = address(2);
    address notOwner = address(3);

    // Setup function that runs before each test
    function setUp() public {
        // Start prank as owner to deploy contract
        vm.startPrank(owner);
        ecommerce = new Ecommerce();
        vm.stopPrank();
    }

    // Test that owner can register a company
    function testOwnerCanRegisterCompany() public {
        // Start prank as owner
        vm.startPrank(owner);

        // Register a company
        uint256 companyId = ecommerce.registerCompany(companyOwner, "Test Company", "Test Description");

        // Stop prank
        vm.stopPrank();

        // Get the company and verify its properties
        CompanyLib.Company memory company = ecommerce.getCompany(companyId);
        assertEq(company.id, companyId);
        assertEq(company.owner, companyOwner);
        assertEq(company.name, "Test Company");
        assertEq(company.description, "Test Description");
        assertEq(company.isActive, true);
    }

    // Test that non-owner cannot register a company
    function testNonOwnerCannotRegisterCompany() public {
        // Start prank as non-owner
        vm.startPrank(notOwner);

        // Try to register a company (should fail)
        vm.expectRevert("Ecommerce: Not contract owner");
        ecommerce.registerCompany(companyOwner, "Test Company", "Test Description");

        // Stop prank
        vm.stopPrank();
    }

    // Test that owner can deactivate a company
    function testOwnerCanDeactivateCompany() public {
        // First, register a company as owner
        vm.startPrank(owner);
        uint256 companyId = ecommerce.registerCompany(companyOwner, "Test Company", "Test Description");
        vm.stopPrank();

        // Now deactivate the company as owner
        vm.startPrank(owner);
        ecommerce.deactivateCompany(companyId);
        vm.stopPrank();

        // Get the company and verify it's inactive
        CompanyLib.Company memory company = ecommerce.getCompany(companyId);
        assertEq(company.isActive, false);
    }

    // Test that owner can activate a company
    function testOwnerCanActivateCompany() public {
        // First, register and deactivate a company
        vm.startPrank(owner);
        uint256 companyId = ecommerce.registerCompany(companyOwner, "Test Company", "Test Description");
        ecommerce.deactivateCompany(companyId);
        vm.stopPrank();

        // Now activate the company as owner
        vm.startPrank(owner);
        ecommerce.activateCompany(companyId);
        vm.stopPrank();

        // Get the company and verify it's active
        CompanyLib.Company memory company = ecommerce.getCompany(companyId);
        assertEq(company.isActive, true);
    }

    // Test that non-owner cannot deactivate a company
    function testNonOwnerCannotDeactivateCompany() public {
        // First, register a company as owner
        vm.startPrank(owner);
        uint256 companyId = ecommerce.registerCompany(companyOwner, "Test Company", "Test Description");
        vm.stopPrank();

        // Try to deactivate as non-owner (should fail)
        vm.startPrank(notOwner);
        vm.expectRevert("Ecommerce: Not contract owner");
        ecommerce.deactivateCompany(companyId);
        vm.stopPrank();
    }

    // Test getting company by ID
    function testGetCompanyById() public {
        // Register a company
        vm.startPrank(owner);
        uint256 companyId = ecommerce.registerCompany(companyOwner, "Test Company", "Test Description");
        vm.stopPrank();

        // Get the company and verify
        CompanyLib.Company memory company = ecommerce.getCompany(companyId);
        assertEq(company.id, companyId);
        assertEq(company.owner, companyOwner);
        assertEq(company.name, "Test Company");
    }

    // Test getting company by address
    function testGetCompanyByAddress() public {
        // Register a company
        vm.startPrank(owner);
        uint256 companyId = ecommerce.registerCompany(companyOwner, "Test Company", "Test Description");
        vm.stopPrank();

        // Get the company and verify
        CompanyLib.Company memory company = ecommerce.getCompanyByAddress(companyOwner);
        assertEq(company.id, companyId);
        assertEq(company.owner, companyOwner);
        assertEq(company.name, "Test Company");
    }

    // Test getting all companies
    function testGetAllCompanies() public {
        // Register two companies
        vm.startPrank(owner);
        uint256 companyId1 = ecommerce.registerCompany(address(4), "Test Company 1", "Test Description 1");
        uint256 companyId2 = ecommerce.registerCompany(address(5), "Test Company 2", "Test Description 2");
        vm.stopPrank();

        // Get all companies and verify count and contents
        uint256[] memory companies = ecommerce.getAllCompanies();
        assertEq(companies.length, 2);
        assertEq(companies[0], companyId1);
        assertEq(companies[1], companyId2);
    }

    // Test checking if company is active
    function testIsCompanyActive() public {
        // Register a company
        vm.startPrank(owner);
        uint256 companyId = ecommerce.registerCompany(companyOwner, "Test Company", "Test Description");
        vm.stopPrank();

        // Verify company is active
        bool isActive = ecommerce.isCompanyActive(companyId);
        assertTrue(isActive);

        // Deactivate company
        vm.startPrank(owner);
        ecommerce.deactivateCompany(companyId);
        vm.stopPrank();

        // Verify company is inactive
        isActive = ecommerce.isCompanyActive(companyId);
        assertFalse(isActive);
    }
}
