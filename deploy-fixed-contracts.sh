#!/bin/bash
# Deploy fixed contracts with simplified signature

set -e

source .env

echo "🚀 Deploying Fixed Contracts..."
echo ""

AGENT=$(cast wallet address --private-key $AGENT_1_PRIVATE_KEY)
echo "Deployer: $AGENT"
echo ""

# Deploy IdentityRegistry
echo "1. Deploying IdentityRegistry..."
IDENTITY_TX=$(forge create contracts/IdentityRegistry.sol:IdentityRegistry \
    --rpc-url $RPC_URL \
    --private-key $AGENT_1_PRIVATE_KEY \
    --constructor-args $AGENT \
    --broadcast 2>&1)

IDENTITY_ADDR=$(echo "$IDENTITY_TX" | grep "Deployed to:" | awk '{print $3}')
echo "✓ IdentityRegistry: $IDENTITY_ADDR"
echo ""

sleep 3

# Deploy BountySystem
echo "2. Deploying BountySystem..."
BOUNTY_TX=$(forge create contracts/BountySystem.sol:BountySystem \
    --rpc-url $RPC_URL \
    --private-key $AGENT_1_PRIVATE_KEY \
    --constructor-args $IDENTITY_ADDR $AGENT \
    --broadcast 2>&1)

BOUNTY_ADDR=$(echo "$BOUNTY_TX" | grep "Deployed to:" | awk '{print $3}')
echo "✓ BountySystem: $BOUNTY_ADDR"
echo ""

# Update .env
echo "3. Updating .env with new addresses..."
sed -i.bak "s/^IDENTITY_REGISTRY_ADDRESS=.*/IDENTITY_REGISTRY_ADDRESS=$IDENTITY_ADDR/" .env
sed -i.bak "s/^BOUNTY_SYSTEM_ADDRESS=.*/BOUNTY_SYSTEM_ADDRESS=$BOUNTY_ADDR/" .env
rm .env.bak

echo "✓ Updated .env"
echo ""

echo "╔══════════════════════════════════════════════╗"
echo "║     CONTRACTS DEPLOYED SUCCESSFULLY! ✨       ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "IdentityRegistry: https://sepolia.basescan.org/address/$IDENTITY_ADDR"
echo "BountySystem: https://sepolia.basescan.org/address/$BOUNTY_ADDR"
echo ""

