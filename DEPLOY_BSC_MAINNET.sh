#!/bin/bash

# Deploy b402 to BSC MAINNET with new secure wallet
set -e

echo "🔥 b402.ai - BSC MAINNET Deployment"
echo "===================================="
echo ""

# NEW SECURE WALLET (never exposed before)
DEPLOYER_KEY="0xadea6956dc6bad957787c7ea2fe3e7b012d238cf799b58ba0b4032f51124dfeb"
DEPLOYER_ADDRESS="0x3d9d9E899C439C24a8cf66A08DaA1D647a2Fd8Df"
BSC_MAINNET_RPC="https://bsc-dataseed.binance.org"
USDT_MAINNET="0x55d398326f99059ff775485246999027b3197955"

echo "📋 Configuration:"
echo "  Deployer: $DEPLOYER_ADDRESS"
echo "  Network: BSC MAINNET (56)"
echo "  USDT: $USDT_MAINNET"
echo ""

# Check balance
echo "1️⃣ Checking BNB balance..."
BALANCE=$(cast balance $DEPLOYER_ADDRESS --rpc-url $BSC_MAINNET_RPC)
echo "  Balance: $BALANCE wei"

if [ "$BALANCE" = "0" ]; then
    echo ""
    echo "❌ No BNB found!"
    echo ""
    echo "📤 Send 0.1 BNB to this NEW SECURE address:"
    echo "   $DEPLOYER_ADDRESS"
    echo ""
    echo "   From: Coinbase/Binance/MoonPay"
    echo "   Network: BNB Smart Chain (BSC)"
    echo "   Amount: 0.1 BNB (~$110)"
    echo ""
    echo "⚠️  DO NOT send to old compromised wallet!"
    echo ""
    echo "Press ENTER after you've sent BNB..."
    read

    # Check again
    BALANCE=$(cast balance $DEPLOYER_ADDRESS --rpc-url $BSC_MAINNET_RPC)
    if [ "$BALANCE" = "0" ]; then
        echo "❌ Still no BNB. Waiting longer..."
        echo "⏳ Waiting 30 seconds for confirmation..."
        sleep 30
        BALANCE=$(cast balance $DEPLOYER_ADDRESS --rpc-url $BSC_MAINNET_RPC)
    fi
fi

# Convert to human readable
BNB_BALANCE=$(echo "scale=6; $BALANCE / 1000000000000000000" | bc)
echo "✅ Balance: $BNB_BALANCE BNB"
echo ""

# Deploy B402Relayer
echo "2️⃣ Deploying B402Relayer to BSC MAINNET..."
cd contracts-foundry

export PRIVATE_KEY=$DEPLOYER_KEY

DEPLOY_OUTPUT=$(forge script script/DeployB402.s.sol \
  --rpc-url $BSC_MAINNET_RPC \
  --broadcast \
  --verify \
  --etherscan-api-key $BSCSCAN_API_KEY \
  --legacy \
  2>&1 | tee /dev/tty)

# Extract contract address
B402_RELAYER=$(echo "$DEPLOY_OUTPUT" | grep -o "B402Relayer deployed at: 0x[a-fA-F0-9]*" | grep -o "0x[a-fA-F0-9]*")

if [ -z "$B402_RELAYER" ]; then
    echo "❌ Failed to extract contract address"
    echo "Check broadcast logs:"
    ls -la broadcast/DeployB402.s.sol/56/
    B402_RELAYER=$(cat broadcast/DeployB402.s.sol/56/run-latest.json | grep -o '"contractAddress":"0x[a-fA-F0-9]*"' | head -1 | cut -d'"' -f4)
fi

echo ""
echo "✅ B402Relayer deployed at: $B402_RELAYER"
echo "🔗 View on BSCScan:"
echo "   https://bscscan.com/address/$B402_RELAYER"
echo ""

# Save addresses
cd ..
cat > b402-mainnet-addresses.json <<EOF
{
  "network": "bsc-mainnet",
  "chainId": 56,
  "b402Relayer": "$B402_RELAYER",
  "usdt": "$USDT_MAINNET",
  "deployer": "$DEPLOYER_ADDRESS",
  "deployerPrivateKey": "$DEPLOYER_KEY"
}
EOF

echo "📝 Addresses saved to b402-mainnet-addresses.json"
echo ""

# Setup facilitator
cd b402-facilitator

echo "3️⃣ Setting up facilitator for MAINNET..."

cat > .env.mainnet <<EOF
RELAYER_PRIVATE_KEY=$DEPLOYER_KEY
B402_RELAYER_ADDRESS=$B402_RELAYER
BSC_RPC_URL=$BSC_MAINNET_RPC
PORT=3402
EOF

echo "✅ Facilitator configured (.env.mainnet)"
echo ""

echo "4️⃣ Building facilitator..."
npm run build

echo ""
echo "=========================================="
echo "✅ DEPLOYMENT COMPLETE!"
echo "=========================================="
echo ""
echo "📋 BSC MAINNET Deployment:"
echo "─────────────────────────────"
echo "Contract:  $B402_RELAYER"
echo "Explorer:  https://bscscan.com/address/$B402_RELAYER"
echo "USDT:      $USDT_MAINNET"
echo "Deployer:  $DEPLOYER_ADDRESS"
echo ""
echo "🚀 Start Facilitator:"
echo "   cd b402-facilitator"
echo "   cp .env.mainnet .env"
echo "   npm start"
echo ""
echo "🔥 READY FOR LIVESTREAM! 🔥"
echo ""
