# Pulse369 Plinko - Static Frontend

This is the static (vanilla JavaScript) frontend for the Pulse369 Plinko game on PulseChain.

## Overview

The Pulse369 Plinko game is an on-chain token distribution game that uses PLS369 tokens for gameplay. Players pay an entry fee in PLS369 tokens and have a chance to win prizes, including main and mini jackpots.

## Contract Addresses (PulseChain Mainnet)

- **Game Contract:** `0xFBF81bFA463252e25C8883ac0E3EBae99617A52c`
- **Token Contract (PLS369):** `0x55aC731aAa3442CE4D8bd8486eE4521B1D6Af5EC`

## Directory Structure

```
frontend-static/
├── assets/
│   ├── css/
│   │   └── style.css          # Main stylesheet with neon/gaming aesthetic
│   ├── js/
│   │   ├── utils.js           # Helper functions (formatting, notifications)
│   │   ├── wallet.js          # WalletManager for MetaMask/Web3 connection
│   │   ├── game.js            # GameManager for contract interactions
│   │   └── app.js             # Main application entry point
│   └── images/
│       └── .gitkeep           # Placeholder for icons/images
├── contracts/
│   └── abi.json               # Contract ABI for game and token contracts
├── index.html                 # Main HTML file with game UI
├── config.js                  # Configuration with contract addresses
├── manifest.json              # PWA manifest
├── sw.js                      # Service worker for offline support
└── README.md                  # This file
```

## Deployment

### Prerequisites

1. A web server capable of serving static files
2. HTTPS enabled (required for MetaMask/Web3 connections)
3. Proper CORS headers configured (if serving from CDN)

### Quick Deployment Options

#### Option 1: GitHub Pages

1. Push this folder to a GitHub repository
2. Enable GitHub Pages in repository settings
3. Set the source to the `frontend-static` folder (or root if moved)

#### Option 2: Netlify / Vercel

1. Connect your repository
2. Set build command to: (none - static files)
3. Set publish directory to: `frontend-static`

#### Option 3: Traditional Web Server (nginx)

```nginx
server {
    listen 443 ssl;
    server_name plinko.pulse369.com;
    
    root /var/www/pulse369-plinko/frontend-static;
    index index.html;
    
    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/plinko.pulse369.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/plinko.pulse369.com/privkey.pem;
    
    # Cache static assets
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Service worker
    location /sw.js {
        add_header Cache-Control "no-cache";
    }
    
    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

#### Option 4: IPFS Deployment

```bash
# Install ipfs-deploy
npm install -g ipfs-deploy

# Deploy to IPFS
ipd -p pinata frontend-static
```

### Post-Deployment Checklist

- [ ] Verify HTTPS is enabled
- [ ] Test MetaMask connection on PulseChain Mainnet
- [ ] Verify contract interactions work correctly
- [ ] Test PWA installation on mobile devices
- [ ] Check Service Worker is registered and caching works
- [ ] Verify all assets load correctly (no 404s)

## Configuration

### Updating Contract Addresses

If you need to update contract addresses, edit `config.js`:

```javascript
export const CONFIG = {
    CONTRACT_ADDRESS: 'YOUR_GAME_CONTRACT_ADDRESS',
    TOKEN_ADDRESS: 'YOUR_TOKEN_CONTRACT_ADDRESS',
    // ...
};
```

### Adding Custom Network

To add support for additional networks, update the `NETWORKS` object in `config.js`:

```javascript
NETWORKS: {
    // ... existing networks
    YOUR_CHAIN_ID: {
        name: 'Network Name',
        symbol: 'SYMBOL',
        decimals: 18,
        rpc: 'https://rpc.example.com',
        explorer: 'https://explorer.example.com'
    }
}
```

## Development

### Local Development Server

You can use any static file server for local development:

```bash
# Using Python
python -m http.server 8000 --directory frontend-static

# Using Node.js (npx)
npx serve frontend-static

# Using PHP
php -S localhost:8000 -t frontend-static
```

Then open `http://localhost:8000` in your browser.

### Browser Requirements

- Modern browser with ES6 module support
- MetaMask or compatible Web3 wallet
- PulseChain Mainnet configured in wallet

## Game Mechanics

### Entry Price
- 10 PLS369 tokens per play

### Prize Slots (20 total)
| Slot | Prize |
|------|-------|
| 3 | 3x multiplier (30 PLS369) |
| 7 | 2x multiplier (20 PLS369) |
| 11 | 5x multiplier (50 PLS369) |
| 15 | 2x multiplier (20 PLS369) |
| 18 | 2x multiplier (20 PLS369) |

### Jackpots
- **Main Jackpot**: Slot 10, 1 in 33,333 odds
  - 50% to winner, 20% to DAO, 30% reset
- **Mini Jackpot**: Slots 2 & 16, 1 in 4,762 odds
  - 50% to winner, 10% to dev, 40% reset

### Token Distribution Per Play
- 40% → Main Jackpot Pool
- 10% → Mini Jackpot Pool
- 4% → DAO Rewards
- 3% → Dev Rewards
- ~43% → Prize payouts (when won)

## Security Considerations

- All game logic is on-chain and verifiable
- Randomness provided by Fetch Oracle
- No private keys are stored in the frontend
- All transactions require user approval via MetaMask

## Support

For issues or questions:
- Review the [main repository README](../README.md)
- Check PulseChain block explorer for transaction status
- Verify MetaMask is connected to PulseChain Mainnet

## License

Part of the PLS369 DAO project.
