// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/PLS369Token.sol";
import "../contracts/PlinkoGame369.sol";

// Mock Fetch Oracle
contract MockFetchOracle {
    uint256 public mockRandomness = 123456789;
    uint256 public mockTimestamp;
    
    constructor() {
        mockTimestamp = block.timestamp;
    }
    
    function getDataBefore(bytes32, uint256) external view returns (bytes memory, uint256) {
        return (abi.encode(mockRandomness), mockTimestamp);
    }
    
    function setRandomness(uint256 newValue) external {
        mockRandomness = newValue;
        mockTimestamp = block.timestamp;
    }
}

contract PLS369SystemTest is Test {
    PLS369Token public token;
    PlinkoGame369 public game;
    MockFetchOracle public mockOracle;
    
    address public owner = address(1);
    address public daoTreasury = address(2);
    address public devWallet = address(3);
    address public player = address(4);
    
    uint256 constant ENTRY_PRICE = 10 * 1e18;
    
    function setUp() public {
        // Deploy token
        vm.prank(owner);
        token = new PLS369Token();
        
        // Deploy mock oracle
        mockOracle = new MockFetchOracle();
        
        // Deploy game
        vm.prank(owner);
        game = new PlinkoGame369(
            address(token),
            address(mockOracle),
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
        
        // Top up randomness
        vm.prank(owner);
        game.topUpRandomness(100);
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
    
    function testRandomnessTopUp() public {
        (uint256 poolSize, uint256 index) = game.getRandomPoolSize();
        assertEq(poolSize, 100);
        assertEq(index, 0);
        
        vm.prank(owner);
        game.topUpRandomness(50);
        
        (poolSize, ) = game.getRandomPoolSize();
        assertEq(poolSize, 150);
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
        
        // Check distributions
        uint256 mainAfter = game.mainJackpot();
        uint256 miniAfter = game.miniJackpot();
        
        assertEq(mainAfter - mainBefore, (ENTRY_PRICE * 50) / 100);
        assertEq(miniAfter - miniBefore, (ENTRY_PRICE * 15) / 100);
        
        (,,,uint256 daoAccrued, uint256 devAccrued,) = game.getGameState();
        assertEq(daoAccrued, (ENTRY_PRICE * 25) / 100);
        assertEq(devAccrued, (ENTRY_PRICE * 10) / 100);
    }
    
    function testPrizeSlotPayout() public {
        // Set randomness to land on slot 3 (3x multiplier = 300)
        mockOracle.setRandomness(3);
        
        // Top up new randomness
        vm.prank(owner);
        game.topUpRandomness(1);
        
        vm.prank(player);
        token.approve(address(game), ENTRY_PRICE);
        
        uint256 playerBalBefore = token.balanceOf(player);
        
        vm.prank(player);
        game.play();
        
        uint256 playerBalAfter = token.balanceOf(player);
        
        // Player should receive 3x payout (minus entry cost)
        uint256 expectedPayout = (ENTRY_PRICE * 300) / 100;
        assertEq(playerBalAfter, playerBalBefore - ENTRY_PRICE + expectedPayout);
    }
    
    function testLoserSlot() public {
        // Set randomness to land on slot 0 (loser)
        mockOracle.setRandomness(0);
        
        vm.prank(owner);
        game.topUpRandomness(1);
        
        vm.prank(player);
        token.approve(address(game), ENTRY_PRICE);
        
        uint256 playerBalBefore = token.balanceOf(player);
        
        vm.prank(player);
        game.play();
        
        uint256 playerBalAfter = token.balanceOf(player);
        
        // Player loses entry, gets nothing back
        assertEq(playerBalBefore - playerBalAfter, ENTRY_PRICE);
    }
    
    function testDaoRewardsClaim() public {
        // Play to accrue DAO rewards
        vm.prank(player);
        token.approve(address(game), ENTRY_PRICE * 10);
        
        for (uint i = 0; i < 10; i++) {
            vm.prank(player);
            game.play();
        }
        
        (,,,uint256 daoAccrued,,) = game.getGameState();
        assertGt(daoAccrued, 0);
        
        uint256 treasuryBefore = token.balanceOf(daoTreasury);
        
        // Claim as DAO treasury
        vm.prank(daoTreasury);
        game.claimDaoRewards();
        
        uint256 treasuryAfter = token.balanceOf(daoTreasury);
        assertEq(treasuryAfter - treasuryBefore, daoAccrued);
        
        // Check accrued is reset
        (,,,uint256 daoAccruedAfter,,) = game.getGameState();
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
        
        (,,,,uint256 devAccrued,) = game.getGameState();
        assertGt(devAccrued, 0);
        
        uint256 devBefore = token.balanceOf(devWallet);
        
        // Claim as dev
        vm.prank(devWallet);
        game.claimDevRewards();
        
        uint256 devAfter = token.balanceOf(devWallet);
        assertEq(devAfter - devBefore, devAccrued);
    }
    
    function testMainJackpotWin() public {
        // Set randomness to slot 10 with winning odds
        // randomness % 20 = 10, and randomness % MAIN_JACKPOT_ODDS = 0
        uint256 winningRandom = 10 + (game.MAIN_JACKPOT_ODDS() * 20);
        mockOracle.setRandomness(winningRandom);
        
        vm.prank(owner);
        game.topUpRandomness(1);
        
        uint256 jackpotBefore = game.mainJackpot();
        uint256 playerBalBefore = token.balanceOf(player);
        uint256 daoBalBefore = token.balanceOf(daoTreasury);
        
        vm.prank(player);
        token.approve(address(game), ENTRY_PRICE);
        
        vm.prank(player);
        game.play();
        
        // Player should receive 60% of jackpot
        uint256 expectedWin = (jackpotBefore * 60) / 100;
        uint256 playerBalAfter = token.balanceOf(player);
        assertEq(playerBalAfter, playerBalBefore - ENTRY_PRICE + expectedWin);
        
        // DAO should receive 30%
        uint256 expectedDao = (jackpotBefore * 30) / 100;
        uint256 daoBalAfter = token.balanceOf(daoTreasury);
        assertEq(daoBalAfter - daoBalBefore, expectedDao);
        
        // Jackpot should reset to 10%
        uint256 expectedReset = (jackpotBefore * 10) / 100;
        uint256 jackpotAfter = game.mainJackpot();
        // Add the new contribution from this play
        uint256 newContribution = (ENTRY_PRICE * 50) / 100;
        assertEq(jackpotAfter, expectedReset + newContribution);
    }
    
    function testMiniJackpotWin() public {
        // Set randomness to slot 16 with winning odds
        uint256 winningRandom = 16 + (game.MINI_JACKPOT_ODDS() * 20);
        mockOracle.setRandomness(winningRandom);
        
        vm.prank(owner);
        game.topUpRandomness(1);
        
        uint256 jackpotBefore = game.miniJackpot();
        uint256 playerBalBefore = token.balanceOf(player);
        uint256 devBalBefore = token.balanceOf(devWallet);
        
        vm.prank(player);
        token.approve(address(game), ENTRY_PRICE);
        
        vm.prank(player);
        game.play();
        
        // Player should receive 75% of jackpot
        uint256 expectedWin = (jackpotBefore * 75) / 100;
        uint256 playerBalAfter = token.balanceOf(player);
        assertEq(playerBalAfter, playerBalBefore - ENTRY_PRICE + expectedWin);
        
        // Dev should receive 10%
        uint256 expectedDev = (jackpotBefore * 10) / 100;
        uint256 devBalAfter = token.balanceOf(devWallet);
        assertEq(devBalAfter - devBalBefore, expectedDev);
        
        // Jackpot should reset to 15%
        uint256 jackpotAfter = game.miniJackpot();
        uint256 expectedReset = (jackpotBefore * 15) / 100;
        uint256 newContribution = (ENTRY_PRICE * 15) / 100;
        assertEq(jackpotAfter, expectedReset + newContribution);
    }
    
    function testCannotPlayWithoutRandomness() public {
        // Deplete all randomness
        vm.prank(player);
        token.approve(address(game), ENTRY_PRICE * 200);
        
        for (uint i = 0; i < 100; i++) {
            vm.prank(player);
            game.play();
        }
        
        // Next play should fail
        vm.prank(player);
        vm.expectRevert("Randomness empty");
        game.play();
    }
    
    function testOnlyOwnerCanSeedJackpots() public {
        vm.prank(player);
        vm.expectRevert("Only owner");
        game.seedJackpots(1000, 1000);
    }
    
    function testOnlyOwnerCanTopUpRandomness() public {
        vm.prank(player);
        vm.expectRevert("Only owner");
        game.topUpRandomness(10);
    }
    
    function testOwnershipTransfer() public {
        address newOwner = address(5);
        
        vm.prank(owner);
        game.transferOwnership(newOwner);
        
        assertEq(game.owner(), newOwner);
    }
}
