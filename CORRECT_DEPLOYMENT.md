# ✅ CORRECT Deployment: Using Official ERC-8004 Singletons

## 🎯 Key Understanding

**We DON'T deploy our own ERC-8004 contracts!**

The official ERC-8004 team has already deployed **singletons** on multiple chains. Everyone uses the same contracts.

## Why Singletons Matter

### ❌ WRONG: Deploy Your Own
```
You deploy IdentityRegistry → 0xYourContract
Platform B deploys IdentityRegistry → 0xTheirContract
```
**Problem:** Agents on your registry can't be seen by Platform B. No portability!

### ✅ CORRECT: Use Singletons
```
You use → 0x8004AA...  (official singleton)
Platform B uses → 0x8004AA... (SAME contract)
Platform C uses → 0x8004AA... (SAME contract)
```
**Result:** Agents registered by anyone work everywhere!

## Official ERC-8004 Singleton Addresses

### Base Sepolia (Testnet)
```
Identity Registry:    0x8004AA63c570c570eBF15376c0dB199918BFe9Fb
Reputation Registry:  0x8004bd8daB57f14Ed299135749a5CB5c42d341BF
Validation Registry:  0x8004C269D0A5647E51E121FeB226200ECE932d55
```

**Explorer Links:**
- [Identity](https://sepolia.basescan.org/address/0x8004AA63c570c570eBF15376c0dB199918BFe9Fb)
- [Reputation](https://sepolia.basescan.org/address/0x8004bd8daB57f14Ed299135749a5CB5c42d341BF)
- [Validation](https://sepolia.basescan.org/address/0x8004C269D0A5647E51E121FeB226200ECE932d55)

### Other Networks

**Ethereum Sepolia:**
- Identity: `0x8004a6090Cd10A7288092483047B097295Fb8847`
- Reputation: `0x8004B8FD1A363aa02fDC07635C0c5F94f6Af5B7E`
- Validation: `0x8004CB39f29c09145F24Ad9dDe2A108C1A2cdfC5`

**Linea Sepolia:**
- Identity: `0x8004aa7C931bCE1233973a0C6A667f73F66282e7`
- Reputation: `0x8004bd8483b99310df121c46ED8858616b2Bba02`
- Validation: `0x8004c44d1EFdd699B2A26e781eF7F77c56A9a4EB`

**Base Mainnet:** Coming by end of October 2025

## What We Deploy

**ONLY our BountySystem contract:**

```solidity
contract BountySystemERC8004 {
    // Use the official singletons
    IdentityRegistry public immutable identityRegistry;
    ReputationRegistry public immutable reputationRegistry;
    ValidationRegistry public immutable validationRegistry;

    constructor(
        address _identityRegistry,  // 0x8004AA... (official)
        address _reputationRegistry, // 0x8004bd... (official)
        address _validationRegistry  // 0x8004C2... (official)
    ) {
        identityRegistry = IdentityRegistry(_identityRegistry);
        reputationRegistry = ReputationRegistry(_reputationRegistry);
        validationRegistry = ValidationRegistry(_validationRegistry);
    }

    // Our bounty logic...
}
```

## Deployment Command

```bash
cd contracts-foundry

# This deploys ONLY BountySystem
# Uses official ERC-8004 singletons
./deploy.sh
```

**Or manually:**
```bash
forge script script/DeployBountySystemOnly.s.sol:DeployBountySystemOnly \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --broadcast \
  --verify \
  -vvvv
```

## What You Get

```
Official ERC-8004 (shared by everyone):
  Identity:    0x8004AA63c570c570eBF15376c0dB199918BFe9Fb
  Reputation:  0x8004bd8daB57f14Ed299135749a5CB5c42d341BF
  Validation:  0x8004C269D0A5647E51E121FeB226200ECE932d55

Your Deployment:
  BountySystem: 0xYourAddress
```

## Why This Is Powerful

### Example 1: Agent Portability

```
Day 1: Alice registers on YOUR platform
→ Calls: identityRegistry.register()
→ Gets: Agent NFT #42 (on singleton)

Day 30: Alice joins Platform B
→ Platform B reads: identityRegistry.ownerOf(42)
→ Sees: Alice owns agent #42
→ Platform B reads: reputationRegistry.getSummary(42)
→ Sees: "95/100 average, 10 reviews"
→ Alice gets premium access instantly!
```

### Example 2: Shared Reputation

```
Platform A (Agent Arena):
  Agent #42 completes bounty
  → reputationRegistry.giveFeedback(42, 95, ...)

Platform B (Agent Marketplace):
  Agent #42 applies for job
  → Reads: reputationRegistry.getSummary(42)
  → Sees: "95/100, 1 review from Platform A"
  → Trusts agent based on cross-platform reputation
```

### Example 3: Cross-Platform Validation

```
Platform A requests validation:
  → validationRegistry.validationRequest(zkML, agentId: 42, ...)

Platform B checks validation:
  → validationRegistry.getValidationStatus(requestHash)
  → Sees: "92/100 zkML verified"
  → Trusts the validation from Platform A
```

## The Network Effect

```
10 agents on singleton → Low value
100 agents on singleton → Some value
1000 agents on singleton → High value
10,000 agents on singleton → Ecosystem!
```

**Everyone benefits when everyone uses the same registry.**

## Governance

### Testnet (Current)
- Controlled by ERC-8004 team
- Can be updated for testing
- Subject to change

### Mainnet (Coming Soon)
- Multi-sig governance
- NOT controlled by ERC-8004 team alone
- Community-driven
- Immutable after launch

## Testing on Testnet

```bash
# 1. Register agent (uses singleton)
cast send 0x8004AA63c570c570eBF15376c0dB199918BFe9Fb \
  "register(string)(uint256)" \
  "ipfs://myAgentCard" \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY

# 2. Check on ANY platform that uses ERC-8004
# All platforms see the same agent!
```

## Resources

**Official Sources:**
- Repo: https://github.com/erc-8004/erc-8004-contracts
- Spec: https://eips.ethereum.org/EIPS/eip-8004
- Website: https://8004.org

**SDKs:**
- JS: https://github.com/ChaosChain/chaoschain/tree/main/packages/sdk
- Python: https://pypi.org/project/chaoschain-sdk/

**Contact:**
- Davide Crapis: davide.crapis@ethereum.org (governance)
- Leonard Tan: @lentan (deployments)

## Deploy Now!

```bash
export PRIVATE_KEY="your_key"
cd contracts-foundry
./deploy.sh
```

You'll deploy ONE contract (BountySystem) that connects to the official ERC-8004 ecosystem! 🚀

---

**Remember:** We're building ON TOP of ERC-8004, not replacing it!
