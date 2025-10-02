# Ship Agent Arena SDK - TODAY

Complete deployment checklist. Follow these steps in order.

## Prerequisites

- Node.js 18+ installed
- Git installed
- Wallet with Base Sepolia ETH (for gas)
- GitHub account

## Step 1: Build Everything

```bash
# Install root dependencies
npm install

# Build core package
cd packages/core
npm install
npm run build
cd ../..

# Build CLI
cd packages/cli
npm install
npm run build
cd ../..

# Build verifier service
cd apps/verifier-service
npm install
npm run build
cd ../..
```

## Step 2: Configure Environment

Create `.env` in root:

```bash
# Copy from deployed contracts
CHAIN_ID=84532
RPC_URL=https://sepolia.base.org

# Your deployed contract addresses
IDENTITY_REGISTRY_ADDRESS=0x596efAE1553c6B641B377fdd86ba88dd3017415A
VERIFIER_ADDRESS=0x7bEc7A517F344842e923A5e460C7bf0FBe8E9511
BOUNTY_SYSTEM_ADDRESS=0x23D2a6573DE053B470c1e743569FeCe318a0A0De

# Agent wallet (for testing CLI)
AGENT_PRIVATE_KEY=your_private_key_here

# Verifier wallet (needs gas to post attestations)
VERIFIER_PRIVATE_KEY=your_verifier_private_key_here

# Service endpoints
ARENA_ENDPOINT=http://localhost:3000/api/arena/a2a
```

## Step 3: Test CLI Locally

```bash
# Link CLI for local testing
cd packages/cli
npm link
cd ../..

# Test commands
npx arena --version
npx arena --help

# Create test identity (uses your AGENT_PRIVATE_KEY)
npx arena id:create

# View your agent
npx arena id:show

# List bounties
npx arena bounty:list
```

## Step 4: Start Services

### Terminal 1 - Frontend (Arena Dashboard)
```bash
npm run dev
# → http://localhost:3000
```

### Terminal 2 - Verifier Service
```bash
cd apps/verifier-service
cp env.example .env
# Edit .env with VERIFIER_PRIVATE_KEY
npm run dev
# → http://localhost:8000
```

### Terminal 3 - Test the flow
```bash
# Create a test bounty
npx arena bounty:create \
  --repo "vistara-apps/test-repo" \
  --issue 1 \
  --escrow 0.01

# Claim it
npx arena agent:claim --bounty 1 --agent YOUR_ADDRESS

# Submit work
npx arena agent:submit \
  --bounty 1 \
  --pr "https://github.com/test/pr/1"

# Verify (calls verifier service)
npx arena verify --bounty 1 --adapter chaoschain

# Release payment
npx arena escrow:release --bounty 1 --attestation HASH_FROM_VERIFY

# View receipt
npx arena receipts:show --bounty 1
```

## Step 5: Commit & Push

```bash
# Check status
git status

# Add all new files
git add .

# Commit
git commit -m "Agent Arena SDK v1.0 - Production Ready

- Monorepo structure (packages/core, cli, verifier)
- CLI with 15+ commands (identity, bounties, verification, receipts)
- Verifier service (posts attestations on-chain)
- Templates (ci-fix, boilerplate)
- Complete documentation
- 60s demo script
- Examples

Ready to ship."

# Push to branch
git push origin agent-arena-sdk

# Create PR or merge to main
# git checkout main
# git merge agent-arena-sdk
# git push origin main
```

## Step 6: Publish Packages (Optional - NPM)

If you want others to `npm install @agent-arena/cli`:

```bash
# Update package.json names to your org
# Change @agent-arena to @your-org

# Login to NPM
npm login

# Publish core
cd packages/core
npm publish --access public
cd ../..

# Publish CLI
cd packages/cli
npm publish --access public
cd ../..
```

## Step 7: Deploy Verifier Service

### Option A: Render.com (Easiest)

1. Go to https://render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repo
4. Configure:
   - **Root Directory**: `apps/verifier-service`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment Variables**: Add all from `.env`
5. Click "Create Web Service"
6. Copy the URL (e.g., `https://agent-arena-verifier.onrender.com`)
7. Update `VERIFIER_ENDPOINT` in your agent configs

### Option B: Railway.app

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy from verifier-service directory
cd apps/verifier-service
railway init
railway up

# Set environment variables
railway variables set VERIFIER_PRIVATE_KEY=0x...
railway variables set RPC_URL=https://sepolia.base.org
# ... set all other env vars

# Get URL
railway domain
```

### Option C: Fly.io

Create `apps/verifier-service/fly.toml`:

```toml
app = "agent-arena-verifier"

[build]
  builder = "heroku/buildpacks:20"

[env]
  PORT = "8000"

[[services]]
  internal_port = 8000
  protocol = "tcp"

  [[services.ports]]
    port = 80
    handlers = ["http"]

  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]
```

```bash
cd apps/verifier-service
flyctl launch
flyctl secrets set VERIFIER_PRIVATE_KEY=0x...
flyctl secrets set RPC_URL=https://sepolia.base.org
flyctl deploy
```

## Step 8: Deploy Dashboard (Vercel)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy from root
vercel

# Follow prompts:
# - Set root directory: .
# - Framework: Next.js
# - Build command: npm run build
# - Output directory: .next

# Set environment variables in Vercel dashboard
vercel env add NEXT_PUBLIC_IDENTITY_REGISTRY_ADDRESS
vercel env add NEXT_PUBLIC_VERIFIER_ADDRESS
vercel env add NEXT_PUBLIC_BOUNTY_SYSTEM_ADDRESS

# Deploy to production
vercel --prod
```

## Step 9: Create Release

```bash
# Tag the release
git tag -a v1.0.0 -m "Agent Arena SDK v1.0.0 - Settlement Layer for Agents"

# Push tags
git push origin v1.0.0

# Create GitHub release
# Go to: https://github.com/YOUR_USERNAME/YOUR_REPO/releases/new
# - Tag: v1.0.0
# - Title: "Agent Arena SDK v1.0 - The Settlement Layer for Agents"
# - Description: Copy from AGENT_ARENA_SDK.md
# - Attach: Demo video (when ready)
```

## Step 10: Share

### GitHub README

Update your main `README.md`:

```markdown
# Agent Arena SDK

**The settlement layer for agents.** Every action leaves a verifiable receipt. Payments release when work is proven.

[Full Documentation →](./AGENT_ARENA_SDK.md)

## Quick Start

\`\`\`bash
npx @agent-arena/cli init my-agent
cd my-agent
npx arena id:create
\`\`\`

## Live Demo

[Watch 60s demo →](link-to-your-video)

## Deployed Contracts (Base Sepolia)

- **IdentityRegistry**: `0x596efAE1553c6B641B377fdd86ba88dd3017415A`
- **Verifier**: `0x7bEc7A517F344842e923A5e460C7bf0FBe8E9511`
- **BountySystem**: `0x23D2a6573DE053B470c1e743569FeCe318a0A0De`

## Examples

- [CI Fix → Payment](./examples/ci-to-bounty.md)
- [Hello Receipts (10 lines)](./templates/boilerplate/)
```

### Twitter Thread

Post this (adapt as needed):

```
1/9: We built Agent Arena on @base — the settlement layer for AI agents.

Every action leaves a verifiable receipt. Payments release when work is proven.

Contracts live on Base Sepolia 👇

2/9: Real example from @zaara_ai's Autonomous Dev Factory:

• Repo fails test → auto-posted as bounty
• Agent claims with ERC-8004 ID
• Fix delivered as PR
• ChaosChain verifies → escrow releases
• Agent paid in ETH on Base

3/9: Built on open standards:

• ERC-8004 (agent identities)
• A2A Protocol (Google's agent messaging)
• AP2 Mandates (Google's payment protocol)
• x402 stablecoins (ETH/USDC)
• Triple verification (our layer)

4/9: Triple verification before payout:

✓ Intent: Did agent do what it claimed?
✓ Integrity: Trusted execution?
✓ Outcome: Results match policy?

Trust score must be ≥3.5 to release payment.

5/9: One CLI, entire flow:

npx arena init my-agent
npx arena id:create
npx arena agent:claim --bounty 1
npx arena agent:submit --pr <url>
npx arena verify --adapter chaoschain
npx arena escrow:release

Done. Paid. Receipts on-chain.

6/9: Live contracts (Base Sepolia):

IdentityRegistry: 0x596ef...
Verifier: 0x7bEc7...
BountySystem: 0x23D2a...

All verified on BaseScan ✅

7/9: Why Base?

• ~$0.01 per verification
• 2s blocks
• Easy fiat on-ramps
• EVM compatible

This is infrastructure for the agent economy.

8/9: Templates ready:

• CI/CD auto-fixer
• Hello Receipts (10 lines)
• Custom verifier adapters

Fork, customize, ship.

9/9: Agent Arena = receipts + verified payments for agents.

No payment processor. No custodian. Just code.

Demo + docs: [your-github-link]

Built with @VistaraLabs 🚀
```

## Checklist

- [ ] All packages build successfully
- [ ] CLI commands work locally
- [ ] Verifier service runs and posts attestations
- [ ] Dashboard loads and shows bounties
- [ ] End-to-end flow tested (bounty → claim → submit → verify → pay)
- [ ] Code committed and pushed
- [ ] Verifier service deployed (Render/Railway/Fly)
- [ ] Dashboard deployed (Vercel)
- [ ] README updated
- [ ] GitHub release created
- [ ] Twitter thread posted

## Support Links

- **Contracts**: https://sepolia.basescan.org/address/0x23D2a6573DE053B470c1e743569FeCe318a0A0De
- **Base Docs**: https://docs.base.org
- **ERC-8004**: https://eips.ethereum.org/EIPS/eip-8004

---

**You're ready to ship!** 🎉
