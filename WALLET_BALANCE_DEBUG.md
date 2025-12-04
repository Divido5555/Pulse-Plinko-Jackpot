# Wallet Balance Debugging Guide

## Issue
Wallet connects successfully but balance shows 0.00 even though wallet has PLS369 tokens.

## What to Check

### 1. Open Browser Console (F12)
When you connect your wallet, you should see these logs in order:

**Step 1: Wallet Connection Request**
```
🔌 Creating BrowserProvider from window.ethereum...
✅ BrowserProvider created: [object]
```

**Step 2: Signer Creation**
```
🖊️ Getting signer...
✅ Signer obtained: [object]
Signer address: 0x4890...fe8b (your wallet address)
```

**Step 3: Contract Initialization**
```
📄 Initializing contracts with signer...
✅ Contracts initialized: { token: Contract, game: Contract }
```

**Step 4: Balance Fetching (CRITICAL)**
```
💰 fetchBalance called: { address: "0x4890...", hasContract: true }
📊 Calling balanceOf for address: 0x4890...fe8b
Raw balance: 368988914700000000000000000
Formatted balance: 368988914.70
```

### 2. What Each Log Means

**If you see:**
```
✅ BrowserProvider created
✅ Signer obtained
✅ Contracts initialized
💰 fetchBalance called
```
But balance still shows 0.00:

**Possible causes:**
1. Contract address is wrong
2. Not on PulseChain (Chain ID 369)
3. RPC connection issue
4. Token contract not responding

### 3. Manual Balance Check

Run this in browser console after connecting:

```javascript
// Check if wallet is connected
console.log('Account:', account);

// Check if on PulseChain
ethereum.request({ method: 'eth_chainId' })
  .then(id => console.log('Chain ID:', parseInt(id, 16)));
// Should return: 369

// Manually fetch balance
const { BrowserProvider, Contract, formatUnits } = window.ethers;
const provider = new BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
const address = await signer.getAddress();
console.log('Your address:', address);

const tokenAbi = [
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
];

const tokenContract = new Contract(
  '0x55aC731aAa3442CE4D8bd8486eE4521B1D6Af5EC',
  tokenAbi,
  signer
);

const bal = await tokenContract.balanceOf(address);
console.log('Raw balance:', bal.toString());
console.log('Formatted:', formatUnits(bal, 18));
```

### 4. Common Issues & Solutions

#### Issue 1: "❌ Missing contract or address"
**Cause:** Contracts not initialized properly  
**Solution:** Check console for initialization errors

#### Issue 2: Balance fetches but UI shows 0.00
**Cause:** State not updating  
**Check:** Look for "Formatted balance: X.XX" in logs  
**Solution:** If formatted balance is correct, it's a React state issue

#### Issue 3: "Error fetching balance: execution reverted"
**Cause:** Wrong network or contract address  
**Solution:** 
- Verify on Chain ID 369 (PulseChain)
- Check contract exists: https://scan.pulsechain.com/address/0x55aC731aAa3442CE4D8bd8486eE4521B1D6Af5EC

#### Issue 4: Balance shows but can't play
**Cause:** Balance might be parsing as string incorrectly  
**Check console for:**
```
Balance check: { balanceWei: "...", entryPriceWei: "..." }
```

### 5. Verification Checklist

Run through this when wallet connects:

- [ ] Wallet popup appeared and was approved
- [ ] Address shows in "Connect Wallet" button (0x1234...5678)
- [ ] Browser console shows "✅ Signer obtained"
- [ ] Browser console shows "✅ Contracts initialized"
- [ ] Browser console shows "💰 fetchBalance called"
- [ ] Browser console shows "Formatted balance: X.XX"
- [ ] UI "PLS369 Balance" shows your balance
- [ ] "Contract Stats" shows Total Plays > 0
- [ ] Network indicator doesn't say "Wrong network"

### 6. If Balance Still Shows 0.00

**Try these in order:**

1. **Disconnect and Reconnect**
   - Click your address in top right
   - Disconnect
   - Refresh page
   - Connect again

2. **Clear Cache**
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - Or clear browser cache

3. **Switch Networks**
   - Switch to Ethereum mainnet
   - Switch back to PulseChain
   - Should trigger balance refresh

4. **Check Token Balance on Explorer**
   - Go to: https://scan.pulsechain.com/address/YOUR_ADDRESS
   - Find PLS369 token (0x55aC731aAa3442CE4D8bd8486eE4521B1D6Af5EC)
   - Verify you actually have tokens

5. **Try Different Wallet**
   - If using MetaMask, try Safe
   - If using Safe, try MetaMask
   - Isolates wallet-specific issues

### 7. What to Share for Debug

If balance still doesn't work, share these:

1. **Console logs** (copy all text from console)
2. **Your wallet address** (so we can verify on explorer)
3. **Chain ID** (from console: `await ethereum.request({ method: 'eth_chainId' })`)
4. **Token balance from explorer** (scan.pulsechain.com)
5. **Screenshots** of:
   - Console logs
   - UI showing 0.00 balance
   - PulseChain explorer showing your token balance

### 8. Expected Console Output

When everything works correctly, you should see:

```
🌍 Environment Information:
- Origin: https://pulse369-plinko.preview.emergentagent.com
- Hostname: pulse369-plinko.preview.emergentagent.com
- Protocol: https:
- window.ethereum available: true
- MetaMask provider: true
- Contract addresses: {token: 0x55aC..., game: 0xFBF...}

🔌 Creating BrowserProvider from window.ethereum...
✅ BrowserProvider created
🖊️ Getting signer...
✅ Signer obtained
Signer address: 0x4890...fe8b
📄 Initializing contracts with signer...
✅ Contracts initialized: {token: Contract, game: Contract}
💰 fetchBalance called: {address: "0x4890...", hasContract: true}
📊 Calling balanceOf for address: 0x4890...fe8b
Raw balance: 368988914700000000000000000
Formatted balance: 368988914.70
Blockchain state updated: {
  mainJackpot: "1532.00",
  miniJackpot: "8762.30",
  playCount: 33,
  entryPrice: "10.00"
}
```

Then UI should show:
- **PLS369 Balance:** 368988914.70
- **Total Plays:** 33
- **Entry Price:** 10 PLS369
- **Main Jackpot:** 1532.00
- **Mini Jackpot:** 8762.30

### 9. Quick Test

To verify the fix worked, run this immediately after connecting:

```javascript
// Should show your balance
console.log('React state balance:', window.balance);

// Should match contract
const { BrowserProvider, Contract, formatUnits } = window.ethers;
const provider = new BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
const tokenContract = new Contract(
  '0x55aC731aAa3442CE4D8bd8486eE4521B1D6Af5EC',
  [{
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }],
  signer
);
const address = await signer.getAddress();
const bal = await tokenContract.balanceOf(address);
console.log('Contract balance:', formatUnits(bal, 18));
```

Both should match!
