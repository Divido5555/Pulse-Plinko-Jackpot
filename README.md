# PulseChain Plinko - Decentralized Gaming Platform

A beautiful, decentralized Plinko game built on PulseChain 369 with dual jackpot system and PulseChain ecosystem token branding.

## 🎮 Features

### Game Mechanics
- **Entry Fee**: 1 PLS (~$1) per game
- **20 Slots**: 5 prize slots with ecosystem token branding, 15 empty slots
- **Prize Multipliers**:
  - INCENTIVE: 1.1x (12% odds)
  - PulseX: 1.5x (4% odds)  
  - Medium: 2.0x (3.5% odds)
  - HEX: 3.0x (1.3% odds)
  - PULSE: 5.0x (0.38% odds)

### Jackpot System
- **Main Jackpot** (~$1M target):
  - Odds: 1 in 1.2M plays
  - Payout: 60% winner, 10% burn, 10% host, 10% dev, 10% reset
  
- **Mini Jackpot** (~$10k target):
  - Odds: 1 in 53k plays
  - Payout: 80% winner, 10% host, 10% reset

### Distribution Model
Per $1 play:
- 32% → Base prize pool
- 50% → Main jackpot accumulation
- 15% → Mini jackpot accumulation
- 5% → Host wallet (paid every 1000 plays)

### Tech Stack
- **Frontend**: React 19, Framer Motion, Tailwind CSS, Shadcn UI
- **Backend**: FastAPI (Python), MongoDB
- **Blockchain**: PulseChain 369 (Smart Contract in Solidity)
- **AI**: GPT-5 for game insights and analytics

## 🚀 Quick Start

### Access the Game
- **Game**: https://plinko-jackpot.preview.emergentagent.com
- **Admin Dashboard**: https://plinko-jackpot.preview.emergentagent.com/admin

### Smart Contract
Located at `/contracts/PlinkoGame.sol`

**Important**: The contract needs to be deployed to PulseChain 369. Use Remix or Hardhat for deployment.

### Wallet Addresses
- **Dev Wallet**: `0x4890Be41BCe2E924C3aC4A1EFDC4a465F023Fe8B`
- **Host Wallet**: `0x8855DEc7627CF4A23A2354F998Dfd57C500A8C51`
- **Burn Address**: `0x000000000000000000000000000000000000dEaD`

## 🎨 Features

✅ Beautiful Plinko board with animated ball physics
✅ 20 slots featuring PulseChain ecosystem tokens (HEX, PULSE, PulseX, INCENTIVE)
✅ Real-time jackpot displays (Main & Mini)
✅ Admin dashboard with analytics
✅ AI-powered insights using GPT-5
✅ Responsive design with modern UI
✅ Toast notifications for wins/losses
✅ Game statistics and history

## 📊 How It Works

1. **Entry**: Player pays 1 PLS (~$1) to play
2. **Ball Drop**: Animated ball bounces through pegs
3. **Landing**: Ball lands in one of 20 slots
4. **Prizes**: 
   - Token slots: Win 1.1x to 5x multipliers
   - Empty slots: No payout, jackpot grows
   - Jackpot slots: Ultra-rare chance for massive wins

## 🔐 Security Notes

**Current Version (Demo)**:
- Uses simplified random number generation
- Mock blockchain interactions
- No actual wallet connection

**For Production**:
- Integrate Chainlink VRF for fair randomness
- Add MetaMask/WalletConnect
- Deploy and verify smart contract
- Complete security audit
- Add rate limiting and anti-bot measures

## 🌟 Ecosystem Marketing

This game serves as advertising for PulseChain ecosystem:
- Every slot features a major PulseChain token
- Players engage with the ecosystem through gameplay
- Large jackpots attract attention to PulseChain 369
- Viral potential through social sharing

## 💡 Next Steps

To make this production-ready:

1. **Deploy Smart Contract**
   ```bash
   # Use Remix IDE or Hardhat
   # Deploy to PulseChain 369 testnet first
   # Update CONTRACT_ADDRESS in backend/.env
   ```

2. **Add Wallet Integration**
   - Install Web3.js or Ethers.js in frontend
   - Add MetaMask connection button
   - Replace mock transactions with real ones

3. **Test Thoroughly**
   - Test on PulseChain testnet
   - Verify all payout calculations
   - Check jackpot distribution logic

4. **Launch**
   - Deploy to mainnet
   - Market to PulseChain community
   - Monitor and adjust parameters

## 🎯 Revenue Model

- **Host Earnings**: 5% of all plays + 10% of each jackpot win
- **Dev Earnings**: 10% of Main jackpot wins
- **Sustainability**: Jackpots only pay out 60-80%, keeping pools funded

---

**Built with ❤️ for PulseChain ecosystem**
