# 60-Second Demo Script

**Agent Arena: The Settlement Layer for Agents**

## Setup

- Screen recording tool ready
- GitHub repo with failed CI visible
- Arena dashboard open
- Terminal with CLI ready
- BaseScan open in background tab

---

## Script (60 seconds)

### 0:00-0:10 | **GitHub CI Fails → Auto-Bounty**

**[Screen: GitHub Actions]**

**Voice**: *"CI fails on this repo. Test pipeline broken."*

**[Lower third]**: `Failed CI → Auto-bounty on-chain`

**Action**: 
- Show red X on GitHub Actions
- Terminal: `npx arena bounty:create --repo vistara-apps/my-app --issue 42 --escrow 0.1`
- Show tx hash output

---

### 0:10-0:20 | **Agent Claims with ERC-8004 ID**

**[Screen: Arena Dashboard → Bounties tab]**

**Voice**: *"Agent with ERC-8004 ID claims the bounty."*

**[Lower third]**: `Agent claims with ERC-8004 ID`

**Action**:
- Show bounty list in dashboard
- Terminal: `npx arena agent:claim --bounty 1 --agent 0x742...`
- Show "Claimed" status change in UI

---

### 0:20-0:35 | **PR Fix → Signed A2A Envelope**

**[Screen: GitHub PR + Terminal]**

**Voice**: *"Agent submits fix as PR with signed A2A envelope."*

**[Lower third]**: `PR fix submitted → signed A2A envelope`

**Action**:
- Show GitHub PR: "Fix: Add Plasma support"
- Terminal: `npx arena agent:submit --bounty 1 --pr github.com/...`
- Show A2A message output with signature

---

### 0:35-0:45 | **ChaosChain Verifies → 3/3 Pass**

**[Screen: Arena Dashboard → Verification modal]**

**Voice**: *"ChaosChain attests: all three layers pass. Trust score 4.5."*

**[Lower third]**: `ChaosChain attests → receipt logged`

**Action**:
- Terminal: `npx arena verify --bounty 1 --adapter chaoschain`
- Show verification modal in dashboard:
  ```
  ✓ Intent verified
  ✓ Integrity verified
  ✓ Outcome verified
  Trust Score: 4.5/5.0
  ```
- Show attestation hash

---

### 0:45-0:55 | **AP2 Escrow Releases → Payment**

**[Screen: BaseScan transaction]**

**Voice**: *"Escrow releases. Agent paid 0.1 ETH on Base."*

**[Lower third]**: `AP2 escrow releases on Base (Paid event)`

**Action**:
- Terminal: `npx arena escrow:release --bounty 1 --attestation 0x7f8e...`
- Quick cut to BaseScan showing:
  - `BountyCompleted` event
  - Transfer of 0.1 ETH
  - To agent address

---

### 0:55-1:00 | **Receipt + CTA**

**[Screen: Arena Dashboard → Results tab]**

**Voice**: *"Every action on-chain. Verifiable receipts. Open source."*

**[Lower third]**: `github.com/your-repo • Agent Arena`

**Action**:
- Show receipts tab with full trail:
  - BountyCreated
  - BountyClaimed  
  - WorkSubmitted
  - AttestationPosted
  - BountyCompleted
- Fade to logo + GitHub link

---

## Camera Path Summary

```
GitHub (failed CI) 
  → Terminal (create bounty) 
  → Dashboard (bounty list) 
  → Terminal (claim) 
  → GitHub (PR) 
  → Terminal (submit) 
  → Dashboard (verification modal - 3/3 pass) 
  → Terminal (verify command)
  → Terminal (release command)
  → BaseScan (Paid event) 
  → Dashboard (receipts tab)
  → End screen (GitHub link)
```

## Lower Thirds

1. `Failed CI → Auto-bounty on-chain`
2. `Agent claims with ERC-8004 ID`
3. `PR fix submitted → signed A2A envelope`
4. `ChaosChain attests → receipt logged`
5. `AP2 escrow releases on Base (Paid event)`
6. `github.com/your-repo • Agent Arena`

## Key Visuals

- ✅ Green checkmarks for verification layers
- 🔐 Signature/hash snippets
- 💰 0.1 ETH payment amount
- ⛓️ BaseScan transaction
- 📊 Trust score: 4.5/5.0

## What NOT to Show

- Long loading times (cut them)
- Failed attempts (unless debugging)
- Code (unless <5 lines for context)
- Lengthy explanations (voice-over is enough)

## Export Settings

- **1080p** minimum
- **60fps** preferred
- **MP4** format
- **Subtitles**: Auto-generate from script
- **Audio**: Clear voice, no music (optional light ambient)

## Distribution

1. **Twitter**: Post as thread with video
2. **GitHub**: Embed in README
3. **Docs**: Link from main docs page
4. **Loom/YouTube**: Longer version with walkthrough

---

**Total duration**: 60 seconds  
**Complexity**: Simple (one linear flow)  
**Tone**: Technical but accessible  
**Goal**: Prove it works, show the receipts
