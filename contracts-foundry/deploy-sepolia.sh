#!/bin/bash

# Agent Arena + Official ERC-8004 Deployment to Base Sepolia

set -e

echo "🚀 Agent Arena + Official ERC-8004 Deployment Script"
echo "===================================================="
echo ""

# Check environment variables
if [ -z "$PRIVATE_KEY" ]; then
  echo "❌ Error: PRIVATE_KEY not set"
  echo "   Run: export PRIVATE_KEY=your_private_key"
  exit 1
fi

if [ -z "$BASE_SEPOLIA_RPC_URL" ]; then
  echo "⚠️  BASE_SEPOLIA_RPC_URL not set, using default"
  export BASE_SEPOLIA_RPC_URL="https://sepolia.base.org"
fi

echo "✅ PRIVATE_KEY is set"
echo "✅ BASE_SEPOLIA_RPC_URL: $BASE_SEPOLIA_RPC_URL"
echo ""

# Check balance
DEPLOYER=$(cast wallet address --private-key $PRIVATE_KEY)
BALANCE=$(cast balance $DEPLOYER --rpc-url $BASE_SEPOLIA_RPC_URL)
BALANCE_ETH=$(cast to-unit $BALANCE ether)

echo "Deployer: $DEPLOYER"
echo "Balance: $BALANCE_ETH ETH"
echo ""

if [ $(echo "$BALANCE_ETH < 0.01" | bc) -eq 1 ]; then
  echo "⚠️  Low balance! Get testnet ETH from:"
  echo "   https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet"
  echo ""
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo ""
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

echo "🔨 Deploying contracts to Base Sepolia..."
echo ""

# Deploy
forge script script/DeployERC8004.s.sol:DeployERC8004 \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --broadcast \
  --verify \
  -vvvv

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Save the contract addresses from the output above"
echo "2. Update your .env file with the addresses"
echo "3. Run end-to-end tests (see DEPLOY_AND_TEST.md)"
echo "4. Verify contracts on BaseScan: https://sepolia.basescan.org"
echo ""
