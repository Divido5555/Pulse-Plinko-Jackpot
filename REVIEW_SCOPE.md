# PLS369 DAO Plinko — Review Scope

## Purpose

This document defines the **exact files** that Emergent, auditors, or reviewers should focus on for the PLS369 DAO Plinko system.

**Ignore everything else.** Legacy contracts, old documentation, and experimental code are moved to `/legacy/` and should not be reviewed.

---

## ✅ Active Contracts (MUST REVIEW)

These are the **only contracts** that will be deployed to mainnet:

### 1. `contracts/PLS369Token.sol`

**Purpose**: Fixed-supply ERC-20 token  
**Lines**: ~80  
**Key Points**:
- Total supply: 369,000,000 PLS369
- Standard ERC-20 (no tax, no burn, no rebase)
- All tokens minted to deployer at construction
- No admin functions (fully decentralized after deployment)

**Review Focus**:
- ✅ ERC-20 compliance
- ✅ No hidden mint/burn functions
- ✅ Integer overflow protection (Solidity 0.8+)
- ✅ Transfer logic correctness

---

### 2. `contracts/PlinkoGame369.sol`

**Purpose**: Eternal Plinko game (token distribution + jackpot engine)  
**Lines**: ~350  
**Key Points**:
- Entry price: 10 PLS369
- Splits: 40% main, 10% mini, 4% DAO, 3% dev
- Main jackpot: slot 10, odds 1/33,333
- Mini jackpot: slots 2 or 16, odds 1/4,762
- Randomness: Fetch Oracle RNG (pooled)
- Reentrancy protection on all state-changing functions

**Review Focus**:
- ✅ Reentrancy protection (`nonReentrant`)
- ✅ Integer overflow/underflow safety
- ✅ Randomness pool depletion handling
- ✅ Jackpot payout math correctness
- ✅ DAO/dev reward accrual logic
- ✅ Oracle staleness check (<1 hour)
- ✅ Access control (owner-only functions)
- ✅ No funds stuck (all balances withdrawable)

**Critical Functions to Audit**:
- `play()` — main game logic
- `_payoutMainJackpot()` — 50/20/30 split
- `_payoutMiniJackpot()` — 50/10/40 split
- `topUpRandomness()` — RNG pool management
- `seedJackpots()` — initial jackpot funding

---

## 📚 Documentation (MUST REVIEW)

These docs reflect the finalized system:

### 3. `README.md`

**Purpose**: Main repository overview  
**Key Sections**:
- What the game is
- Architecture overview
- Gameplay mechanics
- Prize slots + jackpots
- DAO economics

**Review Focus**:
- ✅ Matches contract implementation
- ✅ Correct odds stated
- ✅ No misleading promises

---

### 4. `docs/TOKENOMICS.md`

**Purpose**: Token distribution and economic model  
**Key Sections**:
- Supply allocation (LP, treasury, game, team, community)
- Utility (game entry, DAO governance)
- Demand drivers
- Liquidity strategy

**Review Focus**:
- ✅ Supply percentages add to 100%
- ✅ Realistic revenue projections
- ✅ Clear risk disclosures

---

### 5. `docs/GAME_ECONOMICS.md`

**Purpose**: RTP, house edge, jackpot volatility  
**Key Sections**:
- Per-play flow (40/10/4/3 split)
- Prize structure (flat + jackpots)
- RTP calculation (~93-94%)
- House edge breakdown (6.9%)
- Jackpot seeding/refill strategy

**Review Focus**:
- ✅ Math checks out (RTP = 93-94%)
- ✅ House edge = DAO/dev split (4+3=7%)
- ✅ Jackpot odds match contract constants

---

## ❌ Files to IGNORE

These are legacy/deprecated and should **NOT** be reviewed:

| File | Reason |
|------|--------|
| `contracts/PlinkoGame.sol` | Old PLS-entry version (DEPRECATED) |
| `contracts/PlinkoGameVRF.sol` | Experimental VRF version (not used) |
| Any contract with `hostWallet` | Old architecture (replaced) |
| Any contract with `donationWallet` | Old architecture (replaced) |
| Old README versions | Superseded by current README.md |

**Move these to `/legacy/` for historical reference.**

---

## 🧪 Tests (OPTIONAL REVIEW)

If reviewing test coverage:

### 6. `tests/PLS369System.t.sol`

**Purpose**: Comprehensive Foundry test suite  
**Coverage**:
- Token minting and transfers
- Game deployment and configuration
- Play functionality (entry, distribution, prizes)
- Jackpot wins (main and mini)
- DAO/dev reward claims
- Randomness management
- Access control
- Edge cases (depleted randomness, zero balances)

**Review Focus**:
- ✅ All critical paths tested
- ✅ Edge cases covered
- ✅ Mock oracle behavior realistic
- ✅ No tests bypassing security checks

---

## 🚀 Deployment Scripts (OPTIONAL REVIEW)

If reviewing deployment process:

### 7. `scripts/deploy_pls369_system.ts` (Hardhat)
### 8. `script/DeployPLS369System.s.sol` (Foundry)

**Purpose**: Deploy token + game in correct order  
**Key Steps**:
1. Deploy PLS369Token
2. Deploy PlinkoGame369 with correct addresses
3. Log addresses for verification

**Review Focus**:
- ✅ Constructor params correct
- ✅ Immutable addresses used
- ✅ No hardcoded testnet values in mainnet script

---

## Summary Table

| File | Status | Priority | Lines | Review Time |
|------|--------|----------|-------|-------------|
| `contracts/PLS369Token.sol` | ✅ Active | HIGH | ~80 | 15 min |
| `contracts/PlinkoGame369.sol` | ✅ Active | CRITICAL | ~350 | 60 min |
| `README.md` | ✅ Active | MEDIUM | ~300 | 15 min |
| `docs/TOKENOMICS.md` | ✅ Active | MEDIUM | ~400 | 20 min |
| `docs/GAME_ECONOMICS.md` | ✅ Active | HIGH | ~500 | 30 min |
| `tests/PLS369System.t.sol` | ✅ Active | LOW | ~600 | 30 min |
| `scripts/deploy_pls369_system.ts` | ✅ Active | LOW | ~150 | 10 min |

**Total estimated review time**: ~3 hours for thorough audit

---

## Checklist for Reviewers

Before approving for mainnet deployment:

- [ ] `PLS369Token.sol` — ERC-20 compliance verified
- [ ] `PlinkoGame369.sol` — All math correct (splits, odds, payouts)
- [ ] `PlinkoGame369.sol` — Reentrancy protection confirmed
- [ ] `PlinkoGame369.sol` — No funds can get stuck
- [ ] `PlinkoGame369.sol` — Oracle staleness check works
- [ ] `README.md` — Matches implementation
- [ ] `TOKENOMICS.md` — Supply distribution clear
- [ ] `GAME_ECONOMICS.md` — RTP/house edge accurate
- [ ] Tests pass (`forge test -vvv`)
- [ ] Deployment scripts use correct addresses

---

## Contact

For questions about review scope or contract logic:

- GitHub Issues: [Your Repo]
- Discord: [Your Server]
- Email: [Your Contact]

---

**Last Updated**: [DATE]  
**Review Status**: ⏳ Pending Audit
