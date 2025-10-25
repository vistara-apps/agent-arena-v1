#!/bin/bash

echo "🚀 Deploying ERC-8004 Upgradeable Contracts"
echo "=========================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "contracts/package.json" ]; then
    echo -e "${RED}Error: contracts/package.json not found. Are you in the project root?${NC}"
    exit 1
fi

# Install dependencies
echo "📦 Installing contract dependencies..."
cd contracts
npm install

# Compile contracts
echo "🔨 Compiling contracts..."
npx hardhat compile

# Deploy to local network by default
NETWORK=${1:-localhost}
echo "🌐 Deploying to network: $NETWORK"

# Run deployment script
npx hardhat run scripts/deploy-upgradeable.ts --network $NETWORK

# Check if deployment was successful
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Deployment successful!${NC}"
    
    # Find the latest deployment file
    LATEST_DEPLOYMENT=$(ls -t deployments/$NETWORK-*.json 2>/dev/null | head -1)
    if [ -f "$LATEST_DEPLOYMENT" ]; then
        echo "📄 Deployment details saved to: $LATEST_DEPLOYMENT"
        echo ""
        echo "Contract addresses:"
        cat "$LATEST_DEPLOYMENT" | jq -r '.contracts | to_entries[] | "- \(.key): \(.value)"'
    fi
else
    echo -e "${RED}❌ Deployment failed${NC}"
    exit 1
fi

cd ..

echo ""
echo "Next steps:"
echo "1. Update frontend configuration with new contract addresses"
echo "2. Run migration script if upgrading from v1: npm run migrate:agents"
echo "3. Verify contracts on Etherscan (if deployed to testnet/mainnet)"