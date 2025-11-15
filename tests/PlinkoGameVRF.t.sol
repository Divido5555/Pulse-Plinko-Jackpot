// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "../contracts/PlinkoGameVRF.sol";

// Mock contracts for testing
contract MockAnyrand {
    uint256 public nextRequestId = 1;
    mapping(uint256 => address) public requests;
    
    function requestRandomness(uint32, uint32) external payable returns (uint256) {
        uint256 requestId = nextRequestId++;
        requests[requestId] = msg.sender;
        return requestId;
    }
    
    function estimateFee(uint32) external pure returns (uint256) {
        return 0.001 ether;
    }
    
    // Helper to fulfill randomness (for testing)
    function fulfillRandomness(address game, uint256 requestId, uint256 randomValue) external {
        uint256[] memory randomWords = new uint256[](1);
        randomWords[0] = randomValue;
        PlinkoGameVRF(game).receiveRandomness(requestId, randomWords);
    }
}

contract MockFetchOracle {
    uint256 public mockPrice = 0.0001 * 1e6; // $0.0001 per PLS (scaled by 1e6)
    uint256 public mockTimestamp;
    
    constructor() {
        mockTimestamp = block.timestamp;
    }
    
    function getDataBefore(bytes32, uint256) external view returns (bytes memory, uint256) {
        return (abi.encode(mockPrice), mockTimestamp);
    }
    
    function setPrice(uint256 newPrice) external {
        mockPrice = newPrice;
        mockTimestamp = block.timestamp;
    }
}

contract PlinkoGameVRFTest is Test {
    PlinkoGameVRF public game;
    MockAnyrand public mockVRF;
    MockFetchOracle public mockOracle;
    
    address public owner = address(1);
    address public devWallet = address(2);
    address public hostWallet = address(3);
    address public burnWallet = address(4);
    address public treasuryWallet = address(5);
    address public player = address(6);
    
    function setUp() public {
        // Deploy mocks
        mockVRF = new MockAnyrand();
        mockOracle = new MockFetchOracle();
        
        // Deploy game contract
        vm.prank(owner);
        game = new PlinkoGameVRF(
            address(mockOracle),
            address(mockVRF),
            devWallet,
            hostWallet,
            burnWallet,
            treasuryWallet
        );
        
        // Fund player
        vm.deal(player, 100 ether);
    }
    
    function testDeployment() public view {
        assertEq(game.owner(), owner);
        assertEq(game.devWallet(), devWallet);
        assertEq(game.hostWallet(), hostWallet);
        assertEq(game.burnAddress(), burnWallet);
        assertEq(game.treasuryWallet(), treasuryWallet);
    }
    
    function testGetPLSPrice() public view {
        uint256 price = game.getPLSPrice();
        assertEq(price, 0.0001 * 1e6); // $0.0001
    }
    
    function testGetMinEntryPls() public view {
        uint256 minEntry = game.getMinEntryPls();
        // At $0.0001 per PLS, $1 = 10,000 PLS
        assertEq(minEntry, 10000 ether);
    }
    
    function testPlayStoresPendingRequest() public {
        uint32 gasLimit = 200000;
        uint256 minEntry = game.getMinEntryPls();
        uint256 vrfFee = mockVRF.estimateFee(gasLimit);
        uint256 totalRequired = minEntry + vrfFee;
        
        vm.prank(player);
        uint256 requestId = game.play{value: totalRequired}(gasLimit);
        
        assertEq(requestId, 1);
        
        (address storedPlayer, uint256 entryAmount, , bool fulfilled) = game.pendingPlays(requestId);
        assertEq(storedPlayer, player);
        assertEq(entryAmount, minEntry);
        assertFalse(fulfilled);
    }
    
    function testReceiveRandomnessResolvesPlay() public {
        // Setup play
        uint32 gasLimit = 200000;
        uint256 minEntry = game.getMinEntryPls();
        uint256 vrfFee = mockVRF.estimateFee(gasLimit);
        uint256 totalRequired = minEntry + vrfFee;
        
        vm.prank(player);
        uint256 requestId = game.play{value: totalRequired}(gasLimit);
        
        // Fulfill randomness to slot 12 (multiplier 110 = 1.1x)
        uint256 randomValue = 12;
        mockVRF.fulfillRandomness(address(game), requestId, randomValue);
        
        // Check fulfilled
        assertTrue(game.isPlayFulfilled(requestId));
        assertEq(game.playCount(), 1);
    }
    
    function testRegularPrizeSlot() public {
        uint32 gasLimit = 200000;
        uint256 minEntry = game.getMinEntryPls();
        uint256 vrfFee = mockVRF.estimateFee(gasLimit);
        
        vm.prank(player);
        uint256 requestId = game.play{value: minEntry + vrfFee}(gasLimit);
        
        uint256 playerBalanceBefore = player.balance;
        
        // Fulfill to slot 12 (multiplier 110 = 1.1x)
        mockVRF.fulfillRandomness(address(game), requestId, 12);
        
        uint256 expectedPayout = (minEntry * 110) / 100;
        assertEq(player.balance, playerBalanceBefore + expectedPayout);
    }
    
    function testLoserSlot() public {
        uint32 gasLimit = 200000;
        uint256 minEntry = game.getMinEntryPls();
        uint256 vrfFee = mockVRF.estimateFee(gasLimit);
        
        vm.prank(player);
        uint256 requestId = game.play{value: minEntry + vrfFee}(gasLimit);
        
        uint256 playerBalanceBefore = player.balance;
        
        // Fulfill to slot 0 (loser, multiplier 0)
        mockVRF.fulfillRandomness(address(game), requestId, 0);
        
        // No payout for loser
        assertEq(player.balance, playerBalanceBefore);
    }
    
    function testJackpotAccumulation() public {
        uint32 gasLimit = 200000;
        uint256 minEntry = game.getMinEntryPls();
        uint256 vrfFee = mockVRF.estimateFee(gasLimit);
        
        vm.prank(player);
        uint256 requestId = game.play{value: minEntry + vrfFee}(gasLimit);
        
        // Fulfill to non-jackpot slot
        mockVRF.fulfillRandomness(address(game), requestId, 12);
        
        // Check jackpot accumulation (50% to main, 15% to mini)
        (uint256 mainJackpot, uint256 miniJackpot, , , ) = game.getGameState();
        assertEq(mainJackpot, (minEntry * 50) / 100);
        assertEq(miniJackpot, (minEntry * 15) / 100);
    }
    
    function testHostPayoutAfter1000Plays() public {
        uint32 gasLimit = 200000;
        uint256 minEntry = game.getMinEntryPls();
        uint256 vrfFee = mockVRF.estimateFee(gasLimit);
        
        uint256 hostBalanceBefore = hostWallet.balance;
        
        // Play 1000 times
        for (uint256 i = 0; i < 1000; i++) {
            vm.prank(player);
            uint256 requestId = game.play{value: minEntry + vrfFee}(gasLimit);
            mockVRF.fulfillRandomness(address(game), requestId, 0); // loser slot
        }
        
        // Host should receive accumulated 5% from all plays
        uint256 expectedHostPay = (minEntry * 5 * 1000) / 100;
        assertEq(hostWallet.balance, hostBalanceBefore + expectedHostPay);
    }
    
    function testMainJackpotWin() public {
        uint32 gasLimit = 200000;
        uint256 minEntry = game.getMinEntryPls();
        uint256 vrfFee = mockVRF.estimateFee(gasLimit);
        
        // Build up jackpot first
        for (uint256 i = 0; i < 10; i++) {
            vm.prank(player);
            uint256 requestId = game.play{value: minEntry + vrfFee}(gasLimit);
            mockVRF.fulfillRandomness(address(game), requestId, 0);
        }
        
        (uint256 jackpotBefore, , , , ) = game.getGameState();
        assertGt(jackpotBefore, 0);
        
        uint256 playerBalanceBefore = player.balance;
        
        // Win main jackpot (slot 10, with lucky randomness divisible by 1200000)
        vm.prank(player);
        uint256 requestId = game.play{value: minEntry + vrfFee}(gasLimit);
        mockVRF.fulfillRandomness(address(game), requestId, 10 + (1200000 * 20)); // slot 10, jackpot win
        
        // Player should receive 60% of jackpot
        uint256 expectedWin = (jackpotBefore * 60) / 100;
        assertEq(player.balance, playerBalanceBefore + expectedWin);
        
        // Jackpot should reset to 10%
        (uint256 jackpotAfter, , , , ) = game.getGameState();
        assertEq(jackpotAfter, (jackpotBefore * 10) / 100);
    }
    
    function testEmergencyWithdraw() public {
        // Send some funds to contract
        vm.deal(address(game), 10 ether);
        
        uint256 ownerBalanceBefore = owner.balance;
        
        vm.prank(owner);
        game.emergencyWithdraw();
        
        assertEq(owner.balance, ownerBalanceBefore + 10 ether);
        assertEq(address(game).balance, 0);
    }
    
    function testCannotPlayWithInsufficientFunds() public {
        uint32 gasLimit = 200000;
        
        vm.prank(player);
        vm.expectRevert("Insufficient payment");
        game.play{value: 0.1 ether}(gasLimit);
    }
    
    function testOnlyVRFCanFulfill() public {
        vm.expectRevert("Only VRF can fulfill");
        uint256[] memory randomWords = new uint256[](1);
        randomWords[0] = 5;
        game.receiveRandomness(1, randomWords);
    }
}
