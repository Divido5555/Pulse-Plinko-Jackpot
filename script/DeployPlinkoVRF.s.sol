// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import "../contracts/PlinkoGameVRF.sol";

contract DeployPlinkoVRF is Script {
    function run() external {
        // Load environment variables
        address fetchOracle = vm.envAddress("FETCH_ORACLE_ADDRESS");
        address anyrandVRF = vm.envAddress("ANYRAND_ADDRESS");
        address devWallet = vm.envAddress("DEV_WALLET");
        address hostWallet = vm.envAddress("HOST_WALLET");
        address burnWallet = vm.envAddress("BURN_WALLET");
        address treasuryWallet = vm.envAddress("TREASURY_WALLET");
        
        console.log("Deploying PlinkoGameVRF...");
        console.log("Fetch Oracle:", fetchOracle);
        console.log("Anyrand VRF:", anyrandVRF);
        console.log("Dev Wallet:", devWallet);
        console.log("Host Wallet:", hostWallet);
        console.log("Burn Wallet:", burnWallet);
        console.log("Treasury Wallet:", treasuryWallet);
        
        vm.startBroadcast();
        
        PlinkoGameVRF plinkoVRF = new PlinkoGameVRF(
            fetchOracle,
            anyrandVRF,
            devWallet,
            hostWallet,
            burnWallet,
            treasuryWallet
        );
        
        vm.stopBroadcast();
        
        console.log("\n=== Deployment Summary ===");
        console.log("PlinkoGameVRF deployed to:", address(plinkoVRF));
        console.log("\nNext steps:");
        console.log("1. Verify contract on block explorer");
        console.log("2. Update frontend .env with deployed address");
        console.log("3. Test contract functionality");
    }
}
