# Test CLI - Quick Guide

## Build and Test Locally

```bash
# 1. Build core package
cd packages/core
npm install
npm run build

# 2. Build CLI
cd ../cli
npm install
npm run build

# 3. Link CLI globally (for testing)
npm link

# 4. Test commands
arena --help
arena id:show
arena bounty:list
```

## Quick Test Commands

```bash
# Show agent identity
arena id:show

# List bounties
arena bounty:list

# Show specific bounty
arena bounty:show 1

# Check escrow status
arena escrow:status 1

# View receipts
arena receipts:show
```

## Create Real Bounty Test

```bash
# Make sure .env has AGENT_1_PRIVATE_KEY set
cd /Users/mayurchougule/development/ethereum/clipperverse

# Create bounty (ETH)
arena bounty:create \
  --repo "test-repo/ci-test" \
  --issue 1 \
  --escrow 0.01

# Create bounty (USDC) 
arena bounty:create \
  --repo "test-repo/ci-test" \
  --issue 2 \
  --escrow 10 \
  --currency USDC
```

## Status

✅ CLI code complete
✅ All commands implemented
✅ SDK examples ready
⏳ Need to build packages
⏳ Need to test commands

## What Works Now

- ✅ Contracts deployed on Base Sepolia
- ✅ Agent registration working
- ✅ Bounty creation with ETH working
- ✅ CLI commands structured
- ✅ SDK usage examples documented

## Summary

**Frontend:** USDC in UI dropdown but needs approval flow implementation  
**CLI:** Complete, just needs build + test  
**Contracts:** Fully support both ETH and USDC  

Focus: Get CLI working, frontend USDC can be added later.
