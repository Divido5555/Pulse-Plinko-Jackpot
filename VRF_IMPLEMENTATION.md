# VRF + Oracle Implementation Guide

## Overview

This document describes the implementation of VRF (Verifiable Random Function) and price oracle integration for the Pulse369 Plinko game.

## Architecture

```
┌─────────────────┐
│   Frontend      │
│   (React)       │
└────────┬────────┘
         │
         │ 1. play() with PLS payment
         ▼
┌─────────────────┐
│ PlinkoGameVRF   │
│  Smart Contract │
└────────┬────────┘
         │
         │ 2. Request randomness
         ▼
┌─────────────────┐       ┌─────────────────┐
│  Anyrand VRF    │       │  Fetch Oracle   │
│  (drand-based)  │       │  (PLS/USD)      │
└────────┬────────┘       └────────┬────────┘
         │                         │
         │ 3. Callback             │ Price data
         │    receiveRandomness()  │
         ▼                         ▼
┌─────────────────┐       ┌─────────────────┐
│ Resolve Play    │◄──────│  Calculate      │
│ Determine Slot  │       │  Entry Fee      │
│ Process Payout  │       │  (~$1 USD)      │
└────────┬────────┘       └─────────────────┘
         │
         │ 4. PlayResolved event
         ▼
┌─────────────────┐
│   Frontend      │
│  Update UI      │
│  Animate Puck   │
└─────────────────┘
```

## Key Components

### 1. PlinkoGameVRF.sol

The main game contract with:
- **VRF Integration**: Uses anyrand for verifiable randomness
- **Oracle Integration**: Fetches PLS/USD price for dynamic entry fee
- **Async Game Flow**: Play request → VRF callback → Result
- **Jackpot Logic**: Identical to original PlinkoGame.sol

### 2. Frontend Integration

**Files Created:**
- `src/config/contracts.js` - Contract ABI and address
- `src/lib/web3.js` - Web3 provider utilities
- `src/hooks/usePlinkoVRF.js` - React hook for contract interaction

**Key Features:**
- Wallet connection (MetaMask)
- Dynamic entry price display
- VRF request status tracking
- Event listening for play resolution
- Puck animation on result

### 3. Deployment Scripts

**Hardhat**: `scripts/deploy_vrf.ts`
**Foundry**: `script/DeployPlinkoVRF.s.sol`

Both scripts:
- Load environment variables
- Deploy contract with proper addresses
- Log deployment details
- Provide next steps

### 4. Test Suite

`tests/PlinkoGameVRF.t.sol`

Tests cover:
- Basic deployment
- Oracle price fetching
- Play request and VRF fulfillment
- Jackpot wins and payouts
- Host payout after 1000 plays
- Emergency functions

## Technical Details

### VRF Flow

1. **Player Initiates Play**
   ```javascript
   const tx = await contract.play(callbackGasLimit, {
     value: totalRequired
   });
   ```

2. **Contract Requests Randomness**
   ```solidity
   requestId = anyrandVRF.requestRandomness{value: vrfFee}(
     callbackGasLimit,
     1 // numWords
   );
   ```

3. **VRF Callback**
   ```solidity
   function receiveRandomness(
     uint256 requestId,
     uint256[] calldata randomWords
   ) external {
     // Resolve play using randomWords[0]
   }
   ```

4. **Event Emitted**
   ```solidity
   emit PlayResolved(player, requestId, slot, payout, isJackpot);
   ```

### Oracle Integration

**Dynamic Entry Fee:**
```solidity
function getMinEntryPls() public view returns (uint256) {
  uint256 plsPrice = getPLSPrice(); // From Fetch Oracle
  return (TARGET_ENTRY_USD * 1e18) / plsPrice;
}
```

**Price Query:**
```solidity
bytes32 PLS_USD_QUERY_ID = keccak256(
  abi.encode("SpotPrice", abi.encode("pls", "usd"))
);

(bytes memory value, uint256 timestamp) = fetchOracle.getDataBefore(
  PLS_USD_QUERY_ID,
  block.timestamp
);
```

### Gas Optimization

- Single VRF request per play (1 random word)
- Efficient payout calculations
- Event-driven frontend updates (no polling)
- Minimal storage writes

## Configuration

### Environment Variables

**Backend/Deployment:**
```bash
FETCH_ORACLE_ADDRESS=0x...    # Fetch Oracle contract
ANYRAND_ADDRESS=0x...          # Anyrand VRF contract
DEV_WALLET=0x...               # Developer wallet
HOST_WALLET=0x...              # Host wallet
BURN_WALLET=0x...              # Burn address
TREASURY_WALLET=0x...          # Treasury wallet
```

**Frontend:**
```bash
REACT_APP_PLINKO_VRF_ADDRESS=0x...  # Deployed game contract
REACT_APP_BACKEND_URL=...            # Backend API URL
```

### VRF Parameters

```javascript
const VRF_CONFIG = {
  callbackGasLimit: 300000,  // Gas for callback
  maxWaitTime: 60000,        // 60 seconds timeout
  pollInterval: 2000,        // Poll every 2 seconds
};
```

## Differences from Original Contract

| Feature | Original PlinkoGame.sol | New PlinkoGameVRF.sol |
|---------|------------------------|----------------------|
| Randomness | Pseudo-random (block hash) | VRF (anyrand/drand) |
| Entry Fee | Fixed (1 PLS) | Dynamic (~$1 USD via oracle) |
| Game Flow | Synchronous | Asynchronous (VRF callback) |
| Price Feed | None | Fetch Oracle (Tellor-based) |
| Verifiability | Not verifiable | Fully verifiable (VRF) |

## Security Considerations

### VRF Security
- ✅ Randomness is verifiable (drand-based)
- ✅ Cannot be manipulated by miners
- ✅ Deterministic given beacon output
- ⚠️ Ensure sufficient VRF fee paid
- ⚠️ Monitor VRF service uptime

### Oracle Security
- ✅ Price data from Tellor (decentralized)
- ✅ Staleness check (max 1 hour old)
- ✅ Price validation (must be > 0)
- ⚠️ Monitor oracle data quality
- ⚠️ Consider adding multiple oracle sources

### Contract Security
- ✅ Reentrancy protection (CEI pattern)
- ✅ Integer overflow protection (Solidity 0.8+)
- ✅ Access control (owner-only functions)
- ✅ Emergency withdraw function
- ⚠️ Recommend professional audit before mainnet

## Testing Strategy

### Unit Tests
- Mock VRF and oracle
- Test all game logic paths
- Verify payout calculations
- Check jackpot accumulation

### Integration Tests
- Deploy to testnet
- Test with real VRF service
- Verify oracle data accuracy
- Monitor gas costs

### E2E Tests
- Full user flow from frontend
- Multiple concurrent plays
- Edge cases (low balance, network issues)
- VRF timeout handling

## Performance Metrics

### Expected Performance
- Transaction confirmation: 3-5 seconds
- VRF fulfillment: 10-30 seconds
- Total play time: 15-35 seconds
- Gas cost: ~300,000 gas (entry + VRF)

### Monitoring
- Track VRF fulfillment success rate
- Monitor average fulfillment time
- Alert on oracle data staleness
- Track jackpot growth rate

## Troubleshooting

### VRF Not Fulfilling
1. Check anyrand service status
2. Verify VRF fee is sufficient
3. Check callback gas limit is adequate
4. Review contract balance for payouts

### Incorrect Entry Price
1. Verify oracle address is correct
2. Check oracle data freshness
3. Confirm PLS/USD query ID matches
4. Review price calculation logic

### Frontend Not Updating
1. Check event listener is active
2. Verify contract address in config
3. Ensure wallet is connected
4. Check network matches contract

## Future Enhancements

- [ ] Multiple VRF providers (fallback)
- [ ] Multiple price oracles (median)
- [ ] Layer 2 support (lower fees)
- [ ] Advanced statistics dashboard
- [ ] Provably fair verification UI
- [ ] Replay protection enhancements

## Resources

- **Anyrand Docs**: https://docs.anyrand.network
- **Tellor Docs**: https://docs.tellor.io
- **Drand**: https://drand.love
- **PulseChain**: https://pulsechain.com

## Support

For issues or questions:
1. Check PULSE369_VRF_CHECKLIST.md
2. Review test cases in tests/PlinkoGameVRF.t.sol
3. Consult anyrand/Tellor documentation
4. Contact development team

---

**Version**: 1.0.0
**Last Updated**: [DATE]
**Status**: Ready for Testnet Deployment
