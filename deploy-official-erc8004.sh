#!/bin/bash

# Agent Arena - Official ERC-8004 Deployment Script
# Deploys official ERC-8004 contracts + integrated BountySystem

set -e

echo "🚀 Agent Arena × Official ERC-8004 Deployment"
echo "=============================================="
echo ""

# Get network (default to baseSepolia)
NETWORK=${1:-baseSepolia}
echo "📡 Network: $NETWORK"
echo ""

# Check environment variables
if [ -z "$PRIVATE_KEY" ]; then
  echo "❌ Error: PRIVATE_KEY not set"
  echo "   export PRIVATE_KEY=your_private_key"
  exit 1
fi

if [ "$NETWORK" = "baseSepolia" ] && [ -z "$BASESCAN_API_KEY" ]; then
  echo "⚠️  Warning: BASESCAN_API_KEY not set"
  echo "   Contract verification will be skipped"
  echo ""
fi

echo "📦 Step 1: Install dependencies"
cd contracts
npm install
echo "✅ Dependencies installed"
echo ""

echo "🔨 Step 2: Compile contracts"
npx hardhat compile
echo "✅ Contracts compiled"
echo ""

echo "🚀 Step 3: Deploy to $NETWORK"
npx hardhat run scripts/deploy-official-erc8004.ts --network $NETWORK
echo "✅ Deployment complete"
echo ""

echo "📝 Step 4: Save deployment info"
DEPLOYMENT_FILE="../deployments/${NETWORK}-erc8004-$(date +%Y%m%d-%H%M%S).json"
mkdir -p ../deployments
echo "Deployment info will be saved to: $DEPLOYMENT_FILE"
echo ""

echo "=============================================="
echo "✅ Official ERC-8004 Integration Deployed!"
echo "=============================================="
echo ""
echo "Next steps:"
echo "1. Update frontend with new contract addresses"
echo "2. Update SDK packages with new ABIs"
echo "3. Test agent registration flow"
echo "4. Test end-to-end bounty flow"
echo "5. Verify contracts on BaseScan (see output above)"
echo ""
echo "📚 Read OFFICIAL_ERC8004_SHOWCASE.md for full capabilities"
echo ""
