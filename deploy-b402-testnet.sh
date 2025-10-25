#!/bin/bash

# Deploy b402 to BSC Testnet
set -e

echo "🔥 Deploying b402 to BSC Testnet..."
echo ""

# Check environment
if [ -z "$PRIVATE_KEY" ]; then
    echo "❌ PRIVATE_KEY not set"
    exit 1
fi

# BSC Testnet RPC
BSC_TESTNET_RPC="https://data-seed-prebsc-1-s1.binance.org:8545"

echo "📝 Configuration:"
echo "  Network: BSC Testnet (Chain ID: 97)"
echo "  RPC: $BSC_TESTNET_RPC"
echo ""

# Deploy B402Relayer
echo "1️⃣ Deploying B402Relayer..."
cd contracts-foundry

forge script script/DeployB402.s.sol \
  --rpc-url $BSC_TESTNET_RPC \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify \
  --verifier-url https://api-testnet.bscscan.com/api \
  --etherscan-api-key $BSCSCAN_API_KEY

echo ""
echo "✅ B402Relayer deployed!"
echo ""
echo "⚠️  IMPORTANT: Users must approve USDT to the B402Relayer contract:"
echo "   USDT Testnet: 0x337610d27c682E347C9cD60BD4b3b107C9d34dDd"
echo "   approve(B402Relayer, type(uint256).max)"
echo ""
echo "Next steps:"
echo "1. Fund relayer wallet with BNB for gas"
echo "2. Update b402-facilitator/.env with contract address"
echo "3. Start facilitator: cd b402-facilitator && npm run dev"
echo "4. Test: npx arena bounty:create:b402 --chain bsc-testnet"
