// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/PLS369Token.sol";
import "../contracts/PlinkoGame369.sol";

contract DeployPLS369System is Script {
    function run() external {
        // Load environment variables
        address fetchOracle = vm.envAddress("FETCH_ORACLE_ADDRESS");
        address owner = vm.envOr("OWNER_ADDRESS", msg.sender);
        address daoTreasury = vm.envAddress("DAO_TREASURY");
        address devWallet = vm.envAddress("DEV_WALLET");
        
        console.log("========================================");
        console.log("Deploying PLS369 DAO Eternal Plinko System");
        console.log("========================================\n");
        
        console.log("Deployer:", msg.sender);
        console.log("Fetch Oracle:", fetchOracle);
        console.log("Owner:", owner);
        console.log("DAO Treasury:", daoTreasury);
        console.log("Dev Wallet:", devWallet);
        console.log("");
        
        vm.startBroadcast();
        
        // Deploy PLS369Token
        console.log("Deploying PLS369Token...");
        PLS369Token token = new PLS369Token();
        console.log("PLS369Token deployed to:", address(token));
        console.log("Total Supply:", token.totalSupply() / 1e18, "PLS369\n");
        
        // Deploy PlinkoGame369
        console.log("Deploying PlinkoGame369...");
        PlinkoGame369 game = new PlinkoGame369(
            address(token),
            fetchOracle,
            owner,
            daoTreasury,
            devWallet
        );
        console.log("PlinkoGame369 deployed to:", address(game));
        
        vm.stopBroadcast();
        
        console.log("\n========================================");
        console.log("DEPLOYMENT COMPLETE");
        console.log("========================================");
        console.log("\nContract Addresses:");
        console.log("  PLS369Token:   ", address(token));
        console.log("  PlinkoGame369: ", address(game));
        
        console.log("\nGame Configuration:");
        console.log("  Entry Price:", game.ENTRY_PRICE() / 1e18, "PLS369");
        console.log("  Main Jackpot Odds: 1 in", game.MAIN_JACKPOT_ODDS());
        console.log("  Mini Jackpot Odds: 1 in", game.MINI_JACKPOT_ODDS());
        
        console.log("\nNext Steps:");
        console.log("1. Transfer tokens to game for seeding");
        console.log("2. Call game.seedJackpots(mainAmount, miniAmount)");
        console.log("3. Call game.topUpRandomness(1000) for initial plays");
        console.log("4. Update frontend with contract addresses");
    }
}
