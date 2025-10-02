#!/bin/bash
# Working demo - only do what actually works

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

source .env

AGENT_ADDRESS=$(cast wallet address --private-key $AGENT_1_PRIVATE_KEY)
echo -e "${BLUE}Agent: ${AGENT_ADDRESS}${NC}"
echo ""

# Step 1: Check if registered
echo -e "${BLUE}1. Checking agent registration...${NC}"
IS_ACTIVE=$(cast call $IDENTITY_REGISTRY_ADDRESS "isAgentActive(address)(bool)" $AGENT_ADDRESS --rpc-url $RPC_URL)

if [ "$IS_ACTIVE" = "false" ]; then
    echo "Registering..."
    TX=$(cast send $IDENTITY_REGISTRY_ADDRESS \
        "registerAgent(string)" \
        "data:application/json;base64,eyJuYW1lIjoiRGVtbyJ9" \
        --private-key $AGENT_1_PRIVATE_KEY \
        --rpc-url $RPC_URL \
        --json | jq -r '.transactionHash')
    echo -e "${GREEN}✓ Registered: https://sepolia.basescan.org/tx/$TX${NC}"
else
    echo -e "${GREEN}✓ Already registered${NC}"
fi
echo ""

# Step 2: Create Bounty  
echo -e "${BLUE}2. Creating bounty...${NC}"
TX=$(cast send $BOUNTY_SYSTEM_ADDRESS \
    "createBounty(string,uint256,address,uint256,string)" \
    "Demo bounty $(date +%s)" \
    "10000000000000000" \
    "0x0000000000000000000000000000000000000000" \
    $(($(date +%s) + 86400)) \
    "manual" \
    --value 0.01ether \
    --private-key $AGENT_1_PRIVATE_KEY \
    --rpc-url $RPC_URL \
    --json | jq -r '.transactionHash')

echo -e "${GREEN}✓ Created: https://sepolia.basescan.org/tx/$TX${NC}"

sleep 5
BOUNTY_ID=$(cast receipt $TX --rpc-url $RPC_URL --json | jq -r '.logs[0].topics[1]' | cast --to-dec)
echo "  Bounty ID: $BOUNTY_ID"
echo ""

# Step 3: Show what we proved
echo -e "${GREEN}=== WORKING ===${NC}"
echo "1. Agent registered ✓"
echo "2. Bounty created with escrow ✓"
echo "3. ETH locked in contract ✓"
echo ""
echo "Transactions:"
echo "https://sepolia.basescan.org/address/$BOUNTY_SYSTEM_ADDRESS"
echo ""

# Step 4: Explain the signature issue
echo -e "${YELLOW}=== SIGNATURE ISSUE ===${NC}"
echo "submitReceipt() needs signature over:"
echo "  keccak256(bountyId, taskInputRefs, resultHash, block.timestamp)"
echo ""
echo "Problem: We can't predict block.timestamp before tx"
echo ""
echo "Solutions:"
echo "1. Use manual approval (approveBounty by creator)"
echo "2. Change contract to not require timestamp in signature"
echo "3. Use off-chain verification then manual approval"
echo ""
echo "For now: Bounty creator can call approveBounty() after agent submits work"
echo ""
