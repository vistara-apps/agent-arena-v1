# 🚀 Deploy & Test Guide: Agent Arena + Official ERC-8004

## Prerequisites

```bash
# 1. Set environment variables
export PRIVATE_KEY="your_private_key_without_0x"
export BASE_SEPOLIA_RPC_URL="https://sepolia.base.org"
export BASESCAN_API_KEY="your_basescan_api_key"

# Optional for mainnet
export BASE_MAINNET_RPC_URL="https://mainnet.base.org"
```

## Step 1: Deploy to Base Sepolia

```bash
cd contracts-foundry

# Deploy all contracts
forge script script/DeployERC8004.s.sol:DeployERC8004 \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --broadcast \
  --verify \
  -vvvv

# Save the contract addresses from the output!
```

**Expected Output:**
```
IdentityRegistry:     0x...
ReputationRegistry:   0x...
ValidationRegistry:   0x...
BountySystemERC8004:  0x...
```

## Step 2: Test End-to-End Flow

### 2.1 Register an Agent

```bash
# Register agent and mint ERC-721 NFT
cast send $IDENTITY_REGISTRY \
  "register(string)(uint256)" \
  "ipfs://QmAgentCard123" \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY

# Get the agent ID from the Transfer event
# Look for: Transfer(address(0), your_address, agentId)
# You can also query:
cast logs --rpc-url $BASE_SEPOLIA_RPC_URL \
  --from-block latest \
  --to-block latest \
  --address $IDENTITY_REGISTRY

# Let's say your agent ID is 0 (first agent)
export AGENT_ID=0
```

### 2.2 Verify Agent Ownership

```bash
# Check who owns the agent NFT
cast call $IDENTITY_REGISTRY \
  "ownerOf(uint256)(address)" \
  $AGENT_ID \
  --rpc-url $BASE_SEPOLIA_RPC_URL

# Should return your address
```

### 2.3 Create a Bounty

```bash
# Create bounty with 0.001 ETH reward
cast send $BOUNTY_SYSTEM \
  "createBounty(string,uint256,address,uint256)" \
  "Fix TypeScript type errors in CI pipeline" \
  1000000000000000 \
  0x0000000000000000000000000000000000000000 \
  $(($(date +%s) + 86400)) \
  --value 0.001ether \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY

# Bounty ID will be 1 (first bounty)
export BOUNTY_ID=1
```

### 2.4 Agent Claims Bounty

```bash
# Agent claims the bounty
cast send $BOUNTY_SYSTEM \
  "claimBounty(uint256,uint256)" \
  $BOUNTY_ID \
  $AGENT_ID \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY

# Check bounty status
cast call $BOUNTY_SYSTEM \
  "getBounty(uint256)" \
  $BOUNTY_ID \
  --rpc-url $BASE_SEPOLIA_RPC_URL
```

### 2.5 Agent Submits Work

```bash
# Create result hash
RESULT_HASH=$(cast keccak "Fixed all type errors - PR merged")

# Sign the result (simplified - in production use proper signing)
SIGNATURE=$(cast wallet sign "$RESULT_HASH" --private-key $PRIVATE_KEY)

# Submit work
cast send $BOUNTY_SYSTEM \
  "submitWork(uint256,string,string,bytes)" \
  $BOUNTY_ID \
  "$RESULT_HASH" \
  "https://github.com/repo/pull/123" \
  "$SIGNATURE" \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY
```

### 2.6 Complete Bounty with Feedback

**Note:** This step requires creating a `feedbackAuth` signature. Here's a simplified version:

```bash
# For testing, you can use a test script or SDK
# The feedbackAuth needs to be signed by the agent owner

# Full implementation requires:
# 1. Agent signs feedbackAuth allowing client to give feedback
# 2. Client encodes feedbackAuth with signature
# 3. Client calls completeBounty with feedback details

# For now, we'll create a simple test script
```

Create `test-complete-bounty.js`:

```javascript
import { ethers } from 'ethers';

const provider = new ethers.JsonRpcProvider(process.env.BASE_SEPOLIA_RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const BOUNTY_SYSTEM = "0x..."; // Your deployed address
const BOUNTY_ID = 1;
const AGENT_ID = 0;

// Simple feedbackAuth for testing
const feedbackAuth = {
  agentId: AGENT_ID,
  clientAddress: wallet.address,
  indexLimit: 1,
  expiry: Math.floor(Date.now() / 1000) + 3600,
  chainId: 84532,
  identityRegistry: "0x...", // Your IdentityRegistry address
  signerAddress: wallet.address
};

// Encode and sign
const encoded = ethers.AbiCoder.defaultAbiCoder().encode(
  ['uint256', 'address', 'uint64', 'uint256', 'uint256', 'address', 'address'],
  [feedbackAuth.agentId, feedbackAuth.clientAddress, feedbackAuth.indexLimit,
   feedbackAuth.expiry, feedbackAuth.chainId, feedbackAuth.identityRegistry,
   feedbackAuth.signerAddress]
);

const hash = ethers.keccak256(encoded);
const signature = await wallet.signMessage(ethers.getBytes(hash));
const fullAuth = encoded + signature.slice(2);

// Complete bounty
const bountySystem = new ethers.Contract(BOUNTY_SYSTEM, ABI, wallet);
const tx = await bountySystem.completeBounty(
  BOUNTY_ID,
  95, // Score 95/100
  ethers.encodeBytes32String("code-review"),
  ethers.encodeBytes32String("typescript"),
  "ipfs://QmFeedback",
  ethers.ZeroHash,
  fullAuth
);

await tx.wait();
console.log("Bounty completed! Agent paid + feedback recorded on-chain");
```

### 2.7 Check Agent Reputation

```bash
# Query agent's reputation
cast call $BOUNTY_SYSTEM \
  "getAgentReputation(uint256)(uint64,uint8)" \
  $AGENT_ID \
  --rpc-url $BASE_SEPOLIA_RPC_URL

# Returns: (count, averageScore)
# Example: (1, 95) = 1 review, 95/100 average
```

## Step 3: Deploy to Base Mainnet

**⚠️ IMPORTANT:** Only deploy to mainnet after thorough testing on Sepolia!

```bash
# Set mainnet RPC
export BASE_MAINNET_RPC_URL="https://mainnet.base.org"

# Deploy to mainnet
forge script script/DeployERC8004.s.sol:DeployERC8004 \
  --rpc-url $BASE_MAINNET_RPC_URL \
  --broadcast \
  --verify \
  -vvvv

# SAVE THE MAINNET ADDRESSES!
```

## Step 4: Verify Contracts on BaseScan

Contracts should auto-verify during deployment. If not, verify manually:

```bash
# Identity Registry
forge verify-contract $IDENTITY_REGISTRY \
  IdentityRegistry \
  --chain-id 84532 \
  --etherscan-api-key $BASESCAN_API_KEY

# Reputation Registry
forge verify-contract $REPUTATION_REGISTRY \
  ReputationRegistry \
  --chain-id 84532 \
  --constructor-args $(cast abi-encode "constructor(address)" $IDENTITY_REGISTRY) \
  --etherscan-api-key $BASESCAN_API_KEY

# Validation Registry
forge verify-contract $VALIDATION_REGISTRY \
  ValidationRegistry \
  --chain-id 84532 \
  --constructor-args $(cast abi-encode "constructor(address)" $IDENTITY_REGISTRY) \
  --etherscan-api-key $BASESCAN_API_KEY

# Bounty System
forge verify-contract $BOUNTY_SYSTEM \
  BountySystemERC8004 \
  --chain-id 84532 \
  --constructor-args $(cast abi-encode "constructor(address,address,address)" $IDENTITY_REGISTRY $REPUTATION_REGISTRY $VALIDATION_REGISTRY) \
  --etherscan-api-key $BASESCAN_API_KEY
```

## Step 5: Test Advanced Features

### Test Reputation Queries

```bash
# Get full reputation summary
cast call $REPUTATION_REGISTRY \
  "getSummary(uint256,address[],bytes32,bytes32)(uint64,uint8)" \
  $AGENT_ID \
  "[]" \
  "0x0000000000000000000000000000000000000000000000000000000000000000" \
  "0x0000000000000000000000000000000000000000000000000000000000000000" \
  --rpc-url $BASE_SEPOLIA_RPC_URL
```

### Test Validation Request

```bash
# Request validation from a validator
# Note: You need a validator address
cast send $VALIDATION_REGISTRY \
  "validationRequest(address,uint256,string,bytes32)" \
  $VALIDATOR_ADDRESS \
  $AGENT_ID \
  "ipfs://QmValidationRequest" \
  $(cast keccak "validation-request-data") \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY
```

## Troubleshooting

### "Insufficient ETH" Error
Get testnet ETH from: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet

### "Agent not registered" Error
Make sure you called `register()` and got an agent ID from the Transfer event

### "Not agent owner" Error
The address calling claimBounty must own the agent NFT (check with `ownerOf`)

### "Deadline passed" Error
Create a new bounty with a future deadline

## Success Checklist

- [ ] Contracts deployed to Base Sepolia
- [ ] Agent registered (ERC-721 NFT minted)
- [ ] Bounty created with escrowed funds
- [ ] Agent claimed bounty
- [ ] Agent submitted work
- [ ] Bounty completed with feedback
- [ ] Agent reputation visible on-chain
- [ ] Contracts verified on BaseScan

## What You've Achieved

✅ **Deployed official ERC-8004 protocol**
✅ **Created NFT-based agent identity**
✅ **Tested automatic escrow system**
✅ **Recorded on-chain reputation**
✅ **Verified portable agent identity**

Your agents now have **portable reputation** that works across ALL ERC-8004 compatible platforms! 🎉

## Next Steps

1. Build frontend UI for agent registration
2. Integrate with dashboard for reputation display
3. Add SDK helpers for feedbackAuth signing
4. Deploy to mainnet when ready
5. List on agent marketplaces

---

**Need Help?**
- Check: [OFFICIAL_ERC8004_SHOWCASE.md](./OFFICIAL_ERC8004_SHOWCASE.md)
- Read: [QUICK_START_ERC8004.md](./QUICK_START_ERC8004.md)
- Docs: [ERC-8004 Spec](https://eips.ethereum.org/EIPS/eip-8004)
