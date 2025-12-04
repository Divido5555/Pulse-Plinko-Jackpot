# PulseChain Mainnet Integration - Test Plan

## ✅ Completed Implementation

### 1. Smart Contract Configuration
- Created `/app/frontend/src/config/contracts.js` with:
  - Contract addresses (PLS369 Token & PlinkoGame369)
  - Complete ABIs for both contracts
  - PulseChain network configuration

### 2. Wallet Integration
- Created `/app/frontend/src/hooks/useWallet.js` with:
  - Universal EIP-1193 wallet support (MetaMask, Safe, Rainbow, Coinbase Wallet, etc.)
  - Automatic PulseChain network detection
  - Auto-add PulseChain network if not present
  - Token balance fetching from blockchain
  - Approval flow handling
  - Play function integration with event parsing

### 3. UI Updates
- Updated slot configuration from 24 to 20 slots (matching contract)
- Updated entry price display: "10 PLS369" (not 10,000 PLS)
- Updated prize slot information: "Slots 3,7,11,15,18"
- Updated jackpot slot information: "Slots 10 (Main), 2 & 16 (Mini)"
- Added "Connect Wallet" button in top right
- Updated balance display to show real PLS369 balance from blockchain
- Updated jackpot displays to show real values from `getGameState()`

### 4. Game Logic Integration
- Removed all mock data and hardcoded values
- Integrated play button with smart contract `play()` function
- Parse `Play` event from transaction receipt to get:
  - Slot number (authoritative, from blockchain)
  - Payout amount
  - Main jackpot hit status
  - Mini jackpot hit status
- Ball animation now uses blockchain-determined slot
- Real-time balance updates after each play

## 🧪 Manual Testing Required

### Prerequisites
1. **Wallet Setup:**
   - Any EIP-1193 compatible wallet (MetaMask, Safe, Rainbow, etc.)
   - Wallet configured for PulseChain Mainnet (or will be auto-configured)
   - PLS in wallet for gas fees
   - PLS369 tokens in wallet (minimum 10 tokens to play)

2. **Contract Addresses:**
   - PLS369 Token: `0x55aC731aAa3442CE4D8bd8486eE4521B1D6Af5EC`
   - PlinkoGame369: `0xFBF81bFA463252e25C8883ac0E3EBae99617A52c`

### Test Cases

#### TC1: Wallet Connection
**Steps:**
1. Navigate to game page
2. Click "Connect Wallet" button
3. Select your wallet from the browser extension
4. Approve connection in wallet

**Expected Results:**
- Wallet connects successfully
- Button changes to show truncated address (e.g., "0x1234...5678")
- PLS369 balance displays correctly
- If not on PulseChain, network switch prompt appears

#### TC2: Network Auto-Configuration
**Steps:**
1. Connect wallet on a different network (e.g., Ethereum mainnet)
2. Observe the network detection

**Expected Results:**
- "Switch to PulseChain" button appears
- Clicking button triggers wallet to switch/add PulseChain
- If network not added, wallet prompts to add with correct config:
  - Chain ID: 369 (0x171)
  - RPC: https://rpc.pulsechain.com
  - Explorer: https://scan.pulsechain.com

#### TC3: Token Approval Flow
**Steps:**
1. Connect wallet with PLS369 tokens (first time playing)
2. Drag and release puck to play
3. Wallet prompts for approval

**Expected Results:**
- Approval transaction prompt appears
- Shows approving contract to spend PLS369
- After approval confirmation, game proceeds
- Subsequent plays don't require approval (until allowance depleted)

#### TC4: Playing the Game
**Steps:**
1. Ensure wallet connected and has sufficient PLS369 (≥10 tokens)
2. Drag puck and release to drop
3. Wait for transaction confirmation

**Expected Results:**
- Transaction submitted to blockchain
- "Playing..." toast notification appears
- After ~3-5 seconds (block confirmation), puck drops
- Ball lands in slot determined by blockchain (from Play event)
- Balance updates with payout (if any)
- Jackpots update to new values
- Session stats update correctly

#### TC5: Insufficient Balance
**Steps:**
1. Connect wallet with <10 PLS369 tokens
2. Try to play

**Expected Results:**
- Error toast: "Insufficient balance - You need at least 10 PLS369 to play"
- Transaction does not proceed

#### TC6: Transaction Rejection
**Steps:**
1. Try to play
2. Reject transaction in wallet

**Expected Results:**
- Error toast: "Transaction rejected - You cancelled the transaction"
- Session stats revert
- No balance change

#### TC7: Jackpot Display
**Steps:**
1. Connect wallet
2. Observe jackpot values in header

**Expected Results:**
- MINI jackpot displays value from `getGameState().miniJackpot`
- MAIN jackpot displays value from `getGameState().mainJackpot`
- Values update every 30 seconds
- Values update immediately after playing

#### TC8: Prize Slots
**Steps:**
1. Play multiple times
2. Observe results when landing on slots 3, 7, 11, 15, or 18

**Expected Results:**
- Slot 3: 3x payout (30 PLS369)
- Slot 7: 2x payout (20 PLS369)
- Slot 11: 5x payout (50 PLS369)
- Slot 15: 2x payout (20 PLS369)
- Slot 18: 2x payout (20 PLS369)
- Balance increases by correct amount
- Win notification displays

#### TC9: Jackpot Slots
**Steps:**
1. Play and land on slot 10 (Main) or slots 2/16 (Mini)
2. Observe result (most likely won't trigger due to 1:33,333 and 1:4,762 odds)

**Expected Results:**
- If jackpot DOESN'T trigger (most common):
  - No payout
  - "Try again!" message
- If jackpot DOES trigger (extremely rare):
  - Large payout (50% of jackpot pool)
  - "JACKPOT WON!" banner
  - Jackpot pool resets to 30-40% of original value

#### TC10: Wallet Disconnect
**Steps:**
1. Connect wallet
2. Click address button in top right
3. Select disconnect

**Expected Results:**
- Wallet disconnects
- Button changes back to "Connect Wallet"
- Balance shows 0.00
- Jackpots may show 0.00 (or last cached value)

## 🐛 Known Limitations

1. **Randomness Pool:** The game requires the contract owner to periodically top up the randomness pool. If depleted, players will see: "Game temporarily unavailable - Randomness pool needs to be refilled."

2. **Gas Costs:** Each play transaction requires PLS for gas (typically 100,000-200,000 gas units).

3. **Transaction Speed:** Game outcome depends on PulseChain block confirmation (typically 3-5 seconds).

## 🔍 Debugging

### Check Contract State
```javascript
// In browser console after connecting wallet
const gameState = await window.gameContract.getGameState();
console.log({
  mainJackpot: ethers.formatUnits(gameState._mainJackpot, 18),
  miniJackpot: ethers.formatUnits(gameState._miniJackpot, 18),
  playCount: gameState._playCount.toString(),
  entryPrice: ethers.formatUnits(gameState._entryPrice, 18),
});
```

### Check Token Balance
```javascript
// In browser console after connecting wallet
const balance = await window.tokenContract.balanceOf(window.account);
console.log('Balance:', ethers.formatUnits(balance, 18));
```

### Check Allowance
```javascript
// In browser console after connecting wallet
const allowance = await window.tokenContract.allowance(
  window.account,
  '0xFBF81bFA463252e25C8883ac0E3EBae99617A52c'
);
console.log('Allowance:', ethers.formatUnits(allowance, 18));
```

## ✅ Integration Verification Checklist

- [ ] Wallet connects successfully (any EIP-1193 wallet)
- [ ] PulseChain network auto-adds when missing
- [ ] PLS369 balance displays correctly
- [ ] Jackpot values fetch from blockchain
- [ ] Approval flow works correctly
- [ ] Play transaction submits successfully
- [ ] Play event parsed correctly
- [ ] Ball lands in blockchain-determined slot
- [ ] Payouts calculated correctly
- [ ] Balance updates after play
- [ ] Jackpots update after play
- [ ] Session stats track correctly
- [ ] Error handling works (insufficient balance, rejected tx, etc.)
- [ ] Disconnect works correctly
