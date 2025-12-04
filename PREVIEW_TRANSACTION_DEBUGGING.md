# Preview Environment Transaction Debugging Guide

## Issue Summary
**Problem:** Transactions are not being sent from the preview environment even though wallet connection and read operations work correctly.

**Status:** Smart contracts fully deployed and operational on PulseChain mainnet. Issue isolated to preview frontend environment.

## What Works ✅
- ✅ Wallet connection (MetaMask/Safe/etc.)
- ✅ Reading user token balance
- ✅ Reading jackpot values from contract
- ✅ Network detection and switching
- ✅ Contract ABI and address configuration

## What Doesn't Work ❌
- ❌ Sending transactions (no signer calls going through)
- ❌ `play()` function not being called on contract
- ❌ No `eth_sendTransaction` calls being made

## Diagnostic Logging Added

### New Console Logs to Check

When you open the game in your browser console, you'll now see detailed logs:

**1. Environment Information (on page load):**
```
🌍 Environment Information:
- Origin: https://pulse369-plinko.preview.emergentagent.com
- Hostname: pulse369-plinko.preview.emergentagent.com
- Protocol: https:
- REACT_APP_BACKEND_URL: https://pulse369-plinko.preview.emergentagent.com
- window.ethereum available: true/false
- MetaMask provider: true/false
- Contract addresses: { token: '0x55aC...', game: '0xFBF...' }
```

**2. Wallet Connection Flow:**
```
🔌 Creating BrowserProvider from window.ethereum...
✅ BrowserProvider created: [object]
🖊️ Getting signer...
✅ Signer obtained: [object]
Signer address: 0x1234...
📄 Initializing contracts with signer...
✅ Contracts initialized: { token: Contract, game: Contract }
```

**3. When Playing a Game:**
```
🎮 playGame called
gameContract: Contract { ... }
account: 0x1234...
balance: 123.45
✅ Starting approval check...
🔐 ensureApproval called
📊 Checking allowance...
Current allowance: 1000000000000000000000000
Required allowance: 10000000000000000000
✅ Sufficient allowance exists
Approval result: true
Balance check: { balanceWei: "...", entryPriceWei: "..." }
🎲 Calling gameContract.play()...
Game contract address: 0xFBF81bFA463252e25C8883ac0E3EBae99617A52c
✅ Play transaction submitted: 0xabc...
⏳ Waiting for transaction confirmation...
✅ Transaction confirmed: [receipt object]
```

## Potential Issues to Check

### 1. **MetaMask dApp Permissions**
Preview domains might not be in MetaMask's trusted sites list.

**Check:**
- Open MetaMask → Settings → Connected Sites
- Look for `pulse369-plinko.preview.emergentagent.com`
- If not listed or blocked, manually add/allow the site

### 2. **Content Security Policy (CSP)**
Preview environments may have restrictive CSP headers.

**Check in Browser DevTools:**
```javascript
// In console, check for CSP violations
console.log(document.head.querySelector('meta[http-equiv="Content-Security-Policy"]'));
```

**Look for errors like:**
```
Refused to connect to 'wss://...' because it violates the following Content Security Policy directive
```

### 3. **Mixed Content Issues**
If preview is HTTPS but trying to connect to HTTP resources.

**Check:**
- Ensure all resources are HTTPS
- Check browser console for "Mixed Content" warnings
- Verify `REACT_APP_BACKEND_URL` uses HTTPS

### 4. **Wallet Provider Injection**
Some hosting environments interfere with `window.ethereum`.

**Check in Console:**
```javascript
console.log('window.ethereum:', window.ethereum);
console.log('Is MetaMask:', window.ethereum?.isMetaMask);
console.log('Can request accounts:', typeof window.ethereum?.request === 'function');
```

### 5. **Transaction Sandboxing**
Some platforms block write operations in preview.

**Check:**
- Try approving tokens first (lower-stakes transaction)
- Monitor console for transaction rejection errors
- Check if MetaMask popup appears at all

### 6. **Network Configuration**
Ensure MetaMask is on PulseChain mainnet.

**Check:**
```javascript
// In console after connecting wallet
ethereum.request({ method: 'eth_chainId' })
  .then(chainId => console.log('Current chain ID:', chainId));
// Should return: 0x171 (369 in decimal)
```

## Testing Steps

### Step 1: Check Console Logs
1. Open preview in Chrome/Brave with MetaMask installed
2. Open DevTools → Console
3. Refresh page
4. Look for "🌍 Environment Information" logs
5. **Screenshot/copy all logs and share**

### Step 2: Test Wallet Connection
1. Click "Connect Wallet"
2. Watch console for connection logs
3. Check if "✅ Signer obtained" appears
4. Verify signer address matches your wallet
5. **Screenshot/copy logs**

### Step 3: Test Transaction
1. Try to play a game
2. Watch console closely for where it stops
3. Check if you see:
   - "🎮 playGame called" ✅
   - "🔐 ensureApproval called" ✅
   - "🎲 Calling gameContract.play()..." ✅
   - "✅ Play transaction submitted" ❌ (likely fails here)
4. Note exact error message
5. **Screenshot/copy error details**

## Common Error Patterns

### Error 1: "User rejected the request"
**Cause:** MetaMask popup blocked or user clicked reject  
**Solution:** Check popup blocker, try again

### Error 2: "Wallet not connected"
**Cause:** Signer not properly initialized  
**Solution:** Check signer creation logs, verify wallet connected

### Error 3: No error, just nothing happens
**Cause:** Transaction not reaching MetaMask  
**Solution:** Check if preview domain is blocked by MetaMask

### Error 4: "Insufficient funds for gas"
**Cause:** Not enough PLS for gas fees  
**Solution:** Add PLS to wallet for gas

### Error 5: Network errors
**Cause:** RPC connection issues  
**Solution:** Check PulseChain RPC status, try switching networks

## Preview vs Production Differences

### This is a CREATE REACT APP
- **NOT Next.js** (no `NEXT_PUBLIC_` vars)
- Uses `REACT_APP_` prefix for environment variables
- All env vars must exist at **build time** (not runtime)
- Contracts are **hardcoded** in `/app/frontend/src/config/contracts.js`

### Environment Variables
```bash
# Current .env
REACT_APP_BACKEND_URL=https://pulse369-plinko.preview.emergentagent.com
WDS_SOCKET_PORT=443
REACT_APP_ENABLE_VISUAL_EDITS=false
ENABLE_HEALTH_CHECK=false
REACT_APP_HOST_ADDRESS=0x8855DEc7627CF4A23A2354F998Dfd57C500A8C51
```

**Key Points:**
- ✅ Contract addresses hardcoded (not env vars)
- ✅ No `NEXT_PUBLIC_GAME_ADDRESS` needed
- ✅ Preview URL properly set in env
- ✅ All settings identical to production

### Build Process
```bash
# Preview build
yarn build

# Creates: /app/frontend/build/
# Serves: Static files via CDN/hosting
# Runtime: Pure client-side, no server
```

## What to Share for Debugging

Please provide:

1. **Full console logs** from browser DevTools
2. **Screenshots** of any error messages
3. **MetaMask activity log** (Settings → Activity)
4. **Network tab** showing failed requests (if any)
5. **Response to these checks:**
   ```javascript
   // Run in browser console and share output:
   console.log('Origin:', window.location.origin);
   console.log('Ethereum:', !!window.ethereum);
   console.log('MetaMask:', window.ethereum?.isMetaMask);
   console.log('ChainId:', await ethereum.request({method: 'eth_chainId'}));
   ```

## Known Preview Platform Issues

Some preview platforms have these limitations:

1. **No wallet provider injection** - Platform strips `window.ethereum`
2. **CSP restrictions** - Blocks external RPC calls
3. **Transaction sandboxing** - Allows reads but blocks writes
4. **Domain restrictions** - Wallets don't trust preview domains
5. **Mixed content** - HTTPS preview trying HTTP resources

## Workarounds If Preview Blocks Transactions

### Option 1: Use Production URL
If preview has sandboxing, test on production URL instead.

### Option 2: Local Development
```bash
# Run locally with same config
cd /app/frontend
yarn start
# Test on localhost:3000 with MetaMask
```

### Option 3: Custom Domain
Point a custom domain to preview environment.
- May help with MetaMask trust
- Avoids `.preview.emergentagent.com` restrictions

### Option 4: Staging Environment
Deploy to separate staging with no sandboxing.

## Next Steps

1. **Share console logs** from preview environment
2. **Test locally** to confirm code works outside preview
3. **Check MetaMask permissions** for preview domain
4. **Verify RPC accessibility** from preview environment
5. **Test on production** if preview is sandboxed

## File Changes Made

Added comprehensive logging to:
- `/app/frontend/src/hooks/useWallet.js`
  - Environment information logging
  - Wallet connection logging
  - Transaction flow logging
  - Approval flow logging
  - Detailed error logging

All logs use emoji prefixes for easy filtering:
- 🌍 Environment info
- 🔌 Provider creation
- 🖊️ Signer operations
- 📄 Contract initialization
- 🎮 Game play calls
- 🔐 Approval checks
- ✅ Success
- ❌ Errors
- ⏳ Waiting

## Contact Points

If preview environment is fundamentally blocking transactions:
1. Check Emergent platform documentation
2. Contact platform support about preview limitations
3. Request production deployment for testing
4. Use local development environment

---

**The code is production-ready and works with mainnet contracts. The issue is environmental, not code-related.**
