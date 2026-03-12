// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Test} from "forge-std/Test.sol";
import {EuroToken} from "../src/EuroToken.sol";

contract EuroTokenTest is Test {
    EuroToken public euroToken;
    address public owner;
    address public user1;
    address public user2;

    function setUp() public {
        owner = makeAddr("owner");
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");

        vm.prank(owner);
        euroToken = new EuroToken(owner);

        vm.label(owner, "Owner");
        vm.label(user1, "User1");
        vm.label(user2, "User2");
    }

    function test_Metadata_IsCorrect() public {
        assertEq(euroToken.name(), "EuroToken");
        assertEq(euroToken.symbol(), "EURT");
        assertEq(euroToken.decimals(), 6);
    }

    function test_Owner_IsCorrect() public {
        assertEq(euroToken.owner(), owner);
    }

    function test_Mint_AllowsOwnerToMint() public {
        uint256 amount = 1000 * 10**6;

        vm.prank(owner);
        euroToken.mint(user1, amount);

        assertEq(euroToken.balanceOf(user1), amount);
        assertEq(euroToken.totalSupply(), amount);
    }

    function test_Mint_RevertsIfNotOwner() public {
        vm.expectRevert();
        vm.prank(user1);
        euroToken.mint(user1, 1000);
    }

    function test_Burn_Successful() public {
        uint256 mintAmount = 1000 * 10**6;
        uint256 burnAmount = 500 * 10**6;

        vm.prank(owner);
        euroToken.mint(user1, mintAmount);

        vm.prank(user1);
        euroToken.burn(burnAmount);

        assertEq(euroToken.balanceOf(user1), mintAmount - burnAmount);
        assertEq(euroToken.totalSupply(), mintAmount - burnAmount);
    }

    function test_BurnFrom_WithAllowance() public {
        uint256 mintAmount = 1000 * 10**6;
        uint256 approveAmount = 300 * 10**6;

        vm.prank(owner);
        euroToken.mint(user1, mintAmount);

        vm.prank(user1);
        euroToken.approve(owner, approveAmount);

        vm.prank(owner);
        euroToken.burnFrom(user1, approveAmount);

        assertEq(euroToken.balanceOf(user1), mintAmount - approveAmount);
        assertEq(euroToken.totalSupply(), mintAmount - approveAmount);
    }

    function test_Transfer_Successful() public {
        uint256 amount = 500 * 10**6;

        vm.prank(owner);
        euroToken.mint(user1, amount);

        vm.prank(user1);
        euroToken.transfer(user2, amount);

        assertEq(euroToken.balanceOf(user1), 0);
        assertEq(euroToken.balanceOf(user2), amount);
    }

    function test_TransferFrom_WithAllowance() public {
        uint256 amount = 500 * 10**6;

        vm.prank(owner);
        euroToken.mint(user1, amount);

        vm.prank(user1);
        euroToken.approve(user2, amount);

        vm.prank(user2);
        euroToken.transferFrom(user1, user2, amount);

        assertEq(euroToken.balanceOf(user1), 0);
        assertEq(euroToken.balanceOf(user2), amount);
    }

    function testFuzz_Mint_WithDifferentAmounts(uint256 amount) public {
        vm.assume(amount < type(uint256).max / 2);

        vm.prank(owner);
        euroToken.mint(user1, amount);

        assertEq(euroToken.balanceOf(user1), amount);
        assertEq(euroToken.totalSupply(), amount);
    }

    function testFuzz_Transfer_WithDifferentAmounts(uint256 amount) public {
        vm.assume(amount > 0 && amount < 10000 * 10**6);

        vm.prank(owner);
        euroToken.mint(user1, amount);

        vm.prank(user1);
        euroToken.transfer(user2, amount);

        assertEq(euroToken.balanceOf(user1), 0);
        assertEq(euroToken.balanceOf(user2), amount);
    }

    function test_TotalSupply_StartsAtZero() public {
        assertEq(euroToken.totalSupply(), 0);
    }
}
