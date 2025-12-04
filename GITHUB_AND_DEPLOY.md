# GitHub Push & Deployment Guide

## 📦 Pushing to GitHub

### Using Emergent's "Save to GitHub" Feature

**Step 1: Locate the Feature**
- Look for "Save to GitHub" button in the Emergent interface
- Usually in the top bar or project settings

**Step 2: Configure Repository**
- **Repository Name:** `pulse369-plinko`
- **Visibility:** Public or Private (your choice)
- **Description:** "PulseChain-based Plinko game with PLS369 token economy"

**Step 3: Commit Message**
```
Complete Pulse369 DAO Plinko game - Production ready

- Full blockchain integration with PulseChain mainnet
- Smart contracts deployed and functional
- Universal wallet support (MetaMask, Safe, etc.)
- React frontend with ethers.js v6
- FastAPI backend with MongoDB
- Includes comprehensive deployment review

Contracts:
- PLS369Token: 0x55aC731aAa3442CE4D8bd8486eE4521B1D6Af5EC
- PlinkoGame369: 0xFBF81bFA463252e25C8883ac0E3EBae99617A52c

Note: Requires Web3-compatible hosting (Vercel/Netlify recommended)
```

**Step 4: Verify Push**
- Check GitHub repository for all files
- Verify `DEPLOYMENT_REVIEW.md` is included
- Confirm `.env` files are present (for reference)

---

## 🚀 Quick Deploy to Vercel (Recommended)

### Prerequisites:
- GitHub account with code pushed
- Vercel account (free: https://vercel.com)

### Deployment Steps:

**1. Import from GitHub**
```
1. Go to vercel.com
2. Click "New Project"
3. Import your pulse369-plinko repository
4. Select "frontend" folder as root
```

**2. Configure Build**
```yaml
Framework Preset: Create React App
Build Command: yarn build
Output Directory: build
Install Command: yarn install
```

**3. Environment Variables**
```env
REACT_APP_BACKEND_URL=https://your-backend-url.com
```

**4. Deploy**
- Click "Deploy"
- Wait 2-3 minutes
- Get production URL: `https://pulse369-plinko.vercel.app`

**5. Test**
- Open URL
- Connect MetaMask
- Play a game
- Verify blockchain transactions work

---

## 🗄️ Backend Deployment (Railway)

### Prerequisites:
- Railway account (free $5/month: https://railway.app)

### Deployment Steps:

**1. New Project**
```
1. Go to railway.app
2. Click "New Project"
3. Choose "Deploy from GitHub repo"
4. Select pulse369-plinko/backend
```

**2. Configure Service**
```yaml
Start Command: uvicorn server:app --host 0.0.0.0 --port $PORT
```

**3. Add MongoDB**
```
1. Click "New"
2. Select "Database"
3. Choose "MongoDB"
4. Copy connection string
```

**4. Environment Variables**
```env
MONGO_URL=<your-railway-mongodb-url>
DB_NAME=pulse369_plinko
CORS_ORIGINS=https://pulse369-plinko.vercel.app
PORT=8001
```

**5. Deploy**
- Railway auto-deploys
- Get backend URL: `https://pulse369-plinko-backend.railway.app`

**6. Update Frontend**
- Go back to Vercel
- Update `REACT_APP_BACKEND_URL` to Railway URL
- Redeploy frontend

---

## ✅ Post-Deployment Checklist

### Frontend Verification:
- [ ] Site loads without errors
- [ ] Connect Wallet button appears
- [ ] Can connect MetaMask/wallet
- [ ] PulseChain network detected
- [ ] Balance displays correctly
- [ ] Jackpots load from blockchain

### Game Functionality:
- [ ] Can drag and drop puck
- [ ] Transaction popup appears
- [ ] Blockchain confirms transaction
- [ ] Puck animates to correct slot
- [ ] Result banner shows
- [ ] Stats update correctly
- [ ] Can play multiple games

### Backend (Optional):
- [ ] API endpoints respond
- [ ] Stats tracking works
- [ ] Database connection active
- [ ] CORS allows frontend domain

---

## 🌐 Share Your Game

### Update README.md with Production URLs:
```markdown
# Pulse369 DAO Plinko Jackpot

**Live Game:** https://pulse369-plinko.vercel.app

## Play Now!
1. Install MetaMask: https://metamask.io
2. Add PulseChain network (Chain ID: 369)
3. Get PLS369 tokens (contract: 0x55aC...5EC)
4. Visit game URL and play!

## Deployed Contracts
- PLS369 Token: 0x55aC731aAa3442CE4D8bd8486eE4521B1D6Af5EC
- Plinko Game: 0xFBF81bFA463252e25C8883ac0E3EBae99617A52c
- Network: PulseChain Mainnet (Chain ID: 369)

## Requirements
- Web3 wallet (MetaMask, Safe, Rainbow, etc.)
- PLS369 tokens (10 per game)
- Small amount of PLS for gas

## How to Play
1. Connect your wallet
2. Approve PLS369 token spending (one-time)
3. Drag the puck and release to play
4. Wait for blockchain confirmation
5. Watch the puck land and see if you win!

## Prize Structure
- Entry: 10 PLS369
- Prize Slots: 3 (3x), 7 (2x), 11 (5x), 15 (2x), 18 (2x)
- Main Jackpot: Slot 10 (1:33,333 odds)
- Mini Jackpot: Slots 2 & 16 (1:4,762 odds)

## Features
- 🎰 100% on-chain fairness
- 💰 Real-time jackpot tracking
- 🔐 Non-custodial (you control your funds)
- 📊 Session stats with persistence
- 🌐 Universal wallet support

## Tech Stack
- Frontend: React + ethers.js v6
- Backend: FastAPI + MongoDB
- Blockchain: Solidity on PulseChain
- Randomness: Fetch Oracle

## Development
See DEPLOYMENT_REVIEW.md for full technical details and code review.

## Support
- Telegram: https://web.telegram.org/k/#@pulse369dao
- Contract: 0xFBF81bFA463252e25C8883ac0E3EBae99617A52c
```

---

## 🐛 Troubleshooting

### Issue: Wallet Won't Connect
**Solution:**
- Check if MetaMask is installed
- Verify PulseChain network is added
- Try hard refresh (Ctrl+Shift+R)

### Issue: Transaction Fails
**Solution:**
- Ensure you have PLS for gas
- Check you have 10+ PLS369 tokens
- Verify on correct network (Chain ID: 369)

### Issue: Jackpots Show 0.00
**Solution:**
- Check browser console for errors
- Verify RPC endpoint is accessible
- Try refreshing the page
- Check contracts on block explorer

### Issue: Backend API Not Responding
**Solution:**
- Check Railway logs for errors
- Verify MongoDB connection
- Check CORS settings
- Test API endpoint directly

---

## 📊 Monitoring & Analytics

### Recommended Tools:

**Frontend Monitoring:**
- Vercel Analytics (built-in)
- Google Analytics
- Sentry for error tracking

**Backend Monitoring:**
- Railway metrics (built-in)
- Datadog or New Relic
- MongoDB Atlas monitoring

**Blockchain Monitoring:**
- PulseChain block explorer
- Contract event logs
- Transaction history

---

## 💰 Cost Estimate

### Free Tier (Recommended for Launch):
- **Vercel:** Free (hobby plan)
- **Railway:** $5/month credit (free)
- **MongoDB:** Free (Atlas 512MB)
- **Total:** $0/month

### Paid Tier (After Growth):
- **Vercel Pro:** $20/month
- **Railway:** ~$10-20/month
- **MongoDB Atlas:** $9+/month
- **Total:** $39-49/month

### Enterprise:
- Custom pricing based on traffic
- Dedicated infrastructure
- SLA guarantees

---

## 🎯 Launch Strategy

### Soft Launch (Week 1):
1. Deploy to production
2. Test with small group
3. Monitor for issues
4. Gather feedback
5. Fix any bugs

### Public Launch (Week 2):
1. Announce on Telegram
2. Social media posts
3. Community engagement
4. Monitor transaction volume
5. Scale if needed

### Growth (Month 1+):
1. Add features based on feedback
2. Marketing campaigns
3. Partnerships
4. Community building
5. Iterate and improve

---

## 📞 Need Help?

### Deployment Issues:
- Vercel Support: https://vercel.com/support
- Railway Support: https://railway.app/help
- MongoDB Support: https://support.mongodb.com

### Code Questions:
- Check DEPLOYMENT_REVIEW.md
- Review console logs
- Test on local environment first

### Web3 Questions:
- ethers.js docs: https://docs.ethers.org
- PulseChain community: https://t.me/PulseChain
- MetaMask support: https://metamask.io/support

---

## ✨ You're Ready!

**Your game is:**
- ✅ Code reviewed and approved
- ✅ Fully functional
- ✅ Production ready
- ✅ Documented
- ✅ Ready to deploy

**Next actions:**
1. Push to GitHub using "Save to GitHub" button
2. Deploy to Vercel (5 minutes)
3. Deploy backend to Railway (5 minutes)
4. Test with real wallet
5. Share with community!

**Good luck with your launch! 🚀🎰**
