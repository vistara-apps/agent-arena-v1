#!/bin/bash

# Agent Arena Deployment Script
# Uses OFFICIAL ERC-8004 Singletons (already deployed)

set -e

echo "🚀 Agent Arena Deployment (Using Official ERC-8004 Singletons)"
echo "=============================================================="
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

if [ $(echo "$BALANCE_ETH < 0.005" | bc) -eq 1 ]; then
  echo "⚠️  Low balance! Get testnet ETH from:"
  echo "   https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet"
  echo ""
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo ""
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

echo "📋 Official ERC-8004 Singletons (already deployed):"
echo "  Identity:    0x8004AA63c570c570eBF15376c0dB199918BFe9Fb"
echo "  Reputation:  0x8004bd8daB57f14Ed299135749a5CB5c42d341BF"
echo "  Validation:  0x8004C269D0A5647E51E121FeB226200ECE932d55"
echo ""
echo "🔨 Deploying ONLY BountySystem (not deploying ERC-8004)..."
echo ""

# Deploy
forge script script/DeployBountySystemOnly.s.sol:DeployBountySystemOnly \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --broadcast \
  --verify \
  -vvvv

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Save the BountySystem address from output above"
echo "2. Test end-to-end (see DEPLOY_AND_TEST.md)"
echo "3. Agents registered work across ALL ERC-8004 platforms!"
echo ""
