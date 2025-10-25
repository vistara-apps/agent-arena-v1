#!/bin/bash

# Complete b402 Deployment and Test Script
set -e

echo "🔥 b402.ai - Complete Deployment and Test"
echo "=========================================="
echo ""

# Configuration
DEPLOYER_KEY="0x8cb23df33397a488ea8d9be152e50cf6770aad7a0f37bf2efd3f2d21b2625b11"
DEPLOYER_ADDRESS="0x3DA623926153B9bB377948b6b5E2422622Eb43f0"
BSC_TESTNET_RPC="https://data-seed-prebsc-1-s1.binance.org:8545"
USDT_TESTNET="0x337610d27c682E347C9cD60BD4b3b107C9d34dDd"

echo "📋 Configuration:"
echo "  Deployer: $DEPLOYER_ADDRESS"
echo "  Network: BSC Testnet (97)"
echo "  USDT: $USDT_TESTNET"
echo ""

# Check balance
echo "1️⃣ Checking BNB balance..."
BALANCE=$(cast balance $DEPLOYER_ADDRESS --rpc-url $BSC_TESTNET_RPC)
echo "  Balance: $BALANCE wei"

if [ "$BALANCE" = "0" ]; then
    echo ""
    echo "❌ No BNB found! Get testnet BNB:"
    echo "   https://testnet.bnbchain.org/faucet-smart"
    echo "   Address: $DEPLOYER_ADDRESS"
    echo ""
    echo "Press ENTER after you've funded the wallet..."
    read

    # Check again
    BALANCE=$(cast balance $DEPLOYER_ADDRESS --rpc-url $BSC_TESTNET_RPC)
    if [ "$BALANCE" = "0" ]; then
        echo "❌ Still no BNB. Exiting."
        exit 1
    fi
fi

echo "✅ Balance confirmed: $BALANCE wei"
echo ""

# Deploy B402Relayer
echo "2️⃣ Deploying B402Relayer contract..."
cd contracts-foundry

export PRIVATE_KEY=$DEPLOYER_KEY

DEPLOY_OUTPUT=$(forge script script/DeployB402.s.sol \
  --rpc-url $BSC_TESTNET_RPC \
  --broadcast \
  --legacy \
  2>&1)

# Extract contract address from logs
B402_RELAYER=$(echo "$DEPLOY_OUTPUT" | grep -o "B402Relayer deployed at: 0x[a-fA-F0-9]*" | grep -o "0x[a-fA-F0-9]*")

if [ -z "$B402_RELAYER" ]; then
    echo "❌ Failed to deploy contract"
    echo "$DEPLOY_OUTPUT"
    exit 1
fi

echo "✅ B402Relayer deployed at: $B402_RELAYER"
echo "🔗 View on BSCScan:"
echo "   https://testnet.bscscan.com/address/$B402_RELAYER"
echo ""

# Save addresses
cat > ../b402-addresses.json <<EOF
{
  "network": "bsc-testnet",
  "chainId": 97,
  "b402Relayer": "$B402_RELAYER",
  "usdt": "$USDT_TESTNET",
  "deployer": "$DEPLOYER_ADDRESS"
}
EOF

echo "📝 Addresses saved to b402-addresses.json"
echo ""

# Setup facilitator
cd ../b402-facilitator

echo "3️⃣ Setting up facilitator service..."

cat > .env <<EOF
RELAYER_PRIVATE_KEY=$DEPLOYER_KEY
B402_RELAYER_ADDRESS=$B402_RELAYER
BSC_TESTNET_RPC_URL=$BSC_TESTNET_RPC
PORT=3402
EOF

echo "✅ Facilitator configured"
echo ""

# Start facilitator in background
echo "4️⃣ Starting facilitator service..."
npm run build > /dev/null 2>&1

nohup npm start > facilitator.log 2>&1 &
FACILITATOR_PID=$!

echo "✅ Facilitator started (PID: $FACILITATOR_PID)"
echo "📡 Logs: b402-facilitator/facilitator.log"
echo ""

# Wait for facilitator to start
sleep 3

# Test health
echo "5️⃣ Testing facilitator health..."
HEALTH=$(curl -s http://localhost:3402/health)
echo "  Response: $HEALTH"

if echo "$HEALTH" | grep -q "healthy"; then
    echo "✅ Facilitator is healthy!"
else
    echo "❌ Facilitator not responding"
    cat facilitator.log
    kill $FACILITATOR_PID
    exit 1
fi

echo ""

# Create test script
cd ..

cat > test-b402-live.ts <<EOF
import { Wallet, Contract, parseUnits, JsonRpcProvider } from 'ethers';
import { processPayment, DefaultFacilitatorClient } from './packages/b402-sdk/src';

const BSC_TESTNET_RPC = "https://data-seed-prebsc-1-s1.binance.org:8545";
const USDT_TESTNET = "$USDT_TESTNET";
const B402_RELAYER = "$B402_RELAYER";
const DEPLOYER_KEY = "$DEPLOYER_KEY";

const USDT_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
];

async function main() {
  console.log('\\n🔥 b402 Live Test - BSC Testnet\\n');

  const provider = new JsonRpcProvider(BSC_TESTNET_RPC);
  const wallet = new Wallet(DEPLOYER_KEY, provider);

  console.log('👤 Wallet:', wallet.address);
  console.log('📝 B402 Relayer:', B402_RELAYER);
  console.log('💵 USDT:', USDT_TESTNET);
  console.log('');

  // Check USDT balance
  const usdt = new Contract(USDT_TESTNET, USDT_ABI, wallet);
  const balance = await usdt.balanceOf(wallet.address);
  console.log('💰 USDT Balance:', balance.toString());

  if (balance === 0n) {
    console.log('⚠️  No USDT found. You need testnet USDT to test payments.');
    console.log('   Get from: https://testnet.binance.vision/faucet-smart');
    return;
  }

  // Check approval
  const allowance = await usdt.allowance(wallet.address, B402_RELAYER);
  console.log('✅ Current Allowance:', allowance.toString());

  if (allowance < parseUnits('1', 18)) {
    console.log('\\n📝 Approving USDT...');
    const approveTx = await usdt.approve(B402_RELAYER, parseUnits('1000', 18));
    console.log('   Tx:', approveTx.hash);
    await approveTx.wait();
    console.log('✅ Approved!');
  }

  // Create payment
  console.log('\\n💸 Creating payment authorization...');
  const paymentAmount = parseUnits('1', 18); // 1 USDT

  const requirements = {
    scheme: "exact" as const,
    network: "bsc-testnet" as const,
    asset: USDT_TESTNET,
    payTo: wallet.address, // Sending to self for test
    maxAmountRequired: paymentAmount.toString(),
    maxTimeoutSeconds: 600,
    relayerContract: B402_RELAYER,
  };

  // Sign (0 gas!)
  const payload = await processPayment(requirements, wallet);
  console.log('✅ Signed!');
  console.log('   Nonce:', payload.payload.authorization.nonce);
  console.log('   Signature:', payload.payload.signature.slice(0, 20) + '...');

  // Verify
  console.log('\\n🔍 Verifying signature...');
  const facilitator = new DefaultFacilitatorClient({ url: 'http://localhost:3402' });

  const verifyResult = await facilitator.verify(payload, requirements);
  if (!verifyResult.isValid) {
    console.error('❌ Verification failed:', verifyResult.invalidReason);
    process.exit(1);
  }
  console.log('✅ Verified!');

  // Settle
  console.log('\\n💰 Settling payment on-chain...');
  console.log('⏳ Waiting for transaction...');

  const settleResult = await facilitator.settle(payload, requirements);
  if (!settleResult.success) {
    console.error('❌ Settlement failed:', settleResult.errorReason);
    process.exit(1);
  }

  console.log('✅ Payment settled!');
  console.log('   Transaction:', settleResult.transaction);
  console.log('   Block:', settleResult.blockNumber);
  console.log('\\n🔗 View on BSCScan:');
  console.log('   https://testnet.bscscan.com/tx/' + settleResult.transaction);

  console.log('\\n🎉 Test completed successfully!\\n');
}

main().catch(console.error);
EOF

echo "6️⃣ Created test script: test-b402-live.ts"
echo ""

echo "✅ DEPLOYMENT COMPLETE!"
echo ""
echo "=========================================="
echo "📋 Summary"
echo "=========================================="
echo ""
echo "Contract:"
echo "  B402Relayer: $B402_RELAYER"
echo "  https://testnet.bscscan.com/address/$B402_RELAYER"
echo ""
echo "Facilitator:"
echo "  URL: http://localhost:3402"
echo "  PID: $FACILITATOR_PID"
echo "  Health: http://localhost:3402/health"
echo ""
echo "Test Wallet:"
echo "  Address: $DEPLOYER_ADDRESS"
echo "  Private Key: $DEPLOYER_KEY"
echo ""
echo "Next Steps:"
echo "  1. Get testnet USDT: https://testnet.binance.vision/faucet-smart"
echo "  2. Run test: npx tsx test-b402-live.ts"
echo "  3. Stop facilitator: kill $FACILITATOR_PID"
echo ""
echo "🔥 Ready for livestream demo! 🚀"
echo ""
