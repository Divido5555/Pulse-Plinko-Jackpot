# PLS369 Eternal Plinko - Deployment Checklist

## Overview

This checklist covers the deployment and setup of the PLS369 DAO Eternal Plinko system, consisting of:
- **PLS369Token** - Fixed supply ERC-20 token (369M tokens)
- **PlinkoGame369** - Eternal, immutable Plinko game using Fetch Oracle RNG

---

## Pre-Deployment Requirements

### Environment Variables

Create `.env` file with the following:

```bash
# Network RPC
PULSECHAIN_TESTNET_RPC=https://rpc.v4.testnet.pulsechain.com
PULSECHAIN_MAINNET_RPC=https://rpc.pulsechain.com

# Deployer
PRIVATE_KEY=0x...  # DO NOT COMMIT!

# Game Parameters
FETCH_ORACLE_ADDRESS=0x...     # Fetch Oracle RNG proxy on PulseChain
OWNER_ADDRESS=0x...             # DAO multisig (optional, defaults to deployer)
DAO_TREASURY=0x...              # DAO treasury Safe
DEV_WALLET=0x...                # Developer wallet

# Optional: For verification
ETHERSCAN_API_KEY=...
```

### Required Addresses

- [ ] **Fetch Oracle Address**: Confirmed Fetch RNG proxy on target network
- [ ] **Owner Address**: DAO multisig or admin wallet (immutable after deploy)
- [ ] **DAO Treasury**: Safe/multisig for DAO funds (immutable)
- [ ] **Dev Wallet**: Developer rewards wallet (immutable)

### Testnet vs Mainnet

**Testnet Deployment (Recommended First):**
- Test all functionality
- Verify game mechanics
- Test token distribution
- Verify oracle integration
- Practice operational procedures

**Mainnet Deployment (After Successful Testing):**
- Full audit recommended
- Community announcement
- Liquidity preparation
- Marketing materials ready

---

## Deployment Steps

### Step 1: Compile Contracts

```bash
# For Hardhat
npx hardhat compile

# For Foundry
forge build
```

**Verify:**
- [ ] No compilation errors
- [ ] No warnings
- [ ] ABIs generated

### Step 2: Run Tests

```bash
# For Foundry
forge test -vvv

# For Hardhat
npx hardhat test
```

**Verify:**
- [ ] All tests passing
- [ ] Token minting correct (369M)
- [ ] Game mechanics working
- [ ] Jackpot payouts correct
- [ ] Reward claims working

### Step 3: Deploy Contracts

**Using Hardhat:**
```bash
npx hardhat run scripts/deploy_pls369_system.ts --network pulsechain_testnet
```

**Using Foundry:**
```bash
forge script script/DeployPLS369System.s.sol:DeployPLS369System \
  --rpc-url $PULSECHAIN_TESTNET_RPC \
  --broadcast \
  --verify
```

**Save Addresses:**
- [ ] PLS369Token address: `_____________________`
- [ ] PlinkoGame369 address: `_____________________`
- [ ] Deployment transaction hash: `_____________________`
- [ ] Block number: `_____________________`

### Step 4: Verify Contracts on Block Explorer

```bash
# Verify PLS369Token
npx hardhat verify --network pulsechain_testnet <TOKEN_ADDRESS>

# Verify PlinkoGame369
npx hardhat verify --network pulsechain_testnet <GAME_ADDRESS> \
  "<TOKEN_ADDRESS>" \
  "<FETCH_ORACLE>" \
  "<OWNER>" \
  "<DAO_TREASURY>" \
  "<DEV_WALLET>"
```

**Verify:**
- [ ] Token contract verified
- [ ] Game contract verified
- [ ] Source code visible on explorer

---

## Post-Deployment Configuration

### Step 5: Token Distribution

The deployer initially holds all 369M PLS369 tokens. Distribute according to DAO plan:

**Suggested Distribution (adjust as needed):**
- 40% (147.6M) → Liquidity Pool (PLS/PLS369)
- 30% (110.7M) → DAO Treasury (long-term)
- 15% (55.35M) → Game Seeding (jackpots + prizes)
- 10% (36.9M) → Team/Contributors (vesting)
- 5% (18.45M) → Community airdrops/marketing

```bash
# Example transfers
# Transfer to LP
pls369Token.transfer(LP_ADDRESS, 147_600_000 * 1e18)

# Transfer to Treasury
pls369Token.transfer(DAO_TREASURY, 110_700_000 * 1e18)

# Transfer to Game for seeding
pls369Token.transfer(GAME_ADDRESS, 55_350_000 * 1e18)
```

**Verify:**
- [ ] Tokens transferred to correct addresses
- [ ] Amounts match distribution plan
- [ ] Transactions confirmed on explorer

### Step 6: Seed Game Jackpots

After transferring tokens to game contract:

```bash
# Seed jackpots (as owner)
plinkoGame.seedJackpots(
  30_000_000 * 1e18,  // 30M for main jackpot
  10_000_000 * 1e18   // 10M for mini jackpot
)
```

**Suggested Initial Seeding:**
- Main Jackpot: 30M PLS369
- Mini Jackpot: 10M PLS369
- Reserve: 15.35M PLS369 (for future seeding/prizes)

**Verify:**
- [ ] `mainJackpot()` shows correct amount
- [ ] `miniJackpot()` shows correct amount
- [ ] Event `JackpotsSeeded` emitted

### Step 7: Top Up Randomness Pool

Initialize the randomness pool with enough entropy for initial plays:

```bash
# Top up randomness (as owner)
# 1000 rounds = ~1000 plays worth of randomness
plinkoGame.topUpRandomness(1000)
```

**Recommendations:**
- Initial: 1000 rounds (monitor and top up regularly)
- Production: Set up automated monitoring
- Alert when pool drops below 100 remaining

**Verify:**
- [ ] `getRandomPoolSize()` returns expected size
- [ ] Event `RandomnessToppedUp` emitted
- [ ] Fetch Oracle data is recent (<1 hour old)

---

## Frontend Configuration

### Step 8: Update Frontend Environment

Update `frontend/.env`:

```bash
# Contract Addresses
REACT_APP_PLS369_TOKEN=0x...       # Deployed token address
REACT_APP_PLINKO369_GAME=0x...     # Deployed game address

# Network
REACT_APP_CHAIN_ID=943              # Testnet: 943, Mainnet: 369
REACT_APP_NETWORK_NAME=PulseChain Testnet

# Backend (if applicable)
REACT_APP_BACKEND_URL=...
```

### Step 9: Deploy/Update Frontend

**If using Emergent Preview:**
- Update frontend code to use new contracts
- Test token approval flow
- Test play functionality
- Click "Preview" to deploy

**Verify:**
- [ ] Frontend connects to correct network
- [ ] Token balance displays correctly
- [ ] Approval transaction works
- [ ] Play transaction works
- [ ] Jackpot amounts display
- [ ] Game events captured

---

## Operational Procedures

### Regular Maintenance

**Daily Checks:**
- [ ] Monitor randomness pool level
- [ ] Check Fetch Oracle data freshness
- [ ] Review play activity
- [ ] Monitor jackpot growth

**Weekly Tasks:**
- [ ] Top up randomness if needed
- [ ] Analyze game statistics
- [ ] Review any issues/bugs
- [ ] Community updates

**Monthly Tasks:**
- [ ] DAO claims accrued rewards
- [ ] Dev claims accrued rewards
- [ ] Financial reporting
- [ ] Performance analysis

### Randomness Management

**Top Up Randomness:**
```solidity
// As owner
plinkoGame.topUpRandomness(500);  // Add 500 more plays worth
```

**Monitor Pool:**
```solidity
(uint256 poolSize, uint256 currentIndex) = plinkoGame.getRandomPoolSize();
uint256 remaining = poolSize - currentIndex;

if (remaining < 100) {
    // Time to top up!
}
```

**Best Practices:**
- Keep at least 100 plays worth of randomness
- Top up in batches of 500-1000
- Monitor Fetch Oracle uptime
- Have backup plan if oracle fails

### Reward Claims

**DAO Treasury Claims:**
```solidity
// As DAO treasury or owner
plinkoGame.claimDaoRewards();
```

**Dev Wallet Claims:**
```solidity
// As dev wallet or owner
plinkoGame.claimDevRewards();
```

**Check Accrued Amounts:**
```solidity
(,,, uint256 daoAccrued, uint256 devAccrued,) = plinkoGame.getGameState();
```

---

## Testing Checklist

### Basic Functionality Tests

- [ ] **Token Transfer**: Send PLS369 between wallets
- [ ] **Token Approval**: Approve game contract
- [ ] **Play Game**: Execute play() successfully
- [ ] **Prize Payout**: Land on prize slot, receive payout
- [ ] **Loser Slot**: Land on loser, no payout
- [ ] **Jackpot Display**: Frontend shows current jackpots
- [ ] **DAO Claim**: DAO treasury claims rewards
- [ ] **Dev Claim**: Dev wallet claims rewards

### Edge Cases

- [ ] **No Randomness**: Play fails with proper error
- [ ] **No Approval**: Play fails with proper error
- [ ] **Insufficient Balance**: Transfer fails properly
- [ ] **Double Spend**: Cannot play without re-approval
- [ ] **Oracle Stale**: Errors when data too old

### Integration Tests

- [ ] **Multiple Players**: Several players play simultaneously
- [ ] **High Volume**: Stress test with many plays
- [ ] **Randomness Depletion**: Deplete pool, verify error
- [ ] **Jackpot Win**: Trigger jackpot (may need to mock)
- [ ] **Claim Rewards**: Accumulate and claim DAO/dev rewards

---

## Security Considerations

### Pre-Launch Audit Items

- [ ] **Reentrancy Protection**: ReentrancyGuard on critical functions
- [ ] **Integer Overflow**: Using Solidity 0.8+ (built-in)
- [ ] **Access Control**: Only owner can call admin functions
- [ ] **Randomness Source**: Fetch Oracle verified and trusted
- [ ] **Immutability**: Treasury/dev wallets immutable
- [ ] **Emergency Functions**: Review seedJackpots, transferOwnership

### Operational Security

- [ ] **Owner Key Management**: Hardware wallet or multisig
- [ ] **Treasury Security**: Gnosis Safe or equivalent
- [ ] **Oracle Monitoring**: Alerts for stale/missing data
- [ ] **Contract Monitoring**: Watch for unusual activity
- [ ] **Backup Procedures**: Document recovery steps

---

## Monitoring & Analytics

### Key Metrics to Track

**Game Activity:**
- Total plays
- Unique players
- Average plays per player
- Plays per day/week/month

**Economic Metrics:**
- Total PLS369 wagered
- Total prizes paid out
- Jackpot growth rate
- DAO rewards accumulated
- Dev rewards accumulated

**Technical Metrics:**
- Randomness pool utilization
- Oracle data freshness
- Transaction success rate
- Gas costs

### Dashboard Setup

Create monitoring dashboard showing:
- Current jackpot sizes
- Recent plays (last 10)
- Recent winners
- Total statistics
- Randomness pool status
- Accrued rewards (DAO/dev)

---

## Troubleshooting

### Common Issues

**"Randomness empty" Error:**
- **Cause**: Random pool depleted
- **Fix**: Call `topUpRandomness(1000)` as owner

**"RNG too old" Error:**
- **Cause**: Fetch Oracle data >1 hour old
- **Fix**: Check oracle status, wait for update, or update oracle address

**"Token transfer failed":**
- **Cause**: Insufficient approval or balance
- **Fix**: Approve sufficient amount, check balance

**Players Can't Play:**
- Check frontend is using correct contract address
- Verify network (testnet vs mainnet)
- Confirm randomness pool has entropy
- Test with owner wallet first

---

## Mainnet Launch Checklist

Before deploying to mainnet:

- [ ] **Testnet Success**: Minimum 1000 plays on testnet without issues
- [ ] **Audit Complete**: Professional audit or thorough review
- [ ] **Community Ready**: Announcements, documentation, support channels
- [ ] **Liquidity Ready**: PLS/PLS369 liquidity pool prepared
- [ ] **Team Aligned**: All wallets (treasury, dev) confirmed
- [ ] **Marketing**: Launch materials, social media, partnerships
- [ ] **Support**: Help desk, FAQ, video tutorials
- [ ] **Monitoring**: Analytics dashboard live
- [ ] **Emergency Plan**: Procedures for issues
- [ ] **Legal Review**: If applicable to your jurisdiction

---

## Support & Resources

### Documentation
- Contract source: `/app/contracts/`
- Tests: `/app/tests/PLS369System.t.sol`
- Deployment: `/app/scripts/deploy_pls369_system.ts`

### Block Explorers
- Testnet: https://scan.v4.testnet.pulsechain.com
- Mainnet: https://scan.pulsechain.com

### Community
- Discord: [Your Link]
- Telegram: [Your Link]
- Twitter: [Your Link]

---

## Deployment Log

### Testnet Deployment

- **Date**: ___________________
- **Deployer**: ___________________
- **PLS369Token**: ___________________
- **PlinkoGame369**: ___________________
- **Initial Seed**: ___________________ PLS369
- **Status**: ⏳ Pending / ✅ Success / ❌ Failed

### Mainnet Deployment

- **Date**: ___________________
- **Deployer**: ___________________
- **PLS369Token**: ___________________
- **PlinkoGame369**: ___________________
- **Initial Seed**: ___________________ PLS369
- **Status**: ⏳ Pending / ✅ Success / ❌ Failed

---

**Last Updated**: [DATE]
**Version**: 1.0.0
**Status**: 📝 Draft → 🧪 Testing → ✅ Production
