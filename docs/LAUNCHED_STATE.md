# PLS369 DAO • PulseChain Plinko Jackpot – Launched State

This document describes the **actual live system** and is the source of truth
for what belongs on `main`. Anything not aligned with this is legacy and should
be removed or moved to `/legacy`.

## Network & Contracts

- Network: **PulseChain mainnet**
- Token: **PLS369** (fixed supply, 18 decimals)
- Token address: `0x55aC731aAa3442CE4D8bd8486eE4521B1D6Af5EC`
- Game contract: **PlinkoGame369mnV1**
- Game address: `0xFBF81bFA463252e25C8883ac0E3EBae99617A52c`

The **ONLY authoritative game** is `PlinkoGame369mnV1` using **PLS369** and
on-chain randomness. All previous experiments (PLS 10,000 entry, Fetch-based
randomness, demo-only boards, etc.) are deprecated and must not exist on `main`
except under `/legacy`.

## Core Gameplay

- Entry price: `ENTRY_PRICE = 10 PLS369` (read on-chain via `getGameState()`).
- Flow:
  1. User connects a **PulseChain** wallet.
  2. UI ensures `approve(game, ENTRY_PRICE)` on PLS369.
  3. User clicks **Play** (or drops puck) → on-chain `play()` call.
  4. UI shows landed slot, prize, and updated jackpot values.

## Tokenomics (High Level)

Each play:
- Pulls 10 PLS369 from the player via `transferFrom`.
- Splits entry into:
  - Main jackpot increment
  - Mini jackpot increment
  - DAO rewards
  - Dev rewards
  - Immediate prize payouts (multiplier slots)

Main jackpot:
- Triggered by `slot == MAIN_SLOT` and a randomness condition.
Mini jackpot:
- Triggered on specific mini slots and randomness condition.
House edge is small but positive to the DAO over time.

## Smart Contracts (Code Layout Target)

- `/contracts/PLS369Token.sol` – fixed supply ERC-20 (matching deployed bytecode).
- `/contracts/PlinkoGame369mnV1.sol` – game contract matching
  `0xFBF81bFA463252e25C8883ac0E3EBae99617A52c`.
- Any other contracts in `/contracts` are **either support libs** or **legacy**.
  Legacy code should live under `/contracts/legacy` and not be referenced by
  the frontend or deployment scripts.

## Frontend

- React + TypeScript app (in `/frontend`).
- Theme: dark, neon “Pulse369 DAO”.
- Key components:
  - Plinko board with staggered pegs and falling puck.
  - Jackpot panel: main + mini jackpots from `getGameState()`.  
  - Wallet panel: PLS369 balance, session stats, P/L.
  - Result banner: last slot, multiplier, jackpot hits.

The physics layer is **visual only**. The authoritative result always comes
from the game contract’s `play()` transaction.

## Integration Requirements

- Wallet wiring:
  - Connect to PulseChain.
  - Show PLS369 balance from `0x55aC731aAa3442CE4D8bd8486eE4521B1D6Af5EC`.
  - Enforce `approve(game, ENTRY_PRICE)` as needed.
- Game wiring:
  - Use `play()` on `0xFBF81bFA463252e25C8883ac0E3EBae99617A52c`.
  - Map result (slot, payout) to animations and UI.
  - Use `getGameState()` for jackpots + DAO/Dev accrual.

Anything that assumes:
- other tokens,
- other entry prices,
- Fetch/oracle randomness,
- purely local demo jackpots,

…is **legacy** and must be removed or moved out of `main`.