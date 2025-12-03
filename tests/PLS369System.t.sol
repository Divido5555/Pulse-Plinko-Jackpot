// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/Pulse369ToknenMnv1.sol";
import "../contracts/PlinkoGame369mnV1.sol";

contract PLS369SystemTest is Test {
    PLS369Token public token;
    PlinkoGame369 public game;
    
    address public owner = address(1);
    address public daoTreasury = address(2);
    address public devWallet = address(3);
    address public player = address(4);
    
    uint256 constant ENTRY_PRICE = 10 * 1e18;
    
    function setUp() public {
        // Deploy token
        vm.prank(owner);
        token = new PLS369Token();
        
        // Deploy game (4 parameters, no oracle - uses on-chain randomness)
        vm.prank(owner);
        game = new PlinkoGame369(
            address(token),
            owner,
            daoTreasury,
            devWallet
        );
        
        // Setup: Transfer tokens to player for testing
        vm.prank(owner);
        token.transfer(player, 1000 * ENTRY_PRICE);
        
        // Seed game with tokens for jackpots
        vm.prank(owner);
        token.transfer(address(game), 100000 * 1e18);
        
        vm.prank(owner);
        game.seedJackpots(50000 * 1e18, 20000 * 1e18);
    }
    
    function testTokenDeployment() public view {
        assertEq(token.name(), "PLS369 DAO");
        assertEq(token.symbol(), "PLS369");
        assertEq(token.decimals(), 18);
        assertEq(token.totalSupply(), 369_000_000 * 1e18);
    }
    
    function testGameDeployment() public view {
        assertEq(game.owner(), owner);
        assertEq(address(game.pls369()), address(token));
        assertEq(game.daoTreasury(), daoTreasury);
        assertEq(game.devWallet(), devWallet);
        assertEq(game.ENTRY_PRICE(), ENTRY_PRICE);
    }
    
    function testJackpotSeeding() public view {
        assertEq(game.mainJackpot(), 50000 * 1e18);
        assertEq(game.miniJackpot(), 20000 * 1e18);
    }
    
    function testPlayRequiresApproval() public {
        vm.prank(player);
        vm.expectRevert();
        game.play();
    }
    
    function testPlaySuccess() public {
        // Approve game to spend tokens
        vm.prank(player);
        token.approve(address(game), ENTRY_PRICE);
        
        uint256 playerBalBefore = token.balanceOf(player);
        
        // Play game
        vm.prank(player);
        game.play();
        
        // Check play count increased
        assertEq(game.playCount(), 1);
        
        // Check tokens were transferred
        uint256 playerBalAfter = token.balanceOf(player);
        assertEq(playerBalBefore - playerBalAfter, ENTRY_PRICE);
    }
    
    function testPlayDistribution() public {
        vm.prank(player);
        token.approve(address(game), ENTRY_PRICE);
        
        uint256 mainBefore = game.mainJackpot();
        uint256 miniBefore = game.miniJackpot();
        
        vm.prank(player);
        game.play();
        
        // Check distributions (PlinkoGame369mnV1 uses 40/10/4/3 split)
        uint256 mainAfter = game.mainJackpot();
        uint256 miniAfter = game.miniJackpot();
        
        assertEq(mainAfter - mainBefore, (ENTRY_PRICE * 40) / 100);
        assertEq(miniAfter - miniBefore, (ENTRY_PRICE * 10) / 100);
        
        (,,,uint256 daoAccrued, uint256 devAccrued,,) = game.getGameState();
        assertEq(daoAccrued, (ENTRY_PRICE * 4) / 100);
        assertEq(devAccrued, (ENTRY_PRICE * 3) / 100);
    }
    
    function testDaoRewardsClaim() public {
        // Play to accrue DAO rewards
        vm.prank(player);
        token.approve(address(game), ENTRY_PRICE * 10);
        
        for (uint i = 0; i < 10; i++) {
            vm.prank(player);
            game.play();
        }
        
        (,,,uint256 daoAccrued,,,) = game.getGameState();
        assertGt(daoAccrued, 0);
        
        uint256 treasuryBefore = token.balanceOf(daoTreasury);
        
        // Claim as DAO treasury
        vm.prank(daoTreasury);
        game.claimDaoRewards();
        
        uint256 treasuryAfter = token.balanceOf(daoTreasury);
        assertEq(treasuryAfter - treasuryBefore, daoAccrued);
        
        // Check accrued is reset
        (,,,uint256 daoAccruedAfter,,,) = game.getGameState();
        assertEq(daoAccruedAfter, 0);
    }
    
    function testDevRewardsClaim() public {
        // Play to accrue dev rewards
        vm.prank(player);
        token.approve(address(game), ENTRY_PRICE * 10);
        
        for (uint i = 0; i < 10; i++) {
            vm.prank(player);
            game.play();
        }
        
        (,,,,uint256 devAccrued,,) = game.getGameState();
        assertGt(devAccrued, 0);
        
        uint256 devBefore = token.balanceOf(devWallet);
        
        // Claim as dev
        vm.prank(devWallet);
        game.claimDevRewards();
        
        uint256 devAfter = token.balanceOf(devWallet);
        assertEq(devAfter - devBefore, devAccrued);
    }
    
    function testOnlyOwnerCanSeedJackpots() public {
        vm.prank(player);
        vm.expectRevert("Only owner");
        game.seedJackpots(1000, 1000);
    }
    
    function testOwnershipTransfer() public {
        address newOwner = address(5);
        
        vm.prank(owner);
        game.transferOwnership(newOwner);
        
        assertEq(game.owner(), newOwner);
    }
}
