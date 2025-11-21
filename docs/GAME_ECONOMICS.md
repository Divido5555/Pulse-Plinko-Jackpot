# PLS369 Plinko — Game Economics

## Overview

This document explains the economic design of the PLS369 Plinko game, including RTP (Return to Player), house edge, jackpot volatility, and why the odds are tuned for sustainability rather than exploitation.

---

## Target Economics

| Metric | Target | Actual |
|--------|--------|--------|
| **RTP (Return to Player)** | 93-94% | ~93.1% |
| **House Edge** | 6-7% | **~6.9%** (symbolic) |
| **Jackpot Contribution** | 50% | 40% main + 10% mini |
| **DAO/Dev Take** | 7% | 4% DAO + 3% dev |

The **6.9% house edge** is a symbolic nod to PulseChain's chain ID (369) and represents the long-term expected profit for the DAO.

---

## Per-Play Flow Breakdown

### Entry: 10 PLS369

Every play distributes the entry as follows:

| Destination | Percentage | Amount (PLS369) | Purpose |
|-------------|------------|-----------------|---------|
| **Main Jackpot** | 40% | 4.0 | Grows main prize pool |
| **Mini Jackpot** | 10% | 1.0 | Grows mini prize pool |
| **DAO Treasury** | 4% | 0.4 | Immediate DAO revenue |
| **Dev Wallet** | 3% | 0.3 | Immediate dev revenue |
| **Prize Pool** | 43% | 4.3 | Available for regular prizes |
| **Total** | 100% | 10.0 | |

### Prize Pool (43%)

This 43% is distributed via:

- **Flat multipliers** (slots 3, 7, 11, 15, 18)
- **Jackpot payouts** (slots 2, 10, 16)
- **Losers** (all other slots)

---

## Prize Structure

### Flat Prizes (Non-Jackpot Wins)

| Slot | Multiplier | Payout | Probability |
|------|------------|--------|-------------|
| 3 | 3x | 30 PLS369 | 1 in 20 (5%) |
| 7 | 2x | 20 PLS369 | 1 in 20 (5%) |
| 11 | 5x | 50 PLS369 | 1 in 20 (5%) |
| 15 | 2x | 20 PLS369 | 1 in 20 (5%) |
| 18 | 2x | 20 PLS369 | 1 in 20 (5%) |

**Total prize probability**: 25% (5 out of 20 slots)

**Expected payout from prizes**:
```
(30 + 20 + 50 + 20 + 20) / 20 = 7.0 PLS369 per play (on average)
```

### Jackpots

#### Main Jackpot
- **Trigger**: Slot 10 AND odds check (1 in 33,333)
- **Combined probability**: (1/20) × (1/33,333) = **1 in 666,660**
- **Payout**: 50% of jackpot pool to winner
- **Expected value**: Depends on jackpot size

#### Mini Jackpot
- **Trigger**: Slot 2 OR 16 AND odds check (1 in 4,762)
- **Combined probability**: (2/20) × (1/4,762) = **1 in 47,620**
- **Payout**: 50% of jackpot pool to winner
- **Expected value**: Depends on jackpot size

---

## RTP Calculation

### Fixed Component (Prizes)

From flat multipliers:
```
Expected return = 7.0 PLS369 per 10 PLS369 bet = 70% RTP
```

### Variable Component (Jackpots)

Jackpot contribution adds to RTP but depends on jackpot size:

```
Main jackpot RTP = (Main pot × 50% × Main probability)
Mini jackpot RTP = (Mini pot × 50% × Mini probability)
```

**At steady state** (jackpots seeded and stable):
- Main jackpot RTP ≈ 15-20%
- Mini jackpot RTP ≈ 3-5%

### Total RTP

```
Total RTP = Prizes (70%) + Main JP (15-20%) + Mini JP (3-5%)
          ≈ 88-95%
```

**Target: 93-94%**

This leaves **6-7%** for DAO/dev (house edge), which matches our split:
```
4% DAO + 3% dev = 7% house take
```

---

## Why These Odds?

### Main Jackpot: 1 in 666,660

**Rationale**: 
- Target jackpot size: ~$10,000 USD
- At 10 PLS369 entry ($0.01-0.05 range expected), this means 200,000-1,000,000 plays to build pot
- Odds of 1 in 666k ensures jackpot hits every ~$6,600-$33,000 wagered
- Provides **massive viral marketing** when it hits

**Not designed to be profitable for players**, but creates:
- FOMO
- Social proof
- Viral tweets ("I won $10k on Plinko!")

### Mini Jackpot: 1 in 47,620

**Rationale**:
- Target jackpot size: ~$500-$1,000 USD
- Hits frequently enough to maintain excitement
- Every 2-3 days of moderate volume
- Keeps players engaged between main jackpot hits

---

## House Edge Breakdown

### 6.9% Symbolic Edge

The game is designed so that:

```
Expected player return = 93.1%
Expected DAO/Dev take = 6.9%
```

This **6.9%** is divided as:
- **4%** → DAO treasury (immediate)
- **3%** → Dev wallet (immediate)

### Comparison to Traditional Casinos

| Game | House Edge | RTP |
|------|------------|-----|
| **PLS369 Plinko** | **6.9%** | **93.1%** |
| Roulette (American) | 5.26% | 94.74% |
| Slots (typical) | 2-10% | 90-98% |
| Blackjack (basic strategy) | 0.5% | 99.5% |
| Keno | 25-40% | 60-75% |

**PLS369 Plinko is competitive** with traditional casino games while offering:
- Transparency (on-chain)
- Verifiable fairness (oracle RNG)
- Community ownership (DAO)

---

## Volatility vs Expected Value

### Why Not Make Jackpots More Likely?

If jackpot odds were higher (easier to win):
- RTP would exceed 100% → unsustainable
- Jackpot size would be smaller → less exciting
- No viral marketing effect

### Why Not Make Prizes Bigger?

If prize multipliers were higher:
- RTP would exceed 100% → game drains treasury
- Jackpots would never grow → boring
- No FOMO

### The Balance

Current design:
- **Flat prizes** provide frequent small wins (25% hit rate)
- **Mini jackpot** provides medium excitement (hits every few days)
- **Main jackpot** provides life-changing wins (rare but viral)
- **DAO/Dev** earns sustainable revenue

---

## Jackpot Seeding & Refill

### Initial Seeding

At launch, DAO seeds jackpots with:
- **Main**: 30M PLS369 (~$300k-1.5M depending on price)
- **Mini**: 10M PLS369 (~$100k-500k)

This ensures:
- Immediate excitement
- Attractive jackpot sizes from day 1
- Marketing buzz

### Ongoing Growth

Every play adds:
- **40%** to main jackpot
- **10%** to mini jackpot

After a jackpot win:
- **30%** stays in main (reset)
- **40%** stays in mini (reset)

This creates a **self-sustaining loop**:
```
Play → Jackpot grows → Win → Partial reset → Repeat
```

### Refill Strategy

If jackpots drop too low after wins:
1. DAO uses treasury revenue to reseed
2. Adds 10-20M PLS369 to main
3. Adds 3-5M PLS369 to mini
4. Announces "Super Jackpot" event for marketing

---

## Edge Cases & Protections

### Jackpot Hits on Small Pot

If main jackpot is only 1M PLS369 when hit:
- Winner gets 50% (500k)
- DAO gets 20% (200k)
- Reset keeps 30% (300k)

Game continues normally. DAO can reseed if desired.

### Multiple Jackpot Wins in Short Time

Statistically unlikely (1 in 666k), but:
- Each win reduces pot by 70%
- Jackpot resets to 30% after each
- Eventually reaches minimum viable size
- DAO reseeds to maintain excitement

### Randomness Pool Depletes

If owner forgets to top up randomness:
- Play reverts with "Randomness empty"
- Frontend warns users
- Owner calls `topUpRandomness()`
- Game resumes

---

## Long-Term Sustainability

### Revenue Streams

1. **Direct**: 4% DAO + 3% dev per play
2. **Indirect**: DAO holds treasury tokens that appreciate
3. **Future**: Governance fees, vault yields, partnerships

### Cost Structure

1. **Gas fees**: Paid by players
2. **Oracle fees**: Minimal (batched RNG)
3. **Development**: Funded by 3% dev take
4. **Marketing**: Funded by DAO treasury

### Break-Even Analysis

At 1,000 plays/day:
```
Daily revenue = 1,000 × 10 PLS369 × 7% = 700 PLS369
Monthly revenue = 21,000 PLS369

At $0.05/PLS369 = $1,050/month
At $0.10/PLS369 = $2,100/month
```

**More than enough** to cover ongoing costs and fund growth.

---

## Summary

The PLS369 Plinko game is designed with:

✅ **Sustainable house edge** (6.9%)  
✅ **Competitive RTP** (93-94%)  
✅ **Viral jackpot mechanics** (rare but huge)  
✅ **Frequent small wins** (25% hit rate)  
✅ **DAO revenue** (4% perpetual)  
✅ **Self-sustaining jackpots** (partial reset)

**The game is not designed to be beaten**, but to provide:
- Entertainment
- Fair odds
- Occasional life-changing wins
- Sustainable DAO revenue
- Long-term token distribution

**House always wins in the long run, but players have fun and a chance at glory.**

---

*For token distribution details, see [TOKENOMICS.md](./TOKENOMICS.md)*
