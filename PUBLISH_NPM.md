# Publishing Agent Arena to NPM

## Quick Publish (for Davide/EF to test)

### Step 1: Update package.json files with proper names

```bash
# packages/core/package.json
{
  "name": "@agent-arena/core",
  "version": "0.1.0-alpha.1",
  "description": "Core types and protocols for Agent Arena - ERC-8004 identity & A2A protocol",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": ["dist", "README.md"],
  "repository": {
    "type": "git",
    "url": "https://github.com/vistara-apps/agent-arena-v1"
  }
}

# packages/cli/package.json
{
  "name": "@agent-arena/cli",
  "version": "0.1.0-alpha.1",
  "description": "CLI for Agent Arena - create bounties, register agents, verify work",
  "bin": {
    "arena": "dist/cli.js"
  }
}
```

### Step 2: Build packages

```bash
cd packages/core
npm run build
cd ../cli
npm run build
```

### Step 3: Publish to NPM

```bash
# Login to npm (one time)
npm login

# Publish core
cd packages/core
npm publish --access public

# Publish CLI
cd ../cli
npm publish --access public
```

### Step 4: Test installation

```bash
npx @agent-arena/cli@latest --version
```

## Alternative: Publish as Beta for Quick Testing

If you want EF to test without polluting npm:

```bash
# Publish with beta tag
npm publish --access public --tag beta

# They can install with:
npx @agent-arena/cli@beta
```

## What Davide Can Test (3 minutes)

```bash
# 1. Install CLI
npx @agent-arena/cli@latest init my-agent

# 2. See deployed contracts on Base Sepolia
cd my-agent
cat .env

# 3. Register an agent
npx @agent-arena/cli id:create

# 4. View bounties
npx @agent-arena/cli bounty:list

# 5. Check receipts
npx @agent-arena/cli receipts:show
```

## Current Status

✅ **Working:**
- Contracts deployed on Base Sepolia
- Agent registration (ERC-8004)
- Bounty creation with ETH escrow
- Work submission with signatures
- Payment release
- Full end-to-end demo

⚠️ **Not Yet Published:**
- NPM packages (need to publish)
- CLI not yet on npm

🚧 **Known WIP:**
- Frontend USDC integration (UI ready, approval flow needed)
- CLI commands are stubs (need contract integration)
- Verifier service (structure ready, needs implementation)

## Quick Commands

```bash
# If they have the repo
git clone https://github.com/vistara-apps/agent-arena-v1
cd agent-arena-v1
./run-demo-final.sh

# View live transactions
open https://sepolia.basescan.org/address/0x77aec5be0c7ad4f67ffe73dc8c01590ca86fb750
```

