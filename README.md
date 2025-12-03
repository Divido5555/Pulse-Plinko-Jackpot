# PLS369 DAO — On-Chain Plinko Distribution Game

Welcome to the official **PLS369 DAO Plinko Game** — a fully on-chain, verifiably deterministic Plinko-style token distribution engine built on **PulseChain**.

This system replaces all earlier prototypes, PLS-entry games, and deprecated lottery contracts.  
The `main` branch reflects the finalized, DAO-aligned, **PLS369-only** model.

---

## 🔗 Mainnet Contracts (PulseChain)

- **PLS369 Token**: `0x55aC731aAa3442CE4D8bd8486eE4521B1D6Af5EC`
- **PlinkoGame369**: `0xFBF81bFA463252e25C8883ac0E3EBae99617A52c`

> ENTRY_PRICE and jackpot odds are encoded in the game contract and surfaced by `getGameState()`.

---

## 🔥 What This Game Is

A single, long-lived **distribution contract** that:

- Accepts **only `PLS369`** as the entry token  
- Pays **jackpots and prizes in `PLS369`**  
- Uses **on-chain randomness only** (no oracle / no backend)  
- Requires **no host wallet, no donation wallet, no off-chain "truth server"**  
- Acts as the DAO's primary **token emission + value engine**

There is **no separate emission schedule**.  
**Playing the game *is* the emission schedule.**

---

## 🌐 High-Level Architecture

### 1. `Pulse369ToknenMnv1.sol` (Token)

A fixed-supply ERC-20:

- **Total supply**: `369,000,000` PLS369  
- Minted once to the deployer (DAO-controlled EOA / multisig)  
- No taxes, no burns, no rebasing  
- DAO handles distribution via:
  - LP provisioning
  - Plinko game rewards
  - Treasury allocations & future products

---

### 2. `PlinkoGame369mnV1.sol` (Game)

The production Plinko game contract:

- `ENTRY_PRICE = 10 PLS369`
- 20-slot Plinko board (`slot = randomness % 20`)
- Main + Mini jackpot engines
- Regular prize multipliers
- DAO + Dev revenue accrual
- Admin upgradeable **only until `finalize()` is called**, then permanently locked

Per-play distribution (from the 10 PLS369 entry) is split between:

- **Main jackpot**
- **Mini jackpot**
- **DAO rewards**
- **Dev rewards**
- **Immediate prize payouts** (from winning slots)

The exact percentages are encoded as constants in the contract and can be read directly on-chain or via `docs/GAME_ECONOMICS.md`.

---

## 🎲 Randomness (On-Chain)

Randomness is derived **entirely on-chain**, using a mix of:

- `block.prevrandao`
- `block.timestamp`
- `msg.sender`
- `playCount` (monotonic counter)

Example pattern (simplified):

```solidity
uint256 random = uint256(
    keccak256(
        abi.encodePacked(
            block.prevrandao,
            block.timestamp,
            msg.sender,
            playCount
        )
    )
);
uint256 slot = random % 20;
```