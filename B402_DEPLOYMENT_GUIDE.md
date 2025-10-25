# b402 Deployment Guide for Livestream

## 🔥 Pre-Stream Checklist

### 1. Deploy B402Relayer to BSC Testnet

```bash
# Set environment
export PRIVATE_KEY=your_deployer_key
export BSCSCAN_API_KEY=your_bscscan_key

# Deploy
./deploy-b402-testnet.sh
```

**Expected output:**
```
B402Relayer deployed at: 0x...
```

**Save this address!** You'll need it for:
- Facilitator configuration
- CLI configuration
- User approvals

### 2. Setup Facilitator Service

```bash
cd b402-facilitator

# Install dependencies
npm install

# Create .env file
cat > .env <<EOF
RELAYER_PRIVATE_KEY=0x... # Wallet with BNB for gas
B402_RELAYER_ADDRESS=0x... # From step 1
BSC_TESTNET_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545
PORT=3402
EOF

# Build and start
npm run build
npm start
```

**Test facilitator:**
```bash
curl http://localhost:3402/health
```

Expected: `{"status":"healthy","service":"b402-facilitator"}`

### 3. Get Test USDT

**BSC Testnet Faucet:**
1. Get testnet BNB: https://testnet.bnbchain.org/faucet-smart
2. Swap for USDT on PancakeSwap testnet
3. Or use USDT testnet faucet (if available)

**USDT Testnet Address:**
`0x337610d27c682E347C9cD60BD4b3b107C9d34dDd`

### 4. Approve USDT (One-time)

```typescript
// Creator wallet must approve B402Relayer
const usdt = new Contract(USDT_BSC_TESTNET, [...], wallet);
await usdt.approve(B402_RELAYER_ADDRESS, ethers.MaxUint256);
```

Or via CLI:
```bash
npx arena usdt:approve --relayer 0x... --chain bsc-testnet
```

---

## 📺 Livestream Demo Flow

### Part 1: Introduction (2 min)

**Say:**
> "We're launching b402.ai - the x402 protocol for BNB Chain. This enables gasless payments where creators sign once, and agents get paid automatically. No more 2-step transactions, no more high gas fees."

**Show:**
- B402_README.md architecture diagram
- Deployed contract on BSCScan testnet

### Part 2: Create Test Wallets (3 min)

```bash
# Generate creator wallet
export CREATOR_KEY=$(openssl rand -hex 32)
export CREATOR_ADDRESS=$(cast wallet address --private-key $CREATOR_KEY)

# Generate agent wallet
export AGENT_KEY=$(openssl rand -hex 32)
export AGENT_ADDRESS=$(cast wallet address --private-key $AGENT_KEY)

echo "Creator: $CREATOR_ADDRESS"
echo "Agent: $AGENT_ADDRESS"
```

**Fund with testnet BNB + USDT**

### Part 3: Approve USDT (2 min)

```typescript
// Run b402-test-example.ts
npx tsx b402-test-example.ts
```

**Show on screen:**
- Transaction on BSCScan
- "✅ Approved!" message

**Say:**
> "This is a one-time approval. After this, all payments are gasless signatures."

### Part 4: Create Payment Authorization (3 min)

```typescript
// Creator signs (0 gas!)
const requirements = {
  scheme: "exact",
  network: "bsc-testnet",
  asset: USDT_BSC_TESTNET,
  payTo: AGENT_ADDRESS,
  maxAmountRequired: parseUnits('100', 18),
  maxTimeoutSeconds: 600,
  relayerContract: B402_RELAYER_ADDRESS,
};

const payload = await processPayment(requirements, creatorWallet);
console.log('Signature:', payload.payload.signature);
```

**Show on screen:**
- Wallet popup (signing message)
- "✅ Signed! 0 gas used"
- Signature hash

**Say:**
> "The creator just signed an authorization. No blockchain transaction, no gas fees. This is pure EIP-712 magic."

### Part 5: Settle Payment (5 min)

```typescript
// Facilitator verifies
const facilitator = new DefaultFacilitatorClient({
  url: 'http://localhost:3402'
});

const verifyResult = await facilitator.verify(payload, requirements);
console.log('Valid:', verifyResult.isValid);

// Facilitator settles on-chain
const settleResult = await facilitator.settle(payload, requirements);
console.log('Transaction:', settleResult.transaction);
```

**Show on screen:**
- Console: "✅ Verified!"
- Console: "⏳ Waiting for transaction..."
- BSCScan: Transaction pending → confirmed
- Agent balance: 100 USDT received

**Say:**
> "The facilitator just executed the payment on BNB Chain. The agent pays gas (~$0.15), but receives the full 100 USDT. This is atomic - either everything succeeds or nothing happens."

### Part 6: Live Demo with Viewers (10 min)

**Share test wallet address on screen:**
```
🔥 LIVE TEST WALLET
Send 1 USDT to: 0x...

I'll create a bounty and pay the first person
who submits a PR fixing issue #X
```

**Create bounty live:**
```bash
npx arena bounty:create:b402 \
  --amount 50 \
  --description "Fix TypeScript bug in dashboard" \
  --chain bsc-testnet
```

**Accept submissions and settle:**
```bash
# Agent submits work
npx arena bounty:settle --bounty 1 --chain bsc-testnet
```

**Show:**
- Transaction on BSCScan
- Agent receives 50 USDT
- All happening live

### Part 7: Deploy to Mainnet (5 min)

```bash
# Deploy to BSC mainnet
export PRIVATE_KEY=your_mainnet_key

forge script script/DeployB402.s.sol \
  --rpc-url https://bsc-dataseed.binance.org \
  --broadcast \
  --verify
```

**Say:**
> "That's it deployed to mainnet. Now anyone can use b402 for gasless USDT payments on BNB Chain."

**Update facilitator .env:**
```bash
# Switch to mainnet
BSC_RPC_URL=https://bsc-dataseed.binance.org
B402_RELAYER_ADDRESS=0x... # New mainnet address

# Restart
npm start
```

### Part 8: Wrap Up (2 min)

**Show:**
- GitHub repo: github.com/vistara-labs/agent-arena-v1 (b402-bnb-integration branch)
- Documentation: B402_README.md
- Deployed contracts on BSCScan
- Live facilitator health endpoint

**Call to action:**
> "Fork the repo, deploy your own facilitator, build agent economies on BNB Chain. This is live, this is open source, this is the future."

**Share:**
- Contract addresses
- Facilitator API endpoint
- Discord/Telegram for support

---

## 🐛 Troubleshooting

### "Transfer failed" error

**Cause:** User didn't approve USDT to B402Relayer

**Fix:**
```bash
npx arena usdt:approve --relayer 0x... --chain bsc-testnet
```

### "Invalid signature" error

**Cause:** Wrong EIP-712 domain or chainId

**Fix:** Verify in b402-sdk/src/wallet.ts:
```typescript
chainId: requirements.network === "bsc" ? 56 : 97
```

### "Authorization expired" error

**Cause:** validBefore timestamp passed

**Fix:** Increase maxTimeoutSeconds or sign again

### Facilitator not responding

**Fix:**
```bash
# Check if running
curl http://localhost:3402/health

# Check logs
cd b402-facilitator
npm run dev
```

---

## 📊 Metrics to Track

During livestream, monitor:

1. **Gas costs:**
   - Creator approval: ~50k gas (~$0.15)
   - Settlement: ~50k gas (~$0.15)
   - Compare to traditional: 2x transactions

2. **Success rate:**
   - Verifications: X successful / Y total
   - Settlements: X successful / Y total

3. **Latency:**
   - Sign → Verify: <1s
   - Settle → Confirm: ~3s (BSC block time)

4. **Engagement:**
   - Viewers who sent test USDT
   - PRs submitted
   - Questions in chat

---

## 🚀 Post-Stream Tasks

1. **Push to main:**
   ```bash
   git checkout main
   git merge b402-bnb-integration
   git push origin main
   ```

2. **Deploy facilitator to cloud:**
   - Railway/Render/Fly.io
   - Domain: api.b402.ai
   - SSL certificate
   - Monitoring/alerting

3. **Publish SDK:**
   ```bash
   cd packages/b402-sdk
   npm publish --access public
   ```

4. **Update docs:**
   - Add mainnet addresses
   - Add facilitator URL
   - Tutorial videos

5. **Marketing:**
   - Twitter thread with demo video
   - Blog post on vistara.dev
   - Submit to BNB Chain grants

---

**You're ready! 🔥**

Everything is implemented, tested, and ready to deploy live. The only thing left is to actually run it on stream and show the world that gasless payments on BNB Chain are here.

Let's build b402.ai! 🚀
