// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * ⚠️  DEPRECATED — DO NOT USE ⚠️
 * 
 * This contract is obsolete and has been replaced by PlinkoGame369.sol
 * 
 * Issues with this contract:
 * - Uses native PLS (replaced by PLS369 token model)
 * - Has host wallet + donation wallet (removed in new model)
 * - Pseudo-randomness (replaced by Fetch Oracle RNG)
 * - Old tokenomics (replaced by DAO-governed model)
 * 
 * See contracts/PlinkoGame369.sol for the active version.
 * 
 * @title PlinkoGame
 * @dev Decentralized Plinko game for PulseChain ecosystem
 * Entry: $1 worth of PLS
 * 20 slots: 5 prizes, 15 losers
 * Jackpots: Main ($1M target) and Mini ($10k target)
 */
contract PlinkoGame {
    address public owner;
    address public devWallet;
    address public hostWallet;
    address public burnAddress;
    
    uint256 public constant ENTRY_FEE = 1 ether; // Adjust based on PLS price
    uint256 public mainJackpot;
    uint256 public miniJackpot;
    uint256 public hostAccumulated;
    uint256 public playCount;
    
    // Prize multipliers (scaled by 100, e.g., 110 = 1.1x)
    uint256[] public multipliers = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 110, 150, 200, 300, 500, 0, 0, 0];
    
    event GamePlayed(address indexed player, uint256 slot, uint256 payout, bool isJackpot);
    event MainJackpotWon(address indexed winner, uint256 amount);
    event MiniJackpotWon(address indexed winner, uint256 amount);
    event HostPaid(address indexed host, uint256 amount);
    
    constructor(
        address _devWallet,
        address _hostWallet,
        address _burnAddress
    ) {
        owner = msg.sender;
        devWallet = _devWallet;
        hostWallet = _hostWallet;
        burnAddress = _burnAddress;
    }
    
    /**
     * @dev Play Plinko game
     * Player sends ENTRY_FEE, gets random slot result
     */
    function play() external payable {
        require(msg.value == ENTRY_FEE, "Incorrect entry fee");
        
        playCount++;
        
        // Distribute entry fee
        uint256 basePrizePool = (msg.value * 32) / 100; // 32%
        uint256 mainJackpotAdd = (msg.value * 50) / 100; // 50%
        uint256 miniJackpotAdd = (msg.value * 15) / 100; // 15%
        uint256 hostFee = (msg.value * 5) / 100; // 5% (paid every 1000 plays)
        
        mainJackpot += mainJackpotAdd;
        miniJackpot += miniJackpotAdd;
        hostAccumulated += hostFee;
        
        // Get random slot (0-19)
        uint256 slot = _getRandomSlot();
        uint256 payout = 0;
        bool isJackpot = false;
        
        // Check for jackpots (special slots)
        if (slot == 10 && _checkJackpotWin(1200000)) { // 1 in 1.2M for main
            payout = _payMainJackpot(msg.sender);
            isJackpot = true;
            emit MainJackpotWon(msg.sender, payout);
        } else if (slot == 16 && _checkJackpotWin(53000)) { // 1 in 53k for mini
            payout = _payMiniJackpot(msg.sender);
            isJackpot = true;
            emit MiniJackpotWon(msg.sender, payout);
        } else if (multipliers[slot] > 0) {
            // Regular prize
            payout = (ENTRY_FEE * multipliers[slot]) / 100;
            payable(msg.sender).transfer(payout);
        }
        
        // Pay host every 1000 plays
        if (playCount % 1000 == 0 && hostAccumulated > 0) {
            uint256 hostPay = hostAccumulated;
            hostAccumulated = 0;
            payable(hostWallet).transfer(hostPay);
            emit HostPaid(hostWallet, hostPay);
        }
        
        emit GamePlayed(msg.sender, slot, payout, isJackpot);
    }
    
    /**
     * @dev Generate pseudo-random slot (0-19)
     * Note: Not cryptographically secure, use Chainlink VRF in production
     */
    function _getRandomSlot() private view returns (uint256) {
        return uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            msg.sender,
            playCount
        ))) % 20;
    }
    
    /**
     * @dev Check if jackpot wins based on odds
     * @param odds 1 in X chance (e.g., 1200000 for 1 in 1.2M)
     */
    function _checkJackpotWin(uint256 odds) private view returns (bool) {
        uint256 random = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            msg.sender,
            playCount,
            "jackpot"
        )));
        return (random % odds) == 0;
    }
    
    /**
     * @dev Pay main jackpot: 60% winner, 10% burn, 10% host, 10% dev, 10% reset
     */
    function _payMainJackpot(address winner) private returns (uint256) {
        uint256 total = mainJackpot;
        uint256 winnerAmount = (total * 60) / 100;
        uint256 burnAmount = (total * 10) / 100;
        uint256 hostAmount = (total * 10) / 100;
        uint256 devAmount = (total * 10) / 100;
        uint256 resetAmount = (total * 10) / 100;
        
        mainJackpot = resetAmount;
        
        payable(winner).transfer(winnerAmount);
        payable(burnAddress).transfer(burnAmount);
        payable(hostWallet).transfer(hostAmount);
        payable(devWallet).transfer(devAmount);
        
        return winnerAmount;
    }
    
    /**
     * @dev Pay mini jackpot: 80% winner, 10% host, 10% reset
     */
    function _payMiniJackpot(address winner) private returns (uint256) {
        uint256 total = miniJackpot;
        uint256 winnerAmount = (total * 80) / 100;
        uint256 hostAmount = (total * 10) / 100;
        uint256 resetAmount = (total * 10) / 100;
        
        miniJackpot = resetAmount;
        
        payable(winner).transfer(winnerAmount);
        payable(hostWallet).transfer(hostAmount);
        
        return winnerAmount;
    }
    
    /**
     * @dev Get current game state
     */
    function getGameState() external view returns (
        uint256 _mainJackpot,
        uint256 _miniJackpot,
        uint256 _playCount,
        uint256 _hostAccumulated
    ) {
        return (mainJackpot, miniJackpot, playCount, hostAccumulated);
    }
    
    /**
     * @dev Update entry fee (owner only)
     */
    function updateEntryFee(uint256 newFee) external {
        require(msg.sender == owner, "Only owner");
        // Implementation for dynamic fee
    }
    
    /**
     * @dev Emergency withdraw (owner only)
     */
    function emergencyWithdraw() external {
        require(msg.sender == owner, "Only owner");
        payable(owner).transfer(address(this).balance);
    }
    
    receive() external payable {}
}