# Smart Contracts - Production Deployment

## ✅ Production Contracts (Use These)

### PlinkoGame369.sol
**Status:** ✅ **RECOMMENDED FOR PRODUCTION**

The official PLS369 DAO Plinko game contract with enhanced security features.

**Features:**
- ✅ ReentrancyGuard protection
- ✅ Fetch Oracle integration for verifiable randomness
- ✅ Immutable treasury and dev wallet addresses
- ✅ Comprehensive test coverage
- ✅ Proper access controls

**Entry Price:** 10 PLS369 tokens per play

**Distribution:**
- 50% → Main Jackpot
- 15% → Mini Jackpot
- 25% → DAO Treasury
- 10% → Dev Wallet

**Deployment:**
```bash
# See /script/DeployPLS369System.s.sol for deployment script
# See /PLS369_DEPLOYMENT_CHECKLIST.md for full deployment guide
```

---

### PLS369Token.sol
**Status:** ✅ **RECOMMENDED FOR PRODUCTION**

Fixed-supply ERC20 token for the PLS369 DAO ecosystem.

**Features:**
- ✅ Fixed supply: 369,000,000 tokens
- ✅ No taxes, no burns, no rebasing
- ✅ Clean ERC20 implementation
- ✅ Solidity 0.8+ overflow protection

**Deployment:**
```bash
# Token will be deployed by DeployPLS369System script
# Full supply minted to deployer (DAO multisig recommended)
```

---

## ❌ Legacy/Demo Contracts (DO NOT USE)

### PlinkoGame.sol
**Status:** ❌ **DEPRECATED - DO NOT USE FOR PRODUCTION**

**WARNING:** This contract has **CRITICAL SECURITY VULNERABILITIES** and must NOT be deployed to mainnet.

**Known Issues:**
- ❌ No reentrancy protection (CRITICAL)
- ❌ Weak randomness using block values (CRITICAL)
- ❌ Missing access controls
- ❌ No test coverage

**Purpose:** Demo/reference only. Shows basic game mechanics but lacks production-ready security.

**Use PlinkoGame369.sol instead.**

---

## Deployment Instructions

### For Production Deployment:

1. **Read the deployment checklist:**
   ```
   /PLS369_DEPLOYMENT_CHECKLIST.md
   ```

2. **Deploy using the provided script:**
   ```bash
   # Using Foundry (recommended)
   forge script script/DeployPLS369System.s.sol:DeployPLS369System \
     --rpc-url $PULSECHAIN_RPC_URL \
     --broadcast \
     --verify
   ```

3. **Required environment variables:**
   ```bash
   PULSECHAIN_RPC_URL=<your-rpc-url>
   PRIVATE_KEY=<deployer-private-key>
   FETCH_ORACLE_ADDRESS=<fetch-oracle-address>
   DAO_TREASURY=<dao-treasury-address>
   DEV_WALLET=<dev-wallet-address>
   ```

4. **Post-deployment steps:**
   - Seed jackpots with initial PLS369 tokens
   - Top up randomness pool
   - Transfer tokens to game contract
   - Verify contracts on block explorer

---

## Testing

Run the comprehensive test suite:

```bash
# Using Foundry
forge test -vvv

# Specific test file
forge test --match-path tests/PLS369System.t.sol -vvv
```

**Test Coverage:**
- ✅ Token deployment and transfers
- ✅ Game deployment and initialization
- ✅ Jackpot seeding
- ✅ Randomness management
- ✅ Gameplay mechanics
- ✅ Prize payouts
- ✅ Jackpot wins
- ✅ Reward claims
- ✅ Access controls

---

## Contract Addresses

### Testnet (PulseChain Testnet v4)
```
PLS369Token:     [TO BE DEPLOYED]
PlinkoGame369:   [TO BE DEPLOYED]
```

### Mainnet (PulseChain)
```
PLS369Token:     [TO BE DEPLOYED]
PlinkoGame369:   [TO BE DEPLOYED]
```

**Note:** Update these addresses after deployment.

---

## Security

### Audits
- [ ] Professional security audit (REQUIRED before mainnet)
- [ ] Internal code review (COMPLETED)
- [ ] Community review period

### Security Features
- ✅ ReentrancyGuard on all payable functions
- ✅ Verifiable randomness (Fetch Oracle)
- ✅ Immutable critical addresses
- ✅ Access control modifiers
- ✅ Solidity 0.8+ overflow protection

### Known Limitations
- ⚠️ Oracle dependency (game stops if oracle fails)
- ⚠️ Randomness pool requires manual top-up
- ⚠️ No emergency pause mechanism (consider adding)

---

## Support

For questions or issues:
- Review: `/SECURITY_REVIEW.md`
- Deployment: `/PLS369_DEPLOYMENT_CHECKLIST.md`
- Improvements: `/IMPROVEMENTS_CHECKLIST.md`

---

## Summary

**Production Stack:**
```
✅ PLS369Token.sol      (ERC20 Token)
✅ PlinkoGame369.sol    (Game Contract)
❌ PlinkoGame.sol       (DEPRECATED - DO NOT USE)
```

**Always use PlinkoGame369.sol + PLS369Token.sol for production deployments.**

---

**Last Updated:** November 20, 2025  
**Status:** Ready for testnet deployment after security audit
