# PLS369 DAO — On-Chain Plinko Distribution Game

Welcome to the official **PLS369 DAO Plinko Game** — a fully on-chain, verifiably fair, automated token-distribution engine built on PulseChain.

This system replaces all earlier prototypes, PLS-entry games, and deprecated lottery contracts.  
**Everything in the main branch reflects the finalized, DAO-governed, PLS369-based model.**

---

## 🔥 What This Game Is

A **single eternal distribution contract** that:

- Accepts **only PLS369 token**
- Pays jackpots and prizes in **PLS369**
- Uses **Fetch Oracle** for secure randomness
- Requires **no backend, no host wallet, and no donation wallet**
- Acts as the **DAO's primary token emission + value engine**

**The game both distributes the token and generates DAO revenue.**  
There is no inflation curve, no emissions schedule — **the game IS the emission schedule.**

---

## 🌐 High-Level Architecture

### 1. PLS369Token.sol

A **fixed-supply ERC-20**:

- **Supply**: 369,000,000 PLS369
- Minted once to the DAO deployer
- No taxes, no burns, no rebasing
- DAO handles distribution via LP + game + treasury

### 2. PlinkoGame369.sol

The **only production game contract**:

- **ENTRY_PRICE** = 10 PLS369
- Jackpot + prize engine
- Randomness via **Fetch Oracle** `getDataBefore`
- **~6.9% symbolic house edge**
- Withdrawals restricted to DAO and Dev

### 3. Frontend

A **React-based UI** that:

- Calls `approve(ENTRY_PRICE)`
- Calls `play()`
- Displays slot, multiplier, jackpot state
- Shows DAO/Dev accrual + jackpots in real time

---

## 🎮 Gameplay Overview

### Entry

Every play costs:

```
10 PLS369
```

User must `approve()` first.

### 🧮 Per-Play Token Flow

Every play distributes the entry amount as:

| Destination | Percentage | Purpose |
|-------------|------------|---------|
| Main Jackpot | 40% | Primary prize pool |
| Mini Jackpot | 10% | Frequent mini-jackpots |
| DAO Rewards | 4% | DAO revenue |
| Dev Rewards | 3% | Dev funding |
| Regular Prize Payouts | Varies | From prize slots |
| **House Edge** | **~6.9%** | **DAO profit & long-term sustainability** |

The system is designed to have a **stable house advantage**, not an exploitably profitable jackpot.

---

## 💥 Prize Slots (Finalized)

**Slot index** is `randomness % 20`.

### Flat Prizes

| Slot | Multiplier | Notes |
|------|------------|-------|
| **3** | **3×** | Medium hit |
| **7** | **2×** | Common win |
| **11** | **5×** | Big regular win |
| **15** | **2×** | Common win |
| **18** | **2×** | Medium win |

### 🏆 Jackpots

#### Main Jackpot

**Triggered when:**
- Slot = 10, **AND**
- `randomness % MAIN_JACKPOT_ODDS == 0`

**Payout:**
- 50% → Winner
- 20% → DAO
- 30% → Jackpot reset

**MAIN_JACKPOT_ODDS** = **1 in 33,333**  
(≈10,000 USD target volatility, configurable)

#### Mini Jackpot

**Triggered when:**
- Slot = **2 or 16**, **AND**
- `randomness % MINI_JACKPOT_ODDS == 0`

**Payout:**
- 50% → Winner
- 10% → Dev
- 40% → Jackpot reset

**MINI_JACKPOT_ODDS** = **1 in 4,762**

Mini jackpot hits frequently enough to stay exciting.

---

## 🔒 Randomness (Fetch Oracle)

The game uses:

```solidity
getDataBefore(queryId, timestamp)
```

Oracle data is:
- Verified
- Timestamp-limited (<1 hour old)
- Batched into a **randomness pool**
- Consumed sequentially for each play

Frontend must warn when:
- Randomness pool is low
- Owner must call `topUpRandomness()`

---

## 🔧 Important Functions

### Owner / DAO

- `topUpRandomness(uint256 rounds)`
- `seedJackpots(uint main, uint mini)`
- `claimDaoRewards()`
- `claimDevRewards()`

### Players

- `approve(10 PLS369)`
- `play()`

### View

- `getGameState()`
- `getRandomPoolSize()`

---

## 🏛 DAO Economics

**PLS369 is a distribution token**, meaning:

- Supply is fixed
- Game redistributes liquidity
- Players buy PLS369 to play
- DAO & Dev wallets earn revenue passively
- Treasury buys PLS using profit and deposits into LiquidLoans vaults (future phase)

This creates:

✅ Positive feedback loops  
✅ Sustainable liquidity  
✅ Progressive value accumulation  
✅ Controlled game-based emission

---

## 📁 Repository Structure

```
/
├── contracts/
│   ├── PLS369Token.sol
│   ├── PlinkoGame369.sol
│   └── legacy/
│       └── PlinkoGame.sol (DEPRECATED)
│
├── frontend/
├── backend/   (optional, not required)
│
└── docs/
    ├── TOKENOMICS.md
    ├── GAME_ECONOMICS.md
    └── ARCHITECTURE.md
```

**All old PLS-entry game files moved to `/legacy/`.**

---

## 🚀 Deployment Checklist

### Testnet

1. Deploy `PLS369Token.sol`
2. Deploy `PlinkoGame369.sol`
3. Seed jackpots
4. Top up randomness
5. Run 1,000+ plays
6. Confirm jackpot odds
7. Validate prize multipliers

### Mainnet

1. Point frontend to mainnet contracts
2. Verify contracts on Blockscout
3. Add PulseX LP link in frontend
4. Announce launch

---

## 🔥 Status

**Ready for audit + testnet launch.**  
This branch is the **authoritative version** of PLS369 DAO Plinko.

---

## 🙏 Credits

Developed by the **PLS369 DAO**.
