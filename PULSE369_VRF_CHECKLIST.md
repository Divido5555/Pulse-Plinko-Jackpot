# PULSE369 VRF CHECKLIST

## Deployment Information

### Contract Addresses
- **PlinkoGameVRF**: `[TO BE FILLED AFTER DEPLOYMENT]`
- **Anyrand VRF**: `[TO BE FILLED]`
- **Fetch Oracle**: `[TO BE FILLED]`
- **Network**: PulseChain Testnet (Chain ID: 943)

### Wallet Addresses
- **Dev Wallet**: `[TO BE FILLED]`
- **Host Wallet**: `[TO BE FILLED]`
- **Burn Wallet**: `[TO BE FILLED]`
- **Treasury Wallet**: `[TO BE FILLED]`

---

## Pre-Deployment Checklist

- [ ] Set up `.env` file with required addresses:
  ```
  FETCH_ORACLE_ADDRESS=0x...
  ANYRAND_ADDRESS=0x...
  DEV_WALLET=0x...
  HOST_WALLET=0x...
  BURN_WALLET=0x...
  TREASURY_WALLET=0x...
  ```

- [ ] Verify contract compiles without errors:
  ```bash
  # For Hardhat
  npx hardhat compile
  
  # For Foundry
  forge build
  ```

- [ ] Run tests:
  ```bash
  # For Foundry
  forge test -vvv
  
  # For Hardhat
  npx hardhat test
  ```

- [ ] Fund deployer wallet with sufficient PLS for:
  - Gas fees (~0.1 PLS)
  - Initial contract balance (optional)

---

## Deployment Steps

### Using Hardhat
```bash
npx hardhat run scripts/deploy_vrf.ts --network pulsechain_testnet
```

### Using Foundry
```bash
forge script script/DeployPlinkoVRF.s.sol:DeployPlinkoVRF --rpc-url $PULSECHAIN_TESTNET_RPC --broadcast --verify
```

---

## Post-Deployment Checklist

- [ ] Verify contract on block explorer
- [ ] Update frontend `.env` with deployed address:
  ```
  REACT_APP_PLINKO_VRF_ADDRESS=0x...
  ```

- [ ] Test contract functions:
  - [ ] `getPLSPrice()` returns valid price
  - [ ] `getMinEntryPls()` returns reasonable entry amount
  - [ ] `getCurrentEntryRequirements()` works
  - [ ] `play()` successfully requests VRF
  - [ ] VRF fulfillment completes within expected time

- [ ] Fund contract with initial jackpot (optional):
  ```bash
  # Send PLS directly to contract address
  ```

---

## Frontend Setup

### Install Dependencies
```bash
cd frontend
yarn install
# or
npm install
```

### Configure Environment
Create/update `frontend/.env`:
```
REACT_APP_PLINKO_VRF_ADDRESS=0x... # Deployed contract address
REACT_APP_BACKEND_URL=http://localhost:8001 # Backend API
```

### Run Frontend
```bash
yarn start
# or
npm start
```

Frontend will be available at `http://localhost:3000`

---

## Testing the Game

### Manual Test Flow

1. **Connect Wallet**
   - Click "Connect Wallet" button
   - Approve MetaMask connection
   - Ensure you're on PulseChain Testnet

2. **Check Entry Requirements**
   - View current entry price (should be ~$1 USD in PLS)
   - View VRF fee amount
   - Ensure wallet has sufficient balance

3. **Play Game**
   - Click "Play" button
   - Approve transaction in MetaMask
   - Wait for transaction confirmation (status: "requesting")
   - UI should show "Waiting for VRF..." (status: "waiting_vrf")
   - Wait for VRF fulfillment (typically 10-30 seconds)
   - Puck animates to resolved slot
   - Result displayed (win/lose/jackpot)

4. **Verify Results**
   - Check player balance updated correctly
   - Verify jackpot amounts updated
   - Check play count incremented
   - View transaction on block explorer

### Expected UI States

- **Idle**: Initial state, "Play" button enabled
- **Requesting**: Transaction being sent, loading indicator
- **Waiting VRF**: Transaction confirmed, waiting for randomness
- **Resolved**: Result shown, puck animated to slot
- **Error**: Error message displayed, user can retry

---

## VRF Fulfillment Process

### How It Works
1. Player calls `play()` → contract requests randomness from anyrand
2. Anyrand VRF processes request (uses drand beacon)
3. Anyrand calls back `receiveRandomness()` with random value
4. Contract resolves play result
5. `PlayResolved` event emitted
6. Frontend listens for event and updates UI

### Expected Timeline
- Transaction confirmation: 3-5 seconds
- VRF fulfillment: 10-30 seconds
- Total time: ~15-35 seconds per play

### Troubleshooting VRF Issues

**If VRF fulfillment times out:**
- Check anyrand service status
- Verify sufficient VRF fee was paid
- Check contract has enough balance for payouts
- Review event logs on block explorer

**If randomness seems non-random:**
- Anyrand uses drand (distributed randomness beacon)
- Verify anyrand address is correct
- Check drand network status

---

## Host Panel Features

The frontend should display:
- Current host wallet address
- Accumulated host fees
- Host payout schedule (every 1000 plays)
- Plays until next host payout

---

## Monitoring & Analytics

### Key Metrics to Track
- Total plays
- Main jackpot size
- Mini jackpot size
- Average play frequency
- VRF fulfillment success rate
- Average fulfillment time
- Win/lose ratio

### Event Monitoring
Subscribe to contract events:
- `PlayRequested` - New play initiated
- `PlayResolved` - Play completed
- `MainJackpotWon` - Main jackpot hit
- `MiniJackpotWon` - Mini jackpot hit
- `HostPaid` - Host received payout

---

## Security Considerations

- [ ] All wallets use hardware wallet or secure key management
- [ ] Contract ownership transferred to multisig (if applicable)
- [ ] Oracle data freshness validated (max 1 hour old)
- [ ] VRF randomness source verified (anyrand + drand)
- [ ] Emergency withdraw function tested
- [ ] Contract balance monitoring set up

---

## Mainnet Deployment Notes

### Before Mainnet Launch:
- [ ] Complete extensive testnet testing (minimum 100+ plays)
- [ ] Audit contract code (recommended)
- [ ] Test with real USD value entry amounts
- [ ] Verify oracle provides accurate PLS/USD prices
- [ ] Test emergency procedures
- [ ] Set up monitoring and alerts
- [ ] Prepare incident response plan

### Mainnet Considerations:
- Higher VRF fees on mainnet
- Potential oracle data delay during high volatility
- Plan for jackpot seeding
- Community announcement and marketing
- Customer support setup

---

## Support & Resources

- **Anyrand Documentation**: https://docs.anyrand.network
- **Tellor (Fetch Oracle) Docs**: https://docs.tellor.io
- **PulseChain Testnet Explorer**: https://scan.v4.testnet.pulsechain.com
- **PulseChain Mainnet Explorer**: https://scan.pulsechain.com

---

## Known Issues & Limitations

- VRF fulfillment time varies (10-30 seconds typical)
- Oracle data updates may lag during high volatility
- Entry price adjusts with PLS/USD price changes
- Testnet VRF may be slower than mainnet

---

## Changelog

### v1.0.0 - Initial VRF Implementation
- Added anyrand VRF integration
- Implemented Fetch Oracle for PLS/USD pricing
- Dynamic entry fee calculation (~$1 USD)
- Async play flow with VRF fulfillment
- Frontend hooks and utilities
- Test suite with mock VRF and oracle

---

**Last Updated**: [DATE]
**Status**: ⏳ Pending Deployment
