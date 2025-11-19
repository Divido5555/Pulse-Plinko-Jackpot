import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("🚀 Deploying PLS369 DAO Eternal Plinko System...\n");

  // Get deployer
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "PLS\n");

  // ===== STEP 1: Deploy PLS369Token =====
  console.log("📦 Step 1: Deploying PLS369Token...");
  const PLS369Token = await ethers.getContractFactory("PLS369Token");
  const pls369Token = await PLS369Token.deploy();
  await pls369Token.waitForDeployment();
  const tokenAddress = await pls369Token.getAddress();
  console.log("✅ PLS369Token deployed to:", tokenAddress);
  
  const totalSupply = await pls369Token.totalSupply();
  console.log("   Total Supply:", ethers.formatEther(totalSupply), "PLS369");
  console.log("   Minted to:", deployer.address, "\n");

  // ===== STEP 2: Load Game Contract Parameters =====
  console.log("📦 Step 2: Loading PlinkoGame369 parameters...");
  
  const FETCH_ORACLE_ADDRESS = process.env.FETCH_ORACLE_ADDRESS;
  const OWNER_ADDRESS = process.env.OWNER_ADDRESS || deployer.address;
  const DAO_TREASURY = process.env.DAO_TREASURY;
  const DEV_WALLET = process.env.DEV_WALLET;

  if (!FETCH_ORACLE_ADDRESS) {
    throw new Error("❌ FETCH_ORACLE_ADDRESS not set in .env");
  }
  if (!DAO_TREASURY) {
    throw new Error("❌ DAO_TREASURY not set in .env");
  }
  if (!DEV_WALLET) {
    throw new Error("❌ DEV_WALLET not set in .env");
  }

  console.log("Configuration:");
  console.log("   Token:", tokenAddress);
  console.log("   Fetch Oracle:", FETCH_ORACLE_ADDRESS);
  console.log("   Owner:", OWNER_ADDRESS);
  console.log("   DAO Treasury:", DAO_TREASURY);
  console.log("   Dev Wallet:", DEV_WALLET, "\n");

  // ===== STEP 3: Deploy PlinkoGame369 =====
  console.log("📦 Step 3: Deploying PlinkoGame369...");
  const PlinkoGame369 = await ethers.getContractFactory("PlinkoGame369");
  const plinkoGame = await PlinkoGame369.deploy(
    tokenAddress,
    FETCH_ORACLE_ADDRESS,
    OWNER_ADDRESS,
    DAO_TREASURY,
    DEV_WALLET
  );
  await plinkoGame.waitForDeployment();
  const gameAddress = await plinkoGame.getAddress();
  console.log("✅ PlinkoGame369 deployed to:", gameAddress, "\n");

  // ===== STEP 4: Summary =====
  console.log("=" .repeat(60));
  console.log("🎉 DEPLOYMENT COMPLETE");
  console.log("=" .repeat(60));
  console.log("\n📋 Contract Addresses:");
  console.log("   PLS369Token:    ", tokenAddress);
  console.log("   PlinkoGame369:  ", gameAddress);
  
  console.log("\n📊 Game Configuration:");
  const entryPrice = await plinkoGame.ENTRY_PRICE();
  console.log("   Entry Price:    ", ethers.formatEther(entryPrice), "PLS369");
  console.log("   Main Jackpot Odds: 1 in", (await plinkoGame.MAIN_JACKPOT_ODDS()).toString());
  console.log("   Mini Jackpot Odds: 1 in", (await plinkoGame.MINI_JACKPOT_ODDS()).toString());

  console.log("\n🎯 Next Steps:");
  console.log("1. Transfer PLS369 tokens to game for seeding:");
  console.log("   pls369Token.transfer(gameAddress, amount)");
  console.log("");
  console.log("2. Seed jackpots (as owner):");
  console.log("   plinkoGame.seedJackpots(mainAmount, miniAmount)");
  console.log("");
  console.log("3. Top up randomness (as owner):");
  console.log("   plinkoGame.topUpRandomness(1000)  // 1000 plays worth");
  console.log("");
  console.log("4. Distribute tokens to:");
  console.log("   - Liquidity Pool (for PLS/PLS369 pair)");
  console.log("   - Community distribution");
  console.log("   - Team vesting");
  console.log("");
  console.log("5. Update frontend .env:");
  console.log(`   REACT_APP_PLS369_TOKEN=${tokenAddress}`);
  console.log(`   REACT_APP_PLINKO369_GAME=${gameAddress}`);
  console.log("");
  console.log("6. Players need to:");
  console.log("   a. Get PLS369 tokens (buy from LP or receive from DAO)");
  console.log("   b. Approve game contract: pls369.approve(gameAddress, amount)");
  console.log("   c. Play: plinkoGame.play()");
  
  console.log("\n" + "=" .repeat(60));
  console.log("💾 Save these addresses to your .env and documentation!");
  console.log("=" .repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
