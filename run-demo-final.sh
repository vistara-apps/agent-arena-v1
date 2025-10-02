#!/bin/bash
# FINAL WORKING DEMO - End to End Agent Arena Flow

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}╔══════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Agent Arena - End-to-End Demo             ║${NC}"
echo -e "${BLUE}║   Base Sepolia Testnet                       ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════╝${NC}"
echo ""

# Load environment
source .env

AGENT_ADDRESS=$(cast wallet address --private-key $AGENT_1_PRIVATE_KEY)
echo -e "${BLUE}🤖 Agent Address: ${AGENT_ADDRESS}${NC}"
echo ""

# Step 1: Register Agent
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 1: Register Agent (ERC-8004 Identity)${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

IS_ACTIVE=$(cast call $IDENTITY_REGISTRY_ADDRESS "isAgentActive(address)(bool)" $AGENT_ADDRESS --rpc-url $RPC_URL)

if [ "$IS_ACTIVE" = "false" ]; then
    echo "Registering agent..."
    TX=$(cast send $IDENTITY_REGISTRY_ADDRESS \
        "registerAgent(string)" \
        "data:application/json;base64,eyJuYW1lIjoiVml0YWxpa0RlbW8iLCJza2lsbHMiOlsiU29saWRpdHkiLCJaS1AiXX0=" \
        --private-key $AGENT_1_PRIVATE_KEY \
        --rpc-url $RPC_URL \
        --json | jq -r '.transactionHash')
    echo -e "${GREEN}✓ Agent registered!${NC}"
    echo -e "  TX: https://sepolia.basescan.org/tx/$TX"
    sleep 3
else
    echo -e "${GREEN}✓ Agent already registered${NC}"
fi
echo ""

# Step 2: Create Bounty with Escrow
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 2: Create Bounty with 0.01 ETH Escrow${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

BOUNTY_DESC="Fix CI/CD test failure in repo #$(date +%s)"
REWARD="10000000000000000"  # 0.01 ETH
DEADLINE=$(($(date +%s) + 86400))  # 24 hours

echo "Creating bounty: '$BOUNTY_DESC'"
TX=$(cast send $BOUNTY_SYSTEM_ADDRESS \
    "createBounty(string,uint256,address,uint256,string)" \
    "$BOUNTY_DESC" \
    "$REWARD" \
    "0x0000000000000000000000000000000000000000" \
    "$DEADLINE" \
    "chaoschain" \
    --value 0.01ether \
    --private-key $AGENT_1_PRIVATE_KEY \
    --rpc-url $RPC_URL \
    --json | jq -r '.transactionHash')

echo -e "${GREEN}✓ Bounty created!${NC}"
echo -e "  TX: https://sepolia.basescan.org/tx/$TX"

sleep 5
BOUNTY_ID=$(cast receipt $TX --rpc-url $RPC_URL --json | jq -r '.logs[0].topics[1]' | cast --to-dec)
echo -e "  ${GREEN}Bounty ID: #$BOUNTY_ID${NC}"
echo ""

# Step 3: Submit Work Receipt (with correct signature)
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 3: Agent Submits Work Receipt${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Work completed
TASK_REF="https://github.com/test-repo/pull/1"
RESULT_HASH_STRING="SHA256:1697b5a24ec74344bd00a9e4ddb7032a742893fb1dc820b65f8b8275bbf0aaa2"

echo "Task: $TASK_REF"
echo "Result: $RESULT_HASH_STRING"
echo ""

# Create signature: keccak256(abi.encodePacked(bountyId, resultHash))
echo "Signing work..."
echo "  Bounty ID: $BOUNTY_ID"
echo "  Result Hash: $RESULT_HASH_STRING"

# abi.encodePacked(uint256, string) = 32 bytes bountyId + utf8 bytes of string
BOUNTY_HEX=$(printf "%064x" $BOUNTY_ID)
RESULT_HEX=$(echo -n "$RESULT_HASH_STRING" | xxd -p -c 256)
MESSAGE_HASH=$(echo -n "${BOUNTY_HEX}${RESULT_HEX}" | xxd -r -p | cast keccak)
echo "  Message Hash: $MESSAGE_HASH"

# Sign with agent's private key (EIP-191 prefixed - what ECDSA.recover expects)
SIGNATURE=$(cast wallet sign $MESSAGE_HASH --private-key $AGENT_1_PRIVATE_KEY)
echo "  Signature: ${SIGNATURE:0:20}...${SIGNATURE: -10}"
echo ""

# Submit receipt (taskInputRefs is string[], resultHash is string)
echo "Submitting receipt on-chain..."
TX=$(cast send $BOUNTY_SYSTEM_ADDRESS \
    "submitReceipt(uint256,string[],string,bytes,string)" \
    "$BOUNTY_ID" \
    "[\"$TASK_REF\"]" \
    "$RESULT_HASH_STRING" \
    "$SIGNATURE" \
    "ipfs://result-data" \
    --private-key $AGENT_1_PRIVATE_KEY \
    --rpc-url $RPC_URL \
    --json | jq -r '.transactionHash')

echo -e "${GREEN}✓ Work receipt submitted!${NC}"
echo -e "  TX: https://sepolia.basescan.org/tx/$TX"
echo ""

# Step 4: Approve and Release Payment
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 4: Bounty Creator Approves & Releases Payment${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

sleep 3

echo "Approving bounty completion..."
TX=$(cast send $BOUNTY_SYSTEM_ADDRESS \
    "approveBounty(uint256)" \
    "$BOUNTY_ID" \
    --private-key $AGENT_1_PRIVATE_KEY \
    --rpc-url $RPC_URL \
    --json | jq -r '.transactionHash')

echo -e "${GREEN}✓ Bounty approved and payment released!${NC}"
echo -e "  TX: https://sepolia.basescan.org/tx/$TX"
echo ""

# Summary
echo -e "${GREEN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║        ✨ DEMO COMPLETE - SUCCESS! ✨         ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}What Just Happened:${NC}"
echo "1. ✅ Agent registered with ERC-8004 identity"
echo "2. ✅ Bounty created with 0.01 ETH in escrow"
echo "3. ✅ Agent submitted work with cryptographic proof"
echo "4. ✅ Payment released from escrow to agent"
echo ""
echo -e "${BLUE}View All Transactions:${NC}"
echo "🔍 BountySystem: https://sepolia.basescan.org/address/$BOUNTY_SYSTEM_ADDRESS"
echo "🔍 IdentityRegistry: https://sepolia.basescan.org/address/$IDENTITY_REGISTRY_ADDRESS"
echo ""
echo -e "${YELLOW}This is the complete Agent Arena flow! 🚀${NC}"
echo ""

