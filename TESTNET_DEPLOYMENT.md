# PLS369 Plinko — Testnet Deployment Checklist

## Purpose

This checklist ensures a smooth testnet deployment and validation before mainnet launch.

---

## Pre-Deployment Setup

### 1. Environment Variables

Create `.env` file:

```bash
# Network
PULSECHAIN_TESTNET_RPC=https://rpc.v4.testnet.pulsechain.com
PRIVATE_KEY=0x...  # Deployer key (testnet only!)

# Oracle
FETCH_ORACLE_ADDRESS=0x...  # Testnet Fetch RNG proxy

# Wallets
OWNER_ADDRESS=0x...         # DAO Safe (or deployer)
DAO_TREASURY=0x...          # DAO treasury Safe
DEV_WALLET=0x...            # Dev wallet
```

**Critical**: Verify `FETCH_ORACLE_ADDRESS` is correct for PulseChain testnet.

### 2. Testnet PLS

Ensure deployer wallet has:
- ✅ At least 1 PLS for deployment gas
- ✅ Additional PLS for testing

Get testnet PLS from faucet: [Link]

### 3. Compile Contracts

```bash
# Foundry
forge build

# OR Hardhat
npx hardhat compile
```

**Verify**:
- [ ] No compilation errors
- [ ] No warnings
- [ ] ABIs generated in `/out/` or `/artifacts/`

---

## Deployment Steps

### Step 1: Deploy PLS369Token

```bash
# Foundry
forge script script/DeployPLS369System.s.sol:DeployPLS369System \
  --rpc-url $PULSECHAIN_TESTNET_RPC \
  --broadcast

# OR Hardhat
npx hardhat run scripts/deploy_pls369_system.ts --network pulsechain_testnet
```

**Save addresses**:
- [ ] PLS369Token address: `_____________________`
- [ ] Transaction hash: `_____________________`
- [ ] Block number: `_____________________`

**Verify on explorer**:
- [ ] Contract verified: https://scan.v4.testnet.pulsechain.com/address/...
- [ ] Total supply = 369,000,000 PLS369
- [ ] Deployer balance = 369,000,000 PLS369

### Step 2: Deploy PlinkoGame369

This happens in the same deployment script, automatically after token.

**Save addresses**:
- [ ] PlinkoGame369 address: `_____________________`
- [ ] Transaction hash: `_____________________`
- [ ] Block number: `_____________________`

**Verify on explorer**:
- [ ] Contract verified
- [ ] Constructor params correct:
  - [ ] `_pls369` = token address
  - [ ] `_fetchOracle` = oracle address
  - [ ] `_owner` = owner address
  - [ ] `_daoTreasury` = DAO address
  - [ ] `_devWallet` = dev address

---

## Post-Deployment Configuration

### Step 3: Distribute Testnet Tokens

From deployer wallet, send PLS369 to:

```bash
# To game for seeding
pls369Token.transfer(GAME_ADDRESS, 60_000_000 * 1e18)

# To test players (5-10 wallets)
pls369Token.transfer(PLAYER1, 1_000_000 * 1e18)
pls369Token.transfer(PLAYER2, 1_000_000 * 1e18)
...
```

**Verify**:
- [ ] Game contract has 60M PLS369
- [ ] Each test player has 1M PLS369
- [ ] Deployer retains remainder

### Step 4: Seed Jackpots

```bash
# As owner
plinkoGame.seedJackpots(
  40_000_000 * 1e18,  // 40M to main jackpot
  15_000_000 * 1e18   // 15M to mini jackpot
)
```

**Verify**:
- [ ] `mainJackpot()` returns 40,000,000 * 1e18
- [ ] `miniJackpot()` returns 15,000,000 * 1e18
- [ ] Event `JackpotsSeeded` emitted

### Step 5: Top Up Randomness

```bash
# As owner
plinkoGame.topUpRandomness(1000)
```

**Verify**:
- [ ] `getRandomPoolSize()` returns (1000, 0)
- [ ] Event `RandomnessToppedUp` emitted
- [ ] Oracle data timestamp is recent (<1 hour old)

---

## Testing Phase

### Test 1: Basic Functionality

**Goal**: Verify a single play works end-to-end

1. **As Player1**:
   ```bash
   pls369Token.approve(GAME_ADDRESS, 10 * 1e18)
   plinkoGame.play()
   ```

2. **Verify**:
   - [ ] Transaction succeeds
   - [ ] Event `Play` emitted with correct slot
   - [ ] Player balance changed correctly
   - [ ] Jackpots increased (40% + 10%)
   - [ ] DAO/dev accrued (4% + 3%)

### Test 2: Prize Payouts

**Goal**: Confirm flat multipliers pay correctly

Run 100 plays and verify:
- [ ] Slot 3 pays 30 PLS369 (3x)
- [ ] Slot 7 pays 20 PLS369 (2x)
- [ ] Slot 11 pays 50 PLS369 (5x)
- [ ] Slot 15 pays 20 PLS369 (2x)
- [ ] Slot 18 pays 20 PLS369 (2x)
- [ ] Losers pay 0

**Track**: Win rate should be ~25% (5 out of 20 slots)

### Test 3: DAO/Dev Claims

**Goal**: Verify reward claims work

After 100 plays:

1. **Check accrued**:
   ```bash
   (,,,daoAccrued, devAccrued,) = plinkoGame.getGameState()
   ```
   - [ ] `daoAccrued` = 100 × 10 × 4% = 40 PLS369
   - [ ] `devAccrued` = 100 × 10 × 3% = 30 PLS369

2. **Claim as DAO**:
   ```bash
   plinkoGame.claimDaoRewards()
   ```
   - [ ] DAO wallet receives 40 PLS369
   - [ ] `daoAccrued` resets to 0

3. **Claim as Dev**:
   ```bash
   plinkoGame.claimDevRewards()
   ```
   - [ ] Dev wallet receives 30 PLS369
   - [ ] `devAccrued` resets to 0

### Test 4: Randomness Management

**Goal**: Verify randomness depletion and top-up

1. **Play until depleted**:
   - Run 1000 plays (should consume all randomness)

2. **Verify depletion**:
   ```bash
   plinkoGame.play()  // Should revert with "Randomness empty"
   ```

3. **Top up**:
   ```bash
   plinkoGame.topUpRandomness(500)
   ```

4. **Resume playing**:
   ```bash
   plinkoGame.play()  // Should succeed
   ```

### Test 5: Mini Jackpot Win (Simulated)

**Goal**: Verify mini jackpot payout logic

Since odds are 1/4,762, we can't reliably trigger it. Instead:

1. **Check mini jackpot size**:
   ```bash
   miniJackpot()  // Should be ~15M + growth
   ```

2. **Calculate expected payout**:
   - Winner: 50%
   - Dev: 10%
   - Reset: 40%

3. **Monitor for natural hit** (if testing for days):
   - [ ] Winner receives 50% of pot
   - [ ] Dev receives 10% of pot
   - [ ] Jackpot resets to 40% of original

### Test 6: Main Jackpot Win (Extremely Rare)

**Goal**: Understand main jackpot would work (but unlikely to hit on testnet)

Odds are 1/33,333, so expect to hit only after:
```
33,333 plays × 10 PLS369 = 333,330 PLS369 wagered
```

**If it hits** (lucky!):
- [ ] Winner receives 50% of pot
- [ ] DAO receives 20% of pot
- [ ] Jackpot resets to 30% of original
- [ ] Event `MainJackpotWon` emitted

---

## High-Volume Testing

### Test 7: Run 1,000 Plays

**Goal**: Validate economics at scale

1. **Automate 1,000 plays** (script or bot)

2. **Track totals**:
   - [ ] Total wagered = 10,000 PLS369
   - [ ] Main jackpot growth = 4,000 PLS369 (40%)
   - [ ] Mini jackpot growth = 1,000 PLS369 (10%)
   - [ ] DAO accrued = 400 PLS369 (4%)
   - [ ] Dev accrued = 300 PLS369 (3%)
   - [ ] Prizes paid = ~4,300 PLS369 (43%)

3. **Verify RTP**:
   ```
   Total returned to players / Total wagered ≈ 93-94%
   ```

4. **Check randomness pool**:
   - [ ] Pool not fully depleted
   - [ ] Top up if needed

---

## Edge Cases

### Test 8: Oracle Staleness

**Goal**: Verify game rejects old oracle data

1. **Wait 2 hours** (let oracle data become stale)

2. **Try topping up randomness**:
   ```bash
   plinkoGame.topUpRandomness(100)  // Should revert "RNG too old"
   ```

3. **Wait for fresh data** (oracle updates)

4. **Top up again**:
   ```bash
   plinkoGame.topUpRandomness(100)  // Should succeed
   ```

### Test 9: Zero Balances

**Goal**: Verify game handles empty jackpots gracefully

1. **Deplete jackpots** (via wins or admin)

2. **Hit jackpot slot**:
   - [ ] Game doesn't revert
   - [ ] Payout = 0
   - [ ] Event still emitted

3. **Reseed**:
   ```bash
   plinkoGame.seedJackpots(10M, 5M)
   ```

### Test 10: Access Control

**Goal**: Verify only authorized addresses can admin

1. **As random player**:
   ```bash
   plinkoGame.seedJackpots(1,1)  // Should revert "Only owner"
   plinkoGame.topUpRandomness(1) // Should revert "Only owner"
   ```

2. **As owner**:
   ```bash
   plinkoGame.seedJackpots(1,1)       // Should succeed
   plinkoGame.topUpRandomness(1)     // Should succeed
   plinkoGame.transferOwnership(NEW) // Should succeed
   ```

---

## Frontend Integration

### Test 11: Connect Frontend

**Goal**: Verify UI works with deployed contracts

1. **Update frontend `.env`**:
   ```bash
   REACT_APP_PLS369_TOKEN=<token_address>
   REACT_APP_PLINKO369_GAME=<game_address>
   REACT_APP_CHAIN_ID=943
   ```

2. **Test flows**:
   - [ ] Connect MetaMask to testnet
   - [ ] Display PLS369 balance
   - [ ] Approve game contract
   - [ ] Play game
   - [ ] See result animation
   - [ ] Display jackpot amounts
   - [ ] Show DAO/dev accrued

3. **Test edge cases**:
   - [ ] Insufficient balance error
   - [ ] Not approved error
   - [ ] Randomness empty warning

---

## Performance Metrics

### Test 12: Gas Usage

**Goal**: Measure transaction costs

Track gas used for:
- [ ] `approve()`: ~_________ gas (~$______ at current PLS price)
- [ ] `play()`: ~_________ gas (~$______ at current PLS price)
- [ ] `claimDaoRewards()`: ~_________ gas
- [ ] `topUpRandomness(100)`: ~_________ gas

**Target**: Play should cost < $0.01 on PulseChain

### Test 13: Throughput

**Goal**: Test concurrent plays

Simulate 10 players playing simultaneously:
- [ ] All transactions succeed
- [ ] No nonce collisions
- [ ] Events emitted correctly
- [ ] Balances update correctly

---

## Final Validation

### Checklist Before Mainnet

- [ ] 1,000+ testnet plays completed
- [ ] All prize payouts correct
- [ ] Jackpot odds validated (or math reviewed)
- [ ] DAO/dev claims work
- [ ] Randomness management works
- [ ] Oracle staleness protection works
- [ ] Access control enforced
- [ ] Frontend integrated and tested
- [ ] Gas costs acceptable
- [ ] Contracts verified on explorer
- [ ] Documentation matches implementation
- [ ] No critical bugs found

---

## Issues Log

Track any issues found during testing:

| Issue # | Description | Severity | Status | Fix |
|---------|-------------|----------|--------|-----|
| 1 | | | | |
| 2 | | | | |

---

## Sign-Off

### Testnet Deployment

- **Date**: ___________________
- **Token Address**: ___________________
- **Game Address**: ___________________
- **Total Plays**: ___________________
- **Issues Found**: ___________________
- **Status**: ✅ Ready for Mainnet / ⚠️ Needs Fixes

### Team Approval

- [ ] Lead Developer: ___________________
- [ ] Security Auditor: ___________________
- [ ] DAO Approval: ___________________

---

**Next Step**: Proceed to mainnet deployment with same process.

---

*For mainnet deployment, see `MAINNET_DEPLOYMENT.md` (to be created)*
