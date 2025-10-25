# b402.ai - x402 for BNB Chain

**Gasless payments on BNB Chain using meta-transactions**

## 🔥 What is b402?

b402 is the BNB Chain implementation of the x402 payment protocol. It enables **gasless payments** where creators sign authorizations off-chain (0 gas) and agents settle on-chain.

### Key Features

- ✅ **Gasless for creators** - Sign with wallet, pay 0 gas
- ✅ **Agent settles** - Agent pays gas, gets payment atomically
- ✅ **EIP-712 signatures** - Same security as x402
- ✅ **USDT support** - Works with Binance-Peg USDT
- ✅ **Self-hosted facilitator** - Full control, no dependencies

## Architecture

```
Creator signs authorization (EIP-712) → 0 gas
    ↓
b402 facilitator verifies signature
    ↓
Facilitator calls B402Relayer.transferWithAuthorization()
    ↓
Payment executes on BNB Chain → Agent receives USDT
```

## Quick Start

### 1. Deploy B402Relayer Contract

```bash
# Set environment
export PRIVATE_KEY=your_deployer_key
export BSC_RPC_URL=https://bsc-dataseed.binance.org

# Deploy to BSC testnet first
forge script script/DeployB402.s.sol \
  --rpc-url https://data-seed-prebsc-1-s1.binance.org:8545 \
  --broadcast \
  --verify

# Deploy to BSC mainnet
forge script script/DeployB402.s.sol \
  --rpc-url $BSC_RPC_URL \
  --broadcast \
  --verify
```

### 2. Start Facilitator Service

```bash
cd b402-facilitator

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your values:
# - RELAYER_PRIVATE_KEY (wallet that pays gas)
# - B402_RELAYER_ADDRESS (deployed contract)

# Start service
npm run dev
```

The facilitator will run on `http://localhost:3402`

### 3. Use b402 SDK

```typescript
import { processPayment, DefaultFacilitatorClient, USDT_BSC } from '@vistara/b402-sdk';
import { Wallet } from 'ethers';

// Create payment requirements
const requirements = {
  scheme: "exact",
  network: "bsc",
  asset: USDT_BSC,
  payTo: "0xAgentAddress",
  maxAmountRequired: "100000000000000000000", // 100 USDT (18 decimals)
  maxTimeoutSeconds: 600,
  relayerContract: "0xB402RelayerAddress",
};

// Creator signs (0 gas)
const wallet = new Wallet(creatorPrivateKey);
const payload = await processPayment(requirements, wallet);

// Agent settles via facilitator
const facilitator = new DefaultFacilitatorClient({
  url: 'http://localhost:3402'
});

const verifyResult = await facilitator.verify(payload, requirements);
console.log('Valid:', verifyResult.isValid);

const settleResult = await facilitator.settle(payload, requirements);
console.log('Transaction:', settleResult.transaction);
```

## CLI Integration

The Agent Arena CLI will support b402:

```bash
# Create bounty (no escrow)
npx arena bounty:create:b402 \
  --amount 100 \
  --description "Fix bug" \
  --chain bsc

# Creator approves payment (signs, 0 gas)
npx arena bounty:approve --bounty 1 --chain bsc

# Agent settles (pays gas, receives payment)
npx arena bounty:settle --bounty 1 --chain bsc
```

## Contracts

### B402Relayer.sol

Core contract that mimics EIP-3009's `transferWithAuthorization`:

- **transferWithAuthorization()** - Execute payment with signature
- **authorizationState()** - Check if nonce used
- **cancelAuthorization()** - Cancel pending authorization

Deployed addresses:
- **BSC Testnet**: TBD
- **BSC Mainnet**: TBD

## USDT Addresses

| Network | USDT Address |
|---------|-------------|
| BSC Mainnet | `0x55d398326f99059ff775485246999027b3197955` |
| BSC Testnet | `0x337610d27c682E347C9cD60BD4b3b107C9d34dDd` |

## Important Notes

### ⚠️ Approval Required

Unlike native USDC with EIP-3009, USDT on BSC requires users to call `approve()` first:

```solidity
// User must approve B402Relayer once
USDT.approve(b402RelayerAddress, type(uint256).max);
```

**Then all future payments are gasless signatures!**

### Gas Costs

- **Creator**: 0 gas (just signs message)
- **Facilitator**: ~50,000 gas per settlement (~$0.15 on BSC)
- **Agent**: Can deduct gas fee from payout

## Differences from x402

| Feature | x402 (Base) | b402 (BNB Chain) |
|---------|-------------|------------------|
| Token | Native USDC | Binance-Peg USDT |
| Standard | EIP-3009 built-in | Custom relayer contract |
| Facilitator | CDP/x402.org | Self-hosted |
| Approval | Not needed | One-time approval required |
| Gas costs | ~$0.01 | ~$0.15 |

## Development

```bash
# Build SDK
cd packages/b402-sdk
npm install
npm run build

# Run facilitator
cd b402-facilitator
npm install
npm run dev

# Deploy contracts
cd contracts-foundry
forge build
forge test
```

## Security

- ✅ EIP-712 typed signatures
- ✅ Nonce-based replay protection
- ✅ Time-limited authorizations
- ✅ On-chain signature verification

## Support

- **GitHub**: https://github.com/vistara-labs/b402
- **Docs**: https://b402.ai/docs
- **Discord**: https://discord.gg/vistara

---

Built by [@vistara-labs](https://github.com/vistara-labs) for the agent economy on BNB Chain 🔥
