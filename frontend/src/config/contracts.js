/**
 * Smart Contract Configuration for PlinkoGameVRF
 * 
 * This file contains the contract ABI and address for the VRF-powered Plinko game.
 * Update REACT_APP_PLINKO_VRF_ADDRESS in .env after deployment.
 */

// PlinkoGameVRF ABI (essential functions only)
export const PLINKO_VRF_ABI = [
  // Read functions
  "function getGameState() external view returns (uint256 mainJackpot, uint256 miniJackpot, uint256 playCount, uint256 hostAccumulated, uint256 minEntryPls)",
  "function getCurrentEntryRequirements(uint32 callbackGasLimit) external view returns (uint256 minEntryPls, uint256 vrfFee, uint256 totalRequired)",
  "function getPLSPrice() public view returns (uint256)",
  "function getMinEntryPls() public view returns (uint256)",
  "function isPlayFulfilled(uint256 requestId) external view returns (bool)",
  "function hostWallet() external view returns (address)",
  "function hostAccumulated() external view returns (uint256)",
  "function mainJackpot() external view returns (uint256)",
  "function miniJackpot() external view returns (uint256)",
  "function playCount() external view returns (uint256)",
  "function multipliers(uint256 index) external view returns (uint256)",
  
  // Write functions
  "function play(uint32 callbackGasLimit) external payable returns (uint256 requestId)",
  
  // Events
  "event PlayRequested(address indexed player, uint256 indexed requestId, uint256 entryAmount, uint256 vrfFee)",
  "event PlayResolved(address indexed player, uint256 indexed requestId, uint256 slot, uint256 payout, bool isJackpot)",
  "event MainJackpotWon(address indexed winner, uint256 amount, uint256 slot)",
  "event MiniJackpotWon(address indexed winner, uint256 amount, uint256 slot)",
  "event HostPaid(address indexed host, uint256 amount)"
];

// Contract address (set in .env)
export const PLINKO_VRF_ADDRESS = process.env.REACT_APP_PLINKO_VRF_ADDRESS || "";

// VRF Configuration
export const VRF_CONFIG = {
  callbackGasLimit: 300000, // Gas limit for VRF callback
  maxWaitTime: 60000, // Max wait time for VRF fulfillment (ms)
  pollInterval: 2000, // Poll interval for checking fulfillment (ms)
};

// Validate configuration
export function validateConfig() {
  if (!PLINKO_VRF_ADDRESS) {
    console.warn("⚠️ REACT_APP_PLINKO_VRF_ADDRESS not set in .env");
    return false;
  }
  return true;
}
