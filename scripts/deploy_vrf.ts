import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("Deploying PlinkoGameVRF...");

  // Load environment variables
  const FETCH_ORACLE_ADDRESS = process.env.FETCH_ORACLE_ADDRESS;
  const ANYRAND_ADDRESS = process.env.ANYRAND_ADDRESS;
  const DEV_WALLET = process.env.DEV_WALLET;
  const HOST_WALLET = process.env.HOST_WALLET;
  const BURN_WALLET = process.env.BURN_WALLET;
  const TREASURY_WALLET = process.env.TREASURY_WALLET;

  // Validate required env vars
  if (!FETCH_ORACLE_ADDRESS || !ANYRAND_ADDRESS || !DEV_WALLET || 
      !HOST_WALLET || !BURN_WALLET || !TREASURY_WALLET) {
    throw new Error("Missing required environment variables. Please check your .env file.");
  }

  console.log("Configuration:");
  console.log("- Fetch Oracle:", FETCH_ORACLE_ADDRESS);
  console.log("- Anyrand VRF:", ANYRAND_ADDRESS);
  console.log("- Dev Wallet:", DEV_WALLET);
  console.log("- Host Wallet:", HOST_WALLET);
  console.log("- Burn Wallet:", BURN_WALLET);
  console.log("- Treasury Wallet:", TREASURY_WALLET);

  // Get deployer
  const [deployer] = await ethers.getSigners();
  console.log("\nDeploying with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "PLS");

  // Deploy contract
  const PlinkoGameVRF = await ethers.getContractFactory("PlinkoGameVRF");
  const plinkoVRF = await PlinkoGameVRF.deploy(
    FETCH_ORACLE_ADDRESS,
    ANYRAND_ADDRESS,
    DEV_WALLET,
    HOST_WALLET,
    BURN_WALLET,
    TREASURY_WALLET
  );

  await plinkoVRF.waitForDeployment();
  const address = await plinkoVRF.getAddress();

  console.log("\n✅ PlinkoGameVRF deployed to:", address);
  console.log("\nDeployment Summary:");
  console.log("===================");
  console.log("Contract Address:", address);
  console.log("Network:", (await ethers.provider.getNetwork()).name);
  console.log("Chain ID:", (await ethers.provider.getNetwork()).chainId);
  console.log("\nNext steps:");
  console.log("1. Verify contract on block explorer");
  console.log("2. Update frontend .env with REACT_APP_PLINKO_VRF_ADDRESS=" + address);
  console.log("3. Test contract with small play amount");
  console.log("4. Update PULSE369_VRF_CHECKLIST.md with deployment details");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
