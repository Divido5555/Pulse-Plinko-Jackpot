# PLS369 Eternal Plinko System

## Overview

The **PLS369 Eternal Plinko** is a fully on-chain, tokenized Plinko game designed for the PLS369 DAO ecosystem. Unlike traditional casino games, this system:

- **Tokenized**: Uses PLS369 token for all gameplay (entry fees, prizes, jackpots)
- **DAO-Governed**: The DAO treasury acts as the "house" and receives 25% of all entry fees
- **Eternal & Immutable**: No upgrade hooks, no adjustable parameters, designed to run forever
- **Verifiable Randomness**: Uses Fetch Oracle RNG feed for provably fair gameplay
- **Zero PLS Usage**: No native PLS required (except gas), all payouts in PLS369

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PLS369 DAO Ecosystem                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐         ┌─────────────────────────────┐  │
│  │ PLS369Token  │────────▶│  369M Fixed Supply          │  │
│  │              │         │  - No taxes, no burns       │  │
│  │  ERC-20      │         │  - Distributed by DAO       │  │
│  └──────────────┘         └─────────────────────────────┘  │
│         │                                                    │
│         │ (players buy & hold)                              │
│         │                                                    │
│         ▼                                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          PlinkoGame369 Contract                      │  │
│  │  ┌────────────────────────────────────────────────┐ │  │
│  │  │  Entry: 10 PLS369 per play                     │ │  │
│  │  │  Split: 50% main | 15% mini | 25% DAO | 10% dev│ │  │
│  │  └────────────────────────────────────────────────┘ │  │
│  │                                                      │  │
│  │  ┌─────────────┐   ┌─────────────┐                 │  │
│  │  │ Main Jackpot│   │ Mini Jackpot│                 │  │
│  │  │ (Slot 10)   │   │ (Slot 16)   │                 │  │
│  │  └─────────────┘   └─────────────┘                 │  │
│  │                                                      │  │
│  │  Prize Slots: 3, 7, 11, 15, 18                     │  │
│  │  Loser Slots: All others                           │  │
│  └──────────────────────────────────────────────────────┘  │
│         │                                                    │
│         │ (uses Fetch Oracle RNG)                           │
│         │                                                    │
│         ▼                                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │            Fetch Oracle (RNG Feed)                   │  │
│  │  - Provides verifiable randomness                    │  │
│  │  - Expanded locally into randomness pool             │  │
│  │  - Topped up by DAO as needed                        │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Contracts

### PLS369Token.sol

**Fixed-supply ERC-20 token for the ecosystem.**

- **Total Supply**: 369,000,000 PLS369
- **Decimals**: 18
- **Features**: Standard ERC-20, no taxes, no burns
- **Distribution**: Managed off-chain by DAO

### PlinkoGame369.sol

**Eternal Plinko game contract.**

- **Entry Price**: 10 PLS369 per play (fixed)
- **Randomness**: Fetch Oracle RNG feed
- **Economy**: Token-based, no PLS required
- **Immutable**: No upgrade hooks

---

## Game Mechanics

### Entry & Payouts

**Entry Fee**: 10 PLS369 per play

**Per-Play Distribution**:
- 50% → Main Jackpot pool
- 15% → Mini Jackpot pool
- 25% → DAO Treasury (claimable)
- 10% → Dev Wallet (claimable)

### Prize Slots (20 slots, 0-indexed)

| Slot | Type | Payout |
|------|------|--------|
| 0, 1, 2 | Loser | 0x |
| **3** | **Prize** | **3.0x** |
| 4, 5, 6 | Loser | 0x |
| **7** | **Prize** | **2.0x** |
| 8, 9 | Loser | 0x |
| **10** | **Main Jackpot** | **60% of pot** |
| **11** | **Prize** | **5.0x** |
| 12, 13, 14 | Loser | 0x |
| **15** | **Prize** | **2.0x** |
| **16** | **Mini Jackpot** | **75% of pot** |
| 17 | Loser | 0x |
| **18** | **Prize** | **3.0x** |
| 19 | Loser | 0x |

### Jackpot Logic

**Main Jackpot (Slot 10)**:
- **Odds**: 1 in 166,667 (after landing on slot 10)
- **Payout**:
  - 60% → Winner
  - 30% → DAO Treasury
  - 10% → Stays in jackpot (reset)

**Mini Jackpot (Slot 16)**:
- **Odds**: 1 in 4,762 (after landing on slot 16)
- **Payout**:
  - 75% → Winner
  - 10% → Dev Wallet
  - 15% → Stays in jackpot (reset)

---

## Randomness System

The game uses **Fetch Oracle** for randomness, which provides a single RNG seed that is expanded locally into a pool of random words.

### How It Works

1. **Owner** calls `topUpRandomness(rounds)` to fetch RNG seed from oracle
2. Seed is expanded into `rounds` number of random words using `keccak256`
3. Each `play()` consumes one random word from the pool
4. When pool runs low, owner tops up again

### Advantages

- **No per-play oracle cost** (gas efficient)
- **Synchronous gameplay** (instant results)
- **Verifiable** (all randomness derived from oracle seed)
- **Scalable** (one oracle call = many plays)

### Considerations

- Requires active monitoring to keep pool topped up
- Oracle data must be <1 hour old
- Local expansion is deterministic but unpredictable

---

## Deployment

### Prerequisites

1. **Fetch Oracle Address**: RNG feed proxy on PulseChain
2. **DAO Wallet Addresses**:
   - Owner (multisig recommended)
   - DAO Treasury
   - Dev Wallet
3. **Sufficient PLS**: For deployment gas

### Steps

1. **Set Environment Variables** (see `.env.example`)
2. **Compile Contracts**:
   ```bash
   npx hardhat compile
   # or
   forge build
   ```
3. **Run Tests**:
   ```bash
   forge test -vvv
   # or
   npx hardhat test
   ```
4. **Deploy**:
   ```bash
   npx hardhat run scripts/deploy_pls369_system.ts --network pulsechain_testnet
   # or
   forge script script/DeployPLS369System.s.sol:DeployPLS369System --rpc-url $RPC --broadcast
   ```
5. **Verify Contracts** on block explorer
6. **Configure**: Seed jackpots, top up randomness
7. **Test**: Run through full gameplay cycle

See `PLS369_DEPLOYMENT_CHECKLIST.md` for detailed steps.

---

## Operational Procedures

### Initial Setup

1. **Distribute PLS369 Tokens**:
   - Transfer tokens from deployer to:
     - Liquidity Pool (for PLS/PLS369 trading)
     - DAO Treasury (long-term reserves)
     - Game Contract (for jackpot seeding)
     - Team/Contributors (vesting)

2. **Seed Jackpots**:
   ```solidity
   // As owner
   plinkoGame.seedJackpots(
     30_000_000 * 1e18,  // 30M PLS369 for main
     10_000_000 * 1e18   // 10M PLS369 for mini
   );
   ```

3. **Top Up Randomness**:
   ```solidity
   // As owner
   plinkoGame.topUpRandomness(1000);  // 1000 plays worth
   ```

### Regular Maintenance

**Daily**:
- Monitor randomness pool level
- Check Fetch Oracle data freshness
- Review play activity

**Weekly**:
- Top up randomness if needed
- Analyze game statistics
- Community updates

**Monthly**:
- DAO claims accrued rewards
- Dev claims accrued rewards
- Financial reporting

### Player Flow

1. **Acquire PLS369**:
   - Buy from DEX (PLS/PLS369 pool)
   - Receive from DAO distribution
   - Win from gameplay

2. **Approve Game Contract**:
   ```javascript
   await pls369Token.approve(gameAddress, amount);
   ```

3. **Play Game**:
   ```javascript
   await plinkoGame.play();
   ```

4. **Result**:
   - Prize slot → Instant PLS369 payout
   - Loser slot → No payout
   - Jackpot slot → Potential massive payout

---

## Frontend Integration

### Required Functionality

1. **Wallet Connection**: MetaMask or WalletConnect
2. **Token Approval**: UI for approving PLS369 spending
3. **Balance Display**: Show player PLS369 balance
4. **Game State**: Display jackpot amounts, entry price
5. **Play Button**: Send `play()` transaction
6. **Result Animation**: Puck drops to slot, shows payout
7. **History**: Recent plays, winners

### Example Code

```javascript
// Connect wallet
const provider = new BrowserProvider(window.ethereum);
const signer = await provider.getSigner();

// Get contracts
const tokenContract = new Contract(TOKEN_ADDRESS, TOKEN_ABI, signer);
const gameContract = new Contract(GAME_ADDRESS, GAME_ABI, signer);

// Check balance
const balance = await tokenContract.balanceOf(userAddress);

// Approve tokens
const approveTx = await tokenContract.approve(GAME_ADDRESS, ENTRY_PRICE);
await approveTx.wait();

// Play game
const playTx = await gameContract.play();
const receipt = await playTx.wait();

// Parse Play event
const playEvent = receipt.logs
  .map(log => gameContract.interface.parseLog(log))
  .find(event => event.name === 'Play');

const { slot, payout, mainJackpotHit, miniJackpotHit } = playEvent.args;

// Animate puck to slot
animatePuckToSlot(slot);

// Show result
if (mainJackpotHit) {
  showJackpotWin('MAIN', payout);
} else if (miniJackpotHit) {
  showJackpotWin('MINI', payout);
} else if (payout > 0) {
  showPrizeWin(payout);
} else {
  showLoss();
}
```

---

## Economics

### Token Distribution (Example)

| Allocation | Amount | Percentage | Purpose |
|------------|--------|------------|---------|
| Liquidity Pool | 147.6M | 40% | PLS/PLS369 DEX liquidity |
| DAO Treasury | 110.7M | 30% | Long-term reserves |
| Game Seeding | 55.35M | 15% | Initial jackpots |
| Team | 36.9M | 10% | Contributors (vesting) |
| Community | 18.45M | 5% | Airdrops, marketing |
| **Total** | **369M** | **100%** | Fixed supply |

### Revenue Flows

**From Gameplay**:
- DAO receives 25% of all entry fees (plus 30% of main jackpot wins)
- Dev receives 10% of all entry fees (plus 10% of mini jackpot wins)
- Main jackpot grows by 50% of entry fees
- Mini jackpot grows by 15% of entry fees

**Example (10,000 plays)**:
- Total wagered: 100,000 PLS369
- DAO earns: 25,000 PLS369 (claimable)
- Dev earns: 10,000 PLS369 (claimable)
- Main jackpot grows by: 50,000 PLS369
- Mini jackpot grows by: 15,000 PLS369

---

## Security

### Design Principles

- **Immutability**: No upgrade mechanism
- **Reentrancy Protection**: All state-changing functions protected
- **Integer Overflow**: Solidity 0.8+ (built-in checks)
- **Access Control**: Only owner can admin functions
- **Randomness**: Verifiable via Fetch Oracle

### Immutable Parameters

Once deployed, these CANNOT be changed:
- Entry price (10 PLS369)
- Split percentages (50/15/25/10)
- Jackpot payout splits
- Prize multipliers
- DAO Treasury address
- Dev Wallet address

### Admin Functions

Owner can:
- Seed jackpots (from contract balance)
- Top up randomness
- Update oracle address (if oracle migrates)
- Transfer ownership

Owner CANNOT:
- Change game rules
- Change payout percentages
- Withdraw player funds
- Modify token balances

---

## Testing

Run comprehensive test suite:

```bash
# Foundry
forge test -vvv

# Hardhat
npx hardhat test
```

**Test Coverage**:
- ✅ Token minting and transfers
- ✅ Game deployment and configuration
- ✅ Play functionality
- ✅ Prize payouts
- ✅ Jackpot wins (main and mini)
- ✅ DAO and dev reward claims
- ✅ Randomness management
- ✅ Access control
- ✅ Edge cases

---

## FAQ

**Q: Why use a token instead of PLS?**
A: Tokenization allows the DAO to build liquidity, control distribution, and create a sustainable ecosystem around the game.

**Q: Can the DAO change the game rules?**
A: No. The game is eternal and immutable. Rules are fixed at deployment.

**Q: What happens if Fetch Oracle goes down?**
A: Owner can update to a new oracle address. Existing randomness pool continues working.

**Q: How often does randomness need to be topped up?**
A: Depends on play volume. Monitor the pool and top up before it's depleted. Recommended: maintain 100+ plays worth.

**Q: Can jackpots be seeded after launch?**
A: Yes. Owner can seed jackpots at any time from the contract's PLS369 balance.

**Q: What's to prevent the owner from draining funds?**
A: Owner can only seed jackpots (which become player funds) or emergency withdraw. All player funds are protected by game logic.

---

## Resources

- **Contracts**: `/app/contracts/`
- **Tests**: `/app/tests/PLS369System.t.sol`
- **Deployment**: `/app/scripts/deploy_pls369_system.ts`
- **Checklist**: `/app/PLS369_DEPLOYMENT_CHECKLIST.md`

### Block Explorers
- Testnet: https://scan.v4.testnet.pulsechain.com
- Mainnet: https://scan.pulsechain.com

---

## License

MIT

---

**Built for the PLS369 DAO ecosystem - Eternal, immutable, and decentralized.**
