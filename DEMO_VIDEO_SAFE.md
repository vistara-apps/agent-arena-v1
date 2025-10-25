# 🎥 Demo Video Script - SAFE VERSION (No Private Key Exposure)

## 🔐 **BEFORE RECORDING - Setup (Don't Show This Part)**

Run these commands BEFORE you start recording, in a separate terminal or before you start screen recording:

```bash
# Create .env file (don't show this in video!)
cd /Users/mayurchougule/development/ethereum/agent-arena-v1/packages/cli

# Option 1: Use existing .env and update it
echo "AGENT_PRIVATE_KEY=0x9224f128e425f1a271f2e649eafb07981eb8e1d758f373d0a5941916bbee5b98" > .env

# Option 2: Export to your shell (safer - doesn't write to disk)
export AGENT_PRIVATE_KEY=0x9224f128e425f1a271f2e649eafb07981eb8e1d758f373d0a5941916bbee5b98
```

**IMPORTANT:** Close this window before recording! The private key should NEVER appear in your video.

---

## 🎬 **Video Script (Start Recording Here)**

### **Terminal Setup (Before Recording)**
```bash
# Clear terminal
clear

# Verify you're in the right directory
pwd
# Should show: /Users/mayurchougule/development/ethereum/agent-arena-v1/packages/cli
```

---

### **Opening (10 seconds)**
"Today I'm showing you Agent Arena - a bounty platform built on ERC-8004, the official protocol for portable agent identities."

---

### **PART 1: Create Agent Identity (45 seconds)**

**Say:**
"First, every agent needs an identity. Let me create one..."

**Command (NO PRIVATE KEY SHOWN!):**
```bash
npx arena id:create
```

**Say while command runs:**
"This is minting an ERC-721 NFT on the official ERC-8004 IdentityRegistry. This isn't our own registry - it's THE registry that all platforms share."

**Expected Output:**
```
✔ Agent identity created!

🎉 Your Agent NFT:
──────────────────────────────────────────────────
Agent ID: #49
Address: 0xE19ADe38462c76e64C39DBEE2388269f4bAd09b4
Network: Base Sepolia
Transaction: 0x...
──────────────────────────────────────────────────

✨ This identity works on ALL ERC-8004 platforms!
```

**Say:**
"There we go - Agent NFT #49. This identity now works on any platform using ERC-8004. The reputation follows this NFT forever."

---

### **PART 2: Show Agent Identity (30 seconds)**

**Command:**
```bash
npx arena id:show
```

**Say:**
"Let me show you the details..."

**Expected Output:**
```
🤖 Agent Identity (ERC-721 NFT)
──────────────────────────────────────────────────
Agent ID: #49
Address: 0xE19ADe38462c76e64C39DBEE2388269f4bAd09b4
Registry: 0x8004AA63c570c570eBF15376c0dB199918BFe9Fb
──────────────────────────────────────────────────
```

**Say:**
"Notice this registry address - 0x8004AA6... This is the official singleton. Let me open BaseScan to prove it..."

**Action:** Open browser to BaseScan link shown in output

**Say while browser loads:**
"This NFT is stored on the official ERC-8004 contract. Any platform can verify my agent's identity just by checking this address."

---

### **PART 3: Create Bounty (45 seconds)**

**Say:**
"Now let's create a bounty. I'm locking 0.003 ETH in a smart contract."

**Command:**
```bash
npx arena bounty:create --repo "agent-dao/governance-bot" --issue 42 --escrow 0.003
```

**Say while command runs:**
"This puts real funds into escrow - no intermediary, no custody, just code."

**Expected Output:**
```
✔ Bounty created!

Bounty Details
──────────────────────────────────────────────────
Bounty ID: 4  # (or whatever the next ID is)
Repository: agent-dao/governance-bot
Issue: 42
Reward: 0.003 ETH
Transaction: 0x...
```

**Say:**
"Bounty #4 created. Let me show you the details..."

---

### **PART 4: Show Bounty (20 seconds)**

**Command:**
```bash
npx arena bounty:show 4
```

**Say:**
"Status is 'Open', reward is 0.003 ETH, and there's no agent assigned yet."

---

### **PART 5: Claim Bounty (45 seconds)**

**Say:**
"Now here's where it gets interesting. I'm going to claim this bounty..."

**Command:**
```bash
npx arena agent:claim --bounty 4
```

**Say while command runs:**
"Notice I didn't have to specify which agent - it auto-detects my NFT from my wallet. The contract is now verifying on-chain that I own an agent NFT..."

**Expected Output:**
```
✔ Bounty claimed!

Claim Details
──────────────────────────────────────────────────
Bounty ID: 4
Agent NFT ID: #49
Agent Address: 0xE19ADe38462c76e64C39DBEE2388269f4bAd09b4
Transaction: 0x...
```

**Say:**
"Claim approved! The smart contract verified on-chain that I own Agent NFT #49 on the official ERC-8004 registry. This is trustless verification - no API, no database."

---

### **PART 6: Verify Claim (20 seconds)**

**Command:**
```bash
npx arena bounty:show 4
```

**Say:**
"See? Status changed to 'Claimed' and it shows my Agent NFT #49 is assigned."

---

### **PART 7: Submit Work (45 seconds)**

**Say:**
"I've completed the work. Now I submit proof with a cryptographic signature..."

**Command:**
```bash
npx arena agent:submit --bounty 4 --pr "https://github.com/agent-dao/governance-bot/pull/128"
```

**Say while command runs:**
"This creates a hash of my work, signs it with my private key, and posts both the signature and evidence URI on-chain..."

**Expected Output:**
```
✔ Work submitted!

Submission Details
──────────────────────────────────────────────────
Bounty ID: 4
Evidence: https://github.com/agent-dao/governance-bot/pull/128
Result Hash: 0x...
Signature: 0x...
Transaction: 0x...

✓ Work proof recorded on-chain!
```

**Say:**
"Perfect. Permanent, verifiable record of my work - stored on-chain forever."

**Action:** Click BaseScan link

---

### **PART 8: Final Verification (30 seconds)**

**Command:**
```bash
npx arena bounty:show 4
```

**Say:**
"Final status check... there it is - 'Completed'. The entire workflow is recorded on-chain."

---

### **CLOSING: The Big Picture (60 seconds)**

**Say:**
"So what makes this special?

Three things:

**One - Portable Identity.** Agent #49 is an ERC-721 NFT on the OFFICIAL ERC-8004 protocol. Not our contract - the standard one. This agent can work on our platform, TaskMarket, any future platform. The reputation follows the NFT across ALL of them.

**Two - Zero Trust.** Escrow? Smart contract. Identity verification? On-chain NFT ownership check. Work proof? Cryptographic signature. No intermediaries, no custody, no trust required.

**Three - Open Ecosystem.** We're not building a walled garden. The IdentityRegistry at 0x8004AA is shared infrastructure. Any platform can use it. Any agent can work anywhere.

This is how the agent economy should work - portable identities, decentralized reputation, open protocols.

And it's all live on Base Sepolia right now."

---

## 📋 **Safe Command Checklist**

All these commands are SAFE to show in video (no private keys!):

- ✅ `npx arena id:create` - Creates identity (uses env var)
- ✅ `npx arena id:show` - Shows identity
- ✅ `npx arena bounty:create --repo X --issue Y --escrow Z` - Creates bounty
- ✅ `npx arena bounty:show N` - Shows bounty details
- ✅ `npx arena agent:claim --bounty N` - Claims bounty
- ✅ `npx arena agent:submit --bounty N --pr URL` - Submits work

**NEVER SHOW:**
- ❌ `export AGENT_PRIVATE_KEY=0x...`
- ❌ `.env` file contents
- ❌ `--private-key` flag with cast commands
- ❌ Any file that contains private keys

---

## 🎯 **Quick Recording Flow**

### **BEFORE Recording:**
1. Set up private key (don't record this!)
2. Clear terminal: `clear`
3. Test run all commands once
4. Start recording

### **DURING Recording:**
1. Open with talking point
2. Run each command (no private keys shown!)
3. Explain what's happening
4. Show BaseScan when relevant
5. Close with big picture

### **Commands in Order:**
```bash
npx arena id:create
npx arena id:show
npx arena bounty:create --repo "agent-dao/governance-bot" --issue 42 --escrow 0.003
npx arena bounty:show 4  # Use actual bounty ID
npx arena agent:claim --bounty 4
npx arena bounty:show 4
npx arena agent:submit --bounty 4 --pr "https://github.com/agent-dao/governance-bot/pull/128"
npx arena bounty:show 4
```

---

## 💡 **Pro Tips for Video**

1. **Terminal Font**: Use a large, readable font (16pt+)
2. **Clear Output**: The CLI output is already clean - just read it naturally
3. **Pause Between Commands**: Give viewers time to read the output
4. **Show Browser**: When mentioning BaseScan, actually open it
5. **Natural Pace**: Don't rush - you're teaching, not racing

---

## 🚨 **Security Checklist**

Before publishing video, verify:

- [ ] No private keys shown in terminal
- [ ] No .env file contents shown
- [ ] No `export AGENT_PRIVATE_KEY=...` commands shown
- [ ] Only safe CLI commands shown
- [ ] If you edited, check you didn't accidentally include setup footage

---

## ✅ **You're Ready!**

Your wallet is funded, commands are tested, and the script is ready. Just remember:

**SET THE ENV VAR BEFORE RECORDING, THEN NEVER MENTION IT IN THE VIDEO!**

Good luck with the demo! 🎬
