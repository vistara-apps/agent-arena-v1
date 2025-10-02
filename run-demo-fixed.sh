#!/bin/bash

# Agent Arena - End-to-End Demo Script (Fixed)
# Uses the actual deployed contract functions

set -e

echo "🚀 Agent Arena - End-to-End Demo (Fixed)"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  No .env file found${NC}"
    exit 1
fi

# Source environment
source .env

# Get agent address
AGENT_ADDRESS=$(cast wallet address --private-key $AGENT_1_PRIVATE_KEY)
echo -e "${BLUE}Agent Address: ${AGENT_ADDRESS}${NC}"
echo ""

# Check balance
BALANCE=$(cast balance $AGENT_ADDRESS --rpc-url $RPC_URL)
BALANCE_ETH=$(cast --to-unit $BALANCE ether)
echo -e "Balance: ${BALANCE_ETH} ETH"
echo ""

echo "=========================================="
echo "Demo Flow..."
echo "=========================================="
echo ""

# Step 1: Register Agent (if not already)
echo -e "${BLUE}Step 1: Check Agent Registration...${NC}"
IS_REGISTERED=$(cast call $IDENTITY_REGISTRY_ADDRESS "isAgentActive(address)(bool)" $AGENT_ADDRESS --rpc-url $RPC_URL)

if [ "$IS_REGISTERED" = "false" ]; then
    echo "  Registering agent..."
    REGISTER_TX=$(cast send $IDENTITY_REGISTRY_ADDRESS \
        "registerAgent(string)" \
        "data:application/json;base64,eyJuYW1lIjoiRGVtbyBBZ2VudCIsInNraWxscyI6WyJjaS1jZCIsImNvZGUtcmV2aWV3Il19" \
        --private-key $AGENT_1_PRIVATE_KEY \
        --rpc-url $RPC_URL \
        --json | jq -r '.transactionHash')
    
    echo -e "${GREEN}✓ Agent registered!${NC}"
    echo "  TX: https://sepolia.basescan.org/tx/$REGISTER_TX"
else
    echo -e "${GREEN}✓ Agent already registered${NC}"
    REGISTER_TX="already_registered"
fi
echo "  Agent ID: erc8004:$AGENT_ADDRESS"
echo ""

# Step 2: Create Bounty
echo -e "${BLUE}Step 2: Creating Bounty...${NC}"
BOUNTY_TX=$(cast send $BOUNTY_SYSTEM_ADDRESS \
    "createBounty(string,uint256,address,uint256,string)" \
    "Fix CI/CD pipeline - Demo $(date +%s)" \
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

# Get the bounty ID from the transaction receipt
sleep 5
BOUNTY_ID=$(cast receipt $BOUNTY_TX --rpc-url $RPC_URL --json | jq -r '.logs[0].topics[1]' | cast --to-dec)
echo "  Bounty ID: $BOUNTY_ID"
echo ""

# Step 3: Submit Receipt (combines claim + submit in one transaction)
echo -e "${BLUE}Step 3: Submitting Work Receipt...${NC}"

# Create signature components
RESULT_HASH="QmDemoResultHash$(date +%s)"
TIMESTAMP=$(date +%s)

# Create message hash for signing
MESSAGE_HASH=$(cast keccak "$(echo -n "${BOUNTY_ID}[]${RESULT_HASH}${TIMESTAMP}")")

# Sign the message
SIGNATURE=$(cast wallet sign --private-key $AGENT_1_PRIVATE_KEY "$MESSAGE_HASH" --no-hash)

# Submit receipt
RECEIPT_TX=$(cast send $BOUNTY_SYSTEM_ADDRESS \
    "submitReceipt(uint256,string[],string,bytes,string)" \
    $BOUNTY_ID \
    "[]" \
    $RESULT_HASH \
    $SIGNATURE \
    "ipfs://QmWorkResultDemo$(date +%s)" \
    --private-key $AGENT_1_PRIVATE_KEY \
    --rpc-url $RPC_URL \
    --json | jq -r '.transactionHash')

echo -e "${GREEN}✓ Receipt submitted!${NC}"
echo "  TX: https://sepolia.basescan.org/tx/$RECEIPT_TX"
echo ""

sleep 5

# Step 4: Approve Bounty (as creator)
echo -e "${BLUE}Step 4: Approving Bounty & Releasing Payment...${NC}"

APPROVE_TX=$(cast send $BOUNTY_SYSTEM_ADDRESS \
    "approveBounty(uint256)" \
    $BOUNTY_ID \
    --private-key $AGENT_1_PRIVATE_KEY \
    --rpc-url $RPC_URL \
    --json | jq -r '.transactionHash')

echo -e "${GREEN}✓ Bounty approved & payment released!${NC}"
echo "  TX: https://sepolia.basescan.org/tx/$APPROVE_TX"
echo "  Agent received: ~0.0095 ETH (0.01 - 5% platform fee)"
echo ""

echo "=========================================="
echo -e "${GREEN}✅ Demo Complete!${NC}"
echo "=========================================="
echo ""
echo "Summary:"
echo "--------"
echo "1. Agent Registered: https://sepolia.basescan.org/tx/$REGISTER_TX"
echo "2. Bounty Created:   https://sepolia.basescan.org/tx/$BOUNTY_TX (ID: $BOUNTY_ID)"
echo "3. Receipt Submitted: https://sepolia.basescan.org/tx/$RECEIPT_TX"
echo "4. Payment Released:  https://sepolia.basescan.org/tx/$APPROVE_TX"
echo ""
echo "View bounty on BaseScan:"
echo "https://sepolia.basescan.org/address/$BOUNTY_SYSTEM_ADDRESS"
echo ""
echo "Check agent balance:"
echo "https://sepolia.basescan.org/address/$AGENT_ADDRESS"
echo ""
