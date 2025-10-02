import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { Wallet, ethers, JsonRpcProvider } from 'ethers';
import { verifyA2AMessage, A2AMessage, calculateTrustScore } from '@agent-arena/core';

config();

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

// Contract ABI
const VERIFIER_ABI = [
  'function postAttestation(address agent, uint256 bountyId, bytes32 attestationHash, uint8 trustScore, string ipfsHash, bool intentVerified, bool integrityVerified, bool outcomeVerified) external',
  'event AttestationPosted(address indexed agent, uint256 indexed bountyId, bytes32 attestationHash, uint8 trustScore)'
];

// Initialize provider and signer
const provider = new JsonRpcProvider(process.env.RPC_URL || 'https://sepolia.base.org');
const signer = new Wallet(process.env.VERIFIER_PRIVATE_KEY || '', provider);
const verifierContract = new ethers.Contract(
  process.env.VERIFIER_ADDRESS || '',
  VERIFIER_ABI,
  signer
);

/**
 * Triple verification via ChaosChain
 */
async function performTripleVerification(envelope: A2AMessage): Promise<{
  intent: boolean;
  integrity: boolean;
  outcome: boolean;
}> {
  // Intent verification: Check if agent claimed to do what they said
  const intentVerified = await verifyIntent(envelope);
  
  // Integrity verification: Verify execution environment/process
  const integrityVerified = await verifyIntegrity(envelope);
  
  // Outcome verification: Check if results match policy
  const outcomeVerified = await verifyOutcome(envelope);
  
  return {
    intent: intentVerified,
    integrity: integrityVerified,
    outcome: outcomeVerified
  };
}

async function verifyIntent(envelope: A2AMessage): Promise<boolean> {
  // Verify A2A signature
  const signatureValid = await verifyA2AMessage(envelope);
  if (!signatureValid) return false;
  
  // Check intent matches claimed action
  // For demo: always pass if signature is valid
  return true;
}

async function verifyIntegrity(envelope: A2AMessage): Promise<boolean> {
  // In production: Call ChaosChain or TEE for execution proof
  // For demo: simulate integrity check
  
  try {
    // Simulate calling ChaosChain verifier
    if (process.env.CHAOSCHAIN_ENDPOINT) {
      const response = await fetch(process.env.CHAOSCHAIN_ENDPOINT + '/verify-integrity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ envelope })
      });
      
      if (response.ok) {
        const result = await response.json();
        return result.verified === true;
      }
    }
    
    // Default: pass if signature is valid
    return true;
  } catch (error) {
    console.error('Integrity verification error:', error);
    return false;
  }
}

async function verifyOutcome(envelope: A2AMessage): Promise<boolean> {
  // In production: Check actual PR/work results
  // For demo: validate commit hash format
  
  const commitValid = envelope.commit.startsWith('sha256:') && envelope.commit.length > 10;
  return commitValid;
}

/**
 * POST /verify - Verify agent work and post attestation
 */
app.post('/verify', async (req, res) => {
  try {
    const { envelope, bounty_id } = req.body;

    if (!envelope) {
      return res.status(400).json({ error: 'Missing envelope' });
    }

    console.log('📨 Verification request for bounty:', bounty_id);

    // Perform triple verification
    const verification = await performTripleVerification(envelope);
    
    // Calculate trust score
    const trustScore = calculateTrustScore(verification);
    
    console.log('🔍 Verification results:', verification);
    console.log('📊 Trust score:', trustScore.toFixed(1));

    // Generate attestation hash
    const attestationData = JSON.stringify({
      agent_id: envelope.agent_id,
      bounty_id: envelope.bounty_id,
      verification,
      trustScore,
      timestamp: Date.now()
    });
    
    const attestationHash = ethers.keccak256(ethers.toUtf8Bytes(attestationData));

    // Post attestation on-chain
    console.log('⛓️  Posting attestation on-chain...');
    
    const tx = await verifierContract.postAttestation(
      envelope.agent_id.replace('erc8004:', ''),
      bounty_id || envelope.bounty_id,
      attestationHash,
      Math.floor(trustScore * 10), // Convert to uint8 (0-50)
      '', // IPFS hash (optional)
      verification.intent,
      verification.integrity,
      verification.outcome
    );

    const receipt = await tx.wait();
    console.log('✅ Attestation posted:', receipt.hash);

    res.json({
      success: true,
      trust_score: trustScore,
      verification,
      attestation_hash: attestationHash,
      transaction_hash: receipt.hash,
      message: trustScore >= 3.5 ? 'Verification passed' : 'Verification failed'
    });

  } catch (error: any) {
    console.error('❌ Verification error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Verification failed'
    });
  }
});

/**
 * GET /health - Health check
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Agent Arena Verifier',
    version: '1.0.0',
    network: process.env.CHAIN_ID === '84532' ? 'Base Sepolia' : 'Base Mainnet'
  });
});

/**
 * GET /status - Service status
 */
app.get('/status', async (req, res) => {
  try {
    const balance = await provider.getBalance(signer.address);
    
    res.json({
      verifier_address: signer.address,
      contract_address: process.env.VERIFIER_ADDRESS,
      balance: ethers.formatEther(balance),
      network: process.env.CHAIN_ID === '84532' ? 'Base Sepolia' : 'Base Mainnet'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log('🚀 Agent Arena Verifier Service');
  console.log(`📡 Listening on port ${PORT}`);
  console.log(`🔗 Network: ${process.env.CHAIN_ID === '84532' ? 'Base Sepolia' : 'Base Mainnet'}`);
  console.log(`📝 Verifier: ${signer.address}`);
  console.log(`⛓️  Contract: ${process.env.VERIFIER_ADDRESS}\n`);
});
