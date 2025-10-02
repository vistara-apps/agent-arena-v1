#!/bin/bash

# Agent Arena - End-to-End Demo Script
# Run this to create a complete flow on Base Sepolia

set -e

echo "🚀 Agent Arena - End-to-End Demo"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  No .env file found. Creating from example...${NC}"
    cat > .env << EOF
# Agent Arena Demo Configuration
CHAIN_ID=84532
RPC_URL=https://sepolia.base.org

# Deployed Contracts
IDENTITY_REGISTRY_ADDRESS=0x596efAE1553c6B641B377fdd86ba88dd3017415A
VERIFIER_ADDRESS=0x7bEc7A517F344842e923A5e460C7bf0FBe8E9511
BOUNTY_SYSTEM_ADDRESS=0x23D2a6573DE053B470c1e743569FeCe318a0A0De

# Your wallet (needs Base Sepolia ETH)
AGENT_1_PRIVATE_KEY=your_private_key_here
VERIFIER_PRIVATE_KEY=your_verifier_key_here
EOF
    echo -e "${YELLOW}Please edit .env with your private keys${NC}"
    exit 1
fi

# Source environment
source .env

# Check for required vars
if [ -z "$AGENT_1_PRIVATE_KEY" ] || [ "$AGENT_1_PRIVATE_KEY" = "your_private_key_here" ]; then
    echo -e "${YELLOW}⚠️  Please set AGENT_1_PRIVATE_KEY in .env${NC}"
    exit 1
fi

# Get agent address
AGENT_ADDRESS=$(cast wallet address --private-key $AGENT_1_PRIVATE_KEY)
echo -e "${BLUE}Agent Address: ${AGENT_ADDRESS}${NC}"
echo ""

# Check balance
BALANCE=$(cast balance $AGENT_ADDRESS --rpc-url $RPC_URL)
BALANCE_ETH=$(cast --to-unit $BALANCE ether)
echo -e "Balance: ${BALANCE_ETH} ETH"

if (( $(echo "$BALANCE_ETH < 0.01" | bc -l) )); then
    echo -e "${YELLOW}⚠️  Low balance. Get testnet ETH from:${NC}"
    echo "   https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet"
    exit 1
fi

echo ""
echo "=================================="
echo "Starting Demo Flow..."
echo "=================================="
echo ""

# Step 1: Register Agent
echo -e "${BLUE}Step 1: Registering Agent (ERC-8004)...${NC}"
REGISTER_TX=$(cast send $IDENTITY_REGISTRY_ADDRESS \
    "registerAgent(string)" \
    "data:application/json;base64,eyJuYW1lIjoiRGVtbyBBZ2VudCIsInNraWxscyI6WyJjaS1jZCIsImNvZGUtcmV2aWV3Il19" \
    --private-key $AGENT_1_PRIVATE_KEY \
    --rpc-url $RPC_URL \
    --json | jq -r '.transactionHash' 2>/dev/null || echo "")

if [ -n "$REGISTER_TX" ]; then
    echo -e "${GREEN}✓ Agent registered!${NC}"
    echo "  TX: https://sepolia.basescan.org/tx/$REGISTER_TX"
    echo "  Agent ID: erc8004:$AGENT_ADDRESS"
else
    echo -e "${YELLOW}  (Agent may already be registered)${NC}"
fi
echo ""

# Step 2: Create Bounty
echo -e "${BLUE}Step 2: Creating Bounty with 0.01 ETH escrow...${NC}"
BOUNTY_TX=$(cast send $BOUNTY_SYSTEM_ADDRESS \
    "createBounty(string,uint256,address,uint256,string)" \
    "Fix CI/CD pipeline in demo repo" \
    "10000000000000000" \
    "0x0000000000000000000000000000000000000000" \
    $(($(date +%s) + 86400)) \
    "triple_verification" \
    --value 0.01ether \
    --private-key $AGENT_1_PRIVATE_KEY \
    --rpc-url $RPC_URL \
    --json | jq -r '.transactionHash')

echo -e "${GREEN}✓ Bounty created!${NC}"
echo "  TX: https://sepolia.basescan.org/tx/$BOUNTY_TX"
BOUNTY_ID=1
echo "  Bounty ID: $BOUNTY_ID"
echo ""

# Wait for confirmation
sleep 5

# Step 3: Claim Bounty
echo -e "${BLUE}Step 3: Claiming Bounty...${NC}"
CLAIM_TX=$(cast send $BOUNTY_SYSTEM_ADDRESS \
    "claimBounty(uint256)" \
    $BOUNTY_ID \
    --private-key $AGENT_1_PRIVATE_KEY \
    --rpc-url $RPC_URL \
    --json | jq -r '.transactionHash')

echo -e "${GREEN}✓ Bounty claimed!${NC}"
echo "  TX: https://sepolia.basescan.org/tx/$CLAIM_TX"
echo ""

# Wait for confirmation
sleep 5

# Step 4: Submit Work
echo -e "${BLUE}Step 4: Submitting Work...${NC}"
SUBMIT_TX=$(cast send $BOUNTY_SYSTEM_ADDRESS \
    "submitWork(uint256,string)" \
    $BOUNTY_ID \
    "ipfs://QmWorkResultDemo123" \
    --private-key $AGENT_1_PRIVATE_KEY \
    --rpc-url $RPC_URL \
    --json | jq -r '.transactionHash')

echo -e "${GREEN}✓ Work submitted!${NC}"
echo "  TX: https://sepolia.basescan.org/tx/$SUBMIT_TX"
echo ""

# Wait for confirmation
sleep 5

# Step 5: Post Verification (if verifier key provided)
if [ -n "$VERIFIER_PRIVATE_KEY" ] && [ "$VERIFIER_PRIVATE_KEY" != "your_verifier_key_here" ]; then
    echo -e "${BLUE}Step 5: Posting Verification Attestation...${NC}"
    
    ATTESTATION_HASH="0x$(openssl rand -hex 32)"
    
    VERIFY_TX=$(cast send $VERIFIER_ADDRESS \
        "postAttestation(address,uint256,bytes32,uint8,string,bool,bool,bool)" \
        $AGENT_ADDRESS \
        $BOUNTY_ID \
        $ATTESTATION_HASH \
        45 \
        "" \
        true \
        true \
        true \
        --private-key $VERIFIER_PRIVATE_KEY \
        --rpc-url $RPC_URL \
        --json | jq -r '.transactionHash')
    
    echo -e "${GREEN}✓ Verification posted!${NC}"
    echo "  TX: https://sepolia.basescan.org/tx/$VERIFY_TX"
    echo "  Trust Score: 4.5/5.0"
    echo "  All layers passed: ✓ Intent ✓ Integrity ✓ Outcome"
    echo ""
    
    # Wait for confirmation
    sleep 5
    
    # Step 6: Release Payment
    echo -e "${BLUE}Step 6: Releasing Payment...${NC}"
    RELEASE_TX=$(cast send $BOUNTY_SYSTEM_ADDRESS \
        "approveBounty(uint256,bytes32)" \
        $BOUNTY_ID \
        $ATTESTATION_HASH \
        --private-key $AGENT_1_PRIVATE_KEY \
        --rpc-url $RPC_URL \
        --json | jq -r '.transactionHash')
    
    echo -e "${GREEN}✓ Payment released!${NC}"
    echo "  TX: https://sepolia.basescan.org/tx/$RELEASE_TX"
    echo "  Agent paid: 0.01 ETH"
else
    echo -e "${YELLOW}Step 5-6: Skipping verification/payment (no VERIFIER_PRIVATE_KEY)${NC}"
    echo "  Set VERIFIER_PRIVATE_KEY in .env to complete full flow"
fi

echo ""
echo "=================================="
echo -e "${GREEN}✅ Demo Complete!${NC}"
echo "=================================="
echo ""
echo "Summary:"
echo "--------"
echo "1. Agent Registered: https://sepolia.basescan.org/tx/$REGISTER_TX"
echo "2. Bounty Created:   https://sepolia.basescan.org/tx/$BOUNTY_TX"
echo "3. Bounty Claimed:   https://sepolia.basescan.org/tx/$CLAIM_TX"
echo "4. Work Submitted:   https://sepolia.basescan.org/tx/$SUBMIT_TX"

if [ -n "$VERIFY_TX" ]; then
    echo "5. Verified:         https://sepolia.basescan.org/tx/$VERIFY_TX"
    echo "6. Paid:             https://sepolia.basescan.org/tx/$RELEASE_TX"
fi

echo ""
echo "View all transactions on BaseScan:"
echo "https://sepolia.basescan.org/address/$BOUNTY_SYSTEM_ADDRESS"
echo ""
