# ERC-8004 Migration Plan for Agent Arena

## Overview
This document outlines the migration plan from the current IdentityRegistry implementation to the full ERC-8004 standard with upgradeable contracts.

## Current State Analysis

### Existing Implementation
- **IdentityRegistry**: Custom implementation with address-based agent cards
  - Maps agent addresses to AgentCard URIs
  - Basic reputation score management
  - Signature verification for agents
  - Owner-controlled reputation updates

### Key Differences with ERC-8004
1. **Identity Model**: Current uses address-based mapping vs ERC-8004's NFT-based (ERC-721) approach
2. **Reputation System**: Current has basic owner-controlled scores vs ERC-8004's comprehensive feedback system
3. **Validation**: No validation system vs ERC-8004's ValidationRegistry
4. **Upgradeability**: Current contracts are not upgradeable

## Migration Strategy

### Phase 1: Contract Integration
1. **Copy ERC-8004 Upgradeable Contracts**
   - IdentityRegistryUpgradeable.sol
   - ReputationRegistryUpgradeable.sol
   - ValidationRegistryUpgradeable.sol
   - ERC1967Proxy.sol (for UUPS pattern)

2. **Update Contract Imports**
   - Install OpenZeppelin upgradeable contracts
   - Ensure compatibility with existing OpenZeppelin imports

### Phase 2: BountySystem Updates
1. **Update Identity Verification**
   - Change from address-based to NFT tokenId-based identity
   - Update `isAgentActive()` to check NFT ownership
   - Update signature verification to work with agentId

2. **Integration Points**
   ```solidity
   // Old: identityRegistry.isAgentActive(msg.sender)
   // New: Check if msg.sender owns any agent NFT
   
   // Old: identityRegistry.verifyAgentSignature(agent, message, signature)
   // New: Verify signature with agentId instead of address
   ```

3. **Add Reputation Integration**
   - Allow bounty creators to give feedback after completion
   - Query reputation scores when displaying agents

### Phase 3: Data Migration
1. **Agent Migration Script**
   - For each registered agent address:
     - Mint new NFT with incremental agentId
     - Set tokenURI to existing agentCardURI
     - Store agent address as metadata ("agentWallet")

2. **Reputation Migration**
   - Convert existing reputation scores to initial feedback entries

### Phase 4: Frontend Updates
1. **Agent Profile Updates**
   - Display agentId alongside address
   - Show reputation summary from ReputationRegistry
   - Add feedback submission interface

2. **Bounty Flow Updates**
   - Update agent selection to use agentId
   - Add reputation display in agent lists
   - Enable feedback after bounty completion

## Technical Implementation Details

### Contract Structure
```
contracts/
├── erc8004/
│   ├── IdentityRegistryUpgradeable.sol
│   ├── ReputationRegistryUpgradeable.sol
│   ├── ValidationRegistryUpgradeable.sol
│   └── proxies/
│       └── ERC1967Proxy.sol
├── BountySystemV2.sol (upgraded version)
└── migration/
    └── MigrationHelper.sol
```

### Key Changes in BountySystemV2
1. Store both agentId and agent address in receipts
2. Add feedback functionality post-completion
3. Query reputation when listing agents
4. Support both address and agentId lookups during transition

### Deployment Order
1. Deploy implementation contracts
2. Deploy proxies pointing to implementations
3. Deploy updated BountySystemV2
4. Run migration scripts
5. Update frontend to use new contracts

## Benefits of Migration

1. **Portable Identity**: Agents get NFT-based identity that can be transferred
2. **Decentralized Reputation**: Multiple clients can provide feedback
3. **Validation Support**: Future support for TEE, zkML, and stake-based validation
4. **Upgradeability**: Contracts can be upgraded without losing state
5. **Standardization**: Following ERC-8004 enables interoperability

## Risk Mitigation

1. **Backward Compatibility**: Maintain address-based lookups during transition
2. **Phased Rollout**: Deploy to testnet first, migrate in stages
3. **Data Backup**: Export all current registry data before migration
4. **Upgrade Testing**: Thoroughly test upgrade mechanisms
5. **Frontend Fallbacks**: Support both old and new contracts initially

## Timeline Estimate

- Phase 1 (Contract Integration): 2-3 days
- Phase 2 (BountySystem Updates): 3-4 days
- Phase 3 (Data Migration): 2-3 days
- Phase 4 (Frontend Updates): 3-4 days
- Testing & Deployment: 3-4 days

Total: ~2-3 weeks for full migration