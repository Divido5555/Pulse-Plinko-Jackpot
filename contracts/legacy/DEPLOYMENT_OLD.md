# Smart Contract Deployment Guide

This guide will help you deploy the PlinkoGame smart contract to PulseChain 369.

## Prerequisites

- MetaMask or compatible wallet
- PLS tokens for gas fees
- Access to Remix IDE or Hardhat

## Method 1: Deploy with Remix IDE (Easiest)

### Step 1: Setup Remix
1. Go to https://remix.ethereum.org
2. Create a new file: `PlinkoGame.sol`
3. Copy the contract code from `/contracts/PlinkoGame.sol`
4. Paste into Remix

### Step 2: Compile
1. Go to "Solidity Compiler" tab
2. Select compiler version: `0.8.0` or higher
3. Click "Compile PlinkoGame.sol"
4. Ensure no errors appear

### Step 3: Configure MetaMask for PulseChain
Add PulseChain 369 to MetaMask:
- Network Name: PulseChain
- RPC URL: https://rpc.pulsechain.com
- Chain ID: 369
- Currency Symbol: PLS
- Block Explorer: https://scan.pulsechain.com

### Step 4: Deploy
1. Go to "Deploy & Run Transactions" tab
2. Select "Injected Provider - MetaMask"
3. Ensure MetaMask is connected to PulseChain 369
4. Enter constructor parameters:
   - `_devWallet`: `0x4890Be41BCe2E924C3aC4A1EFDC4a465F023Fe8B`
   - `_hostWallet`: `0x8855DEc7627CF4A23A2354F998Dfd57C500A8C51`
   - `_burnAddress`: `0x000000000000000000000000000000000000dEaD`
5. Click "Deploy"
6. Confirm transaction in MetaMask
7. Wait for deployment (10-30 seconds)
8. Copy the deployed contract address

### Step 5: Update Backend
1. Open `/app/backend/.env`
2. Update `CONTRACT_ADDRESS=<YOUR_CONTRACT_ADDRESS>`
3. Restart backend: `sudo supervisorctl restart backend`

### Step 6: Verify Contract (Optional but Recommended)
1. Go to https://scan.pulsechain.com
2. Search for your contract address
3. Click "Verify and Publish"
4. Enter contract details:
   - Compiler: `0.8.0`
   - Optimization: No
   - Contract code: Copy from Remix
5. Submit verification

## Method 2: Deploy with Hardhat (Advanced)

### Step 1: Install Hardhat
```bash
cd /app/contracts
npm init -y
npm install --save-dev hardhat @nomiclabs/hardhat-waffle
npx hardhat init
```

### Step 2: Configure Hardhat
Create `hardhat.config.js`:
```javascript
require("@nomiclabs/hardhat-waffle");

module.exports = {
  solidity: "0.8.0",
  networks: {
    pulsechain: {
      url: "https://rpc.pulsechain.com",
      chainId: 369,
      accounts: ["<YOUR_PRIVATE_KEY>"] // WARNING: Never commit this!
    }
  }
};
```

### Step 3: Create Deploy Script
Create `scripts/deploy.js`:
```javascript
async function main() {
  const PlinkoGame = await ethers.getContractFactory("PlinkoGame");
  const plinko = await PlinkoGame.deploy(
    "0x4890Be41BCe2E924C3aC4A1EFDC4a465F023Fe8B", // dev
    "0x8855DEc7627CF4A23A2354F998Dfd57C500A8C51", // host
    "0x000000000000000000000000000000000000dEaD"  // burn
  );

  await plinko.deployed();
  console.log("PlinkoGame deployed to:", plinko.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

### Step 4: Deploy
```bash
npx hardhat run scripts/deploy.js --network pulsechain
```

## Post-Deployment Checklist

- [ ] Contract deployed successfully
- [ ] Contract address saved
- [ ] Backend `.env` updated with CONTRACT_ADDRESS
- [ ] Backend restarted
- [ ] Contract verified on block explorer
- [ ] Test transaction sent to contract
- [ ] `play()` function tested
- [ ] `getGameState()` returns correct data
- [ ] Jackpots accumulating correctly

## Testing on Testnet First

**IMPORTANT**: Always test on PulseChain testnet before mainnet!

PulseChain Testnet (v4):
- RPC: https://rpc.v4.testnet.pulsechain.com
- Chain ID: 943
- Faucet: https://faucet.v4.testnet.pulsechain.com

## Estimated Gas Costs

- Deployment: ~2-3M gas (~$2-5 depending on PLS price)
- Play transaction: ~150k gas (~$0.15)
- Jackpot win: ~300k gas (~$0.30)

## Troubleshooting

### "Out of gas" error
- Increase gas limit in MetaMask
- Ensure you have enough PLS

### "Invalid address" error
- Verify wallet addresses are correct
- Must start with `0x`
- Must be 42 characters long

### Contract not verified
- Check compiler version matches
- Ensure optimization settings match
- Remove any extra whitespace

## Security Recommendations

1. **Audit**: Get professional smart contract audit before mainnet
2. **Testnet**: Thoroughly test all functions on testnet
3. **Gradual Launch**: Start with small entry fees
4. **Emergency Controls**: Owner can pause contract if needed
5. **Monitoring**: Set up alerts for large transactions

## Support

For deployment issues:
- PulseChain Discord: https://discord.gg/pulsechain
- Contract issues: Check `/contracts/PlinkoGame.sol` comments

---

**Remember**: Smart contract deployment is permanent. Test thoroughly before mainnet deployment!
