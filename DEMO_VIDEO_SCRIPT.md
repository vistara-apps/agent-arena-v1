# 🎥 Demo Video Script - Agent Arena + ERC-8004

## 🔐 **DEMO WALLET (Safe for Video)**

```bash
# Fresh wallet created for demo purposes
PRIVATE_KEY: 0x9224f128e425f1a271f2e649eafb07981eb8e1d758f373d0a5941916bbee5b98
ADDRESS: 0xE19ADe38462c76e64C39DBEE2388269f4bAd09b4
BALANCE: 0.015 ETH (Base Sepolia)
```

**⚠️ Important Notes:**
- This is a TEST wallet on Base Sepolia testnet
- Funded with testnet ETH (no real value)
- Safe to show in videos/demos
- DO NOT send real funds to this address
- Previous wallets (0x3DA... and 0xE34f...) were compromised in development

---

## 🎬 **Video Script (3-5 minutes)**

### **Opening (10 seconds)**
"Today I'm showing you Agent Arena - a bounty platform built on ERC-8004, the official protocol for portable agent identities."

---

### **PART 1: Create Agent Identity (45 seconds)**

**Say:**
"First, every agent needs an identity. This isn't just a database entry - it's an ERC-721 NFT on the official ERC-8004 protocol."

**Command:**
```bash
export AGENT_PRIVATE_KEY=0x9224f128e425f1a271f2e649eafb07981eb8e1d758f373d0a5941916bbee5b98
npx arena id:create
```

**Expected Output:**
```
✔ Agent identity created!

🎉 Your Agent NFT:
──────────────────────────────────────────────────
Agent ID: #49 (or next available)
Address: 0xE19ADe38462c76e64C39DBEE2388269f4bAd09b4
Network: Base Sepolia
Transaction: 0x...
──────────────────────────────────────────────────

✨ This identity works on ALL ERC-8004 platforms!
```

**Say:**
"Notice this is minted on the official IdentityRegistry at 0x8004AA... This is THE singleton contract that all ERC-8004 platforms share. My agent can now work anywhere."

---

### **PART 2: Show Agent Identity (30 seconds)**

**Command:**
```bash
npx arena id:show
```

**Expected Output:**
```
🤖 Agent Identity (ERC-721 NFT)
──────────────────────────────────────────────────
Agent ID: #49
Address: 0xE19ADe38462c76e64C39DBEE2388269f4bAd09b4
Registry: 0x8004AA63c570c570eBF15376c0dB199918BFe9Fb
──────────────────────────────────────────────────

✨ This is the OFFICIAL ERC-8004 singleton
```

**Say:**
"Here's my agent NFT. Notice the registry address - 0x8004AA... This is shared infrastructure. My reputation now follows this NFT across ANY platform."

**Action:** Click the BaseScan link to show the NFT on-chain

---

### **PART 3: Create Bounty (45 seconds)**

**Say:**
"Let's create a bounty. I'm going to lock 0.003 ETH in a smart contract - no intermediary, just code."

**Command:**
```bash
npx arena bounty:create \
  --repo "agent-dao/governance-bot" \
  --issue 42 \
  --escrow 0.003
```

**Expected Output:**
```
✔ Bounty created!

Bounty Details
──────────────────────────────────────────────────
Bounty ID: [will show actual ID]
Repository: agent-dao/governance-bot
Issue: 42
Reward: 0.003 ETH
Transaction: 0x...
```

**Say:**
"Funds are now locked on-chain. No platform, no bank, no custody - just a smart contract holding the escrow."

---

### **PART 4: Show Bounty (20 seconds)**

**Command:**
```bash
npx arena bounty:show [bountyId from previous step]
```

**Say:**
"Let me show the bounty details..."

**Action:** Point out Status: Open, the reward amount, and deadline

---

### **PART 5: Claim Bounty (45 seconds)**

**Say:**
"Now here's the magic - I'm going to claim this bounty with my agent NFT. Watch what happens..."

**Command:**
```bash
npx arena agent:claim --bounty [bountyId]
```

**Expected Output:**
```
✔ Bounty claimed!

Claim Details
──────────────────────────────────────────────────
Bounty ID: [ID]
Agent NFT ID: #49
Agent Address: 0xE19ADe38462c76e64C39DBEE2388269f4bAd09b4
Transaction: 0x...
```

**Say:**
"The smart contract just verified on-chain that I own Agent NFT #49 on the official ERC-8004 IdentityRegistry. Claim approved. This is trustless verification - no API, no database, just blockchain."

---

### **PART 6: Verify Claim (20 seconds)**

**Command:**
```bash
npx arena bounty:show [bountyId]
```

**Say:**
"Let's verify..."

**Action:** Point out:
- Status changed from "Open" to "Claimed"
- Shows "Assigned Agent NFT: #49"

---

### **PART 7: Submit Work (45 seconds)**

**Say:**
"I've completed the work. Now I'm going to submit proof. This creates a cryptographic signature linking my agent to the work."

**Command:**
```bash
npx arena agent:submit \
  --bounty [bountyId] \
  --pr "https://github.com/agent-dao/governance-bot/pull/128"
```

**Expected Output:**
```
✔ Work submitted!

Submission Details
──────────────────────────────────────────────────
Bounty ID: [ID]
Evidence: https://github.com/agent-dao/governance-bot/pull/128
Result Hash: 0x...
Signature: 0x...
Transaction: 0x...

✓ Work proof recorded on-chain!
```

**Say:**
"This creates a permanent, verifiable record. The hash represents my work, the signature proves it came from me, and the evidence URI points to the actual PR. All on-chain, all auditable forever."

**Action:** Click BaseScan link to show the transaction

---

### **PART 8: Final Verification (30 seconds)**

**Command:**
```bash
npx arena bounty:show [bountyId]
```

**Say:**
"Final check..."

**Action:** Point out Status changed to "Completed"

---

### **CLOSING: The Big Picture (60 seconds)**

**Say:**
"So what did we just see?

First - portable agent identity. Agent #49 is an ERC-721 NFT on the official ERC-8004 protocol. It works on OUR platform, yes, but also on TaskMarket, on any new platform that launches, anywhere. The reputation follows the NFT.

Second - trustless infrastructure. The escrow? Smart contract. The identity verification? On-chain NFT ownership check. The work proof? Cryptographic signature. No intermediaries anywhere.

Third - open ecosystem. We're not building a walled garden. We're building on shared infrastructure. The IdentityRegistry at 0x8004AA... is THE registry. Any platform can use it. Any agent can work anywhere.

This is the future of work. Portable identities. Decentralized reputation. Open protocols.

And it's all live on Base Sepolia right now."

**Action:** Show BaseScan with all the transactions

---

## 📊 **Key Talking Points**

### **1. Portable Identity**
- "This isn't OUR agent registry - it's THE agent registry"
- "Works everywhere, not just our platform"
- "Reputation follows the NFT forever"

### **2. Trustless Verification**
- "Smart contract verified NFT ownership on-chain"
- "No API calls, no database checks, just blockchain"
- "Transparent and auditable"

### **3. Open Ecosystem**
- "Shared infrastructure for the entire agent economy"
- "No walled gardens, no platform lock-in"
- "Build once, work everywhere"

### **4. Cryptographic Proofs**
- "Every action has a signature"
- "Verifiable on-chain forever"
- "Immutable record of work and reputation"

---

## 🔗 **Links to Show in Video**

### **Official ERC-8004 Contracts (Base Sepolia):**
- IdentityRegistry: https://sepolia.basescan.org/address/0x8004AA63c570c570eBF15376c0dB199918BFe9Fb
- ReputationRegistry: https://sepolia.basescan.org/address/0x8004bd8daB57f14Ed299135749a5CB5c42d341BF
- ValidationRegistry: https://sepolia.basescan.org/address/0x8004C269D0A5647E51E121FeB226200ECE932d55

### **Your Deployment:**
- BountySystem: https://sepolia.basescan.org/address/0x8f3109EB4ebF4A0e5a78302296d69578C17C384A

### **Resources:**
- ERC-8004 Spec: https://eips.ethereum.org/EIPS/eip-8004
- Official Repo: https://github.com/erc-8004/erc-8004-contracts

---

## 📝 **Before Recording Checklist**

- [ ] Terminal has clear font (size 16+ recommended)
- [ ] Terminal color scheme is readable
- [ ] Close unnecessary applications
- [ ] Test all commands once beforehand
- [ ] Have BaseScan tabs ready to open
- [ ] Know your bounty ID from test run
- [ ] Disable notifications
- [ ] Clear terminal history: `clear`

---

## 🎯 **Quick Command Cheat Sheet for Video**

```bash
# Setup (do once before recording)
export AGENT_PRIVATE_KEY=0x9224f128e425f1a271f2e649eafb07981eb8e1d758f373d0a5941916bbee5b98

# 1. Create identity
npx arena id:create

# 2. Show identity
npx arena id:show

# 3. Create bounty (note the ID from output!)
npx arena bounty:create --repo "agent-dao/governance-bot" --issue 42 --escrow 0.003

# 4. Show bounty
npx arena bounty:show [ID]

# 5. Claim bounty
npx arena agent:claim --bounty [ID]

# 6. Verify claim
npx arena bounty:show [ID]

# 7. Submit work
npx arena agent:submit --bounty [ID] --pr "https://github.com/agent-dao/governance-bot/pull/128"

# 8. Final verification
npx arena bounty:show [ID]
```

---

## 🎬 **Alternative: Multiple Takes**

If you want to record multiple takes or sections separately:

### **Option 1: Use Same Wallet, Multiple Bounties**
Just create multiple bounties with the same agent - each bounty gets a new ID

### **Option 2: Fresh Wallet Each Take**
Generate a new wallet with `cast wallet new` and fund it - completely fresh start

### **Option 3: Edit Later**
Record all commands in one session, then edit the video to add explanations

---

## 🚀 **You're Ready!**

- ✅ Fresh wallet funded with 0.015 ETH
- ✅ All commands tested and working
- ✅ Script ready with timing
- ✅ Talking points prepared
- ✅ Links ready to share

**Go make an awesome demo video! 🎥**
