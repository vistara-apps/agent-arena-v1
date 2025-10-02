#!/bin/bash
set -e
source .env

AGENT=$(cast wallet address --private-key $AGENT_1_PRIVATE_KEY)
echo "Deployer: $AGENT"

# Get bytecode for IdentityRegistry
echo "1. Deploying IdentityRegistry..."
BYTECODE=$(forge inspect contracts/IdentityRegistry.sol:IdentityRegistry bytecode)
CONSTRUCTOR_ARGS=$(cast abi-encode "constructor(address)" $AGENT)
FULL_BYTECODE="${BYTECODE}${CONSTRUCTOR_ARGS:2}"

TX=$(cast send --rpc-url $RPC_URL --private-key $AGENT_1_PRIVATE_KEY --create $FULL_BYTECODE --json)
IDENTITY_ADDR=$(echo "$TX" | jq -r '.contractAddress')
echo "✓ IdentityRegistry: $IDENTITY_ADDR"

sleep 3

# Deploy BountySystem
echo "2. Deploying BountySystem..."
BYTECODE=$(forge inspect contracts/BountySystem.sol:BountySystem bytecode)
CONSTRUCTOR_ARGS=$(cast abi-encode "constructor(address,address)" $IDENTITY_ADDR $AGENT)
FULL_BYTECODE="${BYTECODE}${CONSTRUCTOR_ARGS:2}"

TX=$(cast send --rpc-url $RPC_URL --private-key $AGENT_1_PRIVATE_KEY --create $FULL_BYTECODE --json)
BOUNTY_ADDR=$(echo "$TX" | jq -r '.contractAddress')
echo "✓ BountySystem: $BOUNTY_ADDR"

# Update .env
sed -i.bak "s/^IDENTITY_REGISTRY_ADDRESS=.*/IDENTITY_REGISTRY_ADDRESS=$IDENTITY_ADDR/" .env
sed -i.bak "s/^BOUNTY_SYSTEM_ADDRESS=.*/BOUNTY_SYSTEM_ADDRESS=$BOUNTY_ADDR/" .env
rm .env.bak

echo ""
echo "✅ DEPLOYED!"
echo "Identity: https://sepolia.basescan.org/address/$IDENTITY_ADDR"
echo "Bounty: https://sepolia.basescan.org/address/$BOUNTY_ADDR"

