import { config as dotenvConfig } from 'dotenv';

// Load environment variables
dotenvConfig();

export const config = {
  // Network configuration
  chainId: parseInt(process.env.CHAIN_ID || '84532'),
  rpcUrl: process.env.RPC_URL || 'https://sepolia.base.org',

  // Contract addresses
  identityRegistryAddress: process.env.IDENTITY_REGISTRY_ADDRESS || '0x596efAE1553c6B641B377fdd86ba88dd3017415A',
  verifierAddress: process.env.VERIFIER_ADDRESS || '0x7bEc7A517F344842e923A5e460C7bf0FBe8E9511',
  bountySystemAddress: process.env.BOUNTY_SYSTEM_ADDRESS || '0x23D2a6573DE053B470c1e743569FeCe318a0A0De',

  // Agent configuration
  agentPrivateKey: process.env.AGENT_PRIVATE_KEY || '',

  // Service endpoints
  verifierEndpoint: process.env.VERIFIER_ENDPOINT || 'http://localhost:8000',
  arenaEndpoint: process.env.ARENA_ENDPOINT || 'http://localhost:3000/api/arena/a2a',

  // GitHub (optional)
  githubToken: process.env.GITHUB_TOKEN || '',
  githubWebhookSecret: process.env.GITHUB_WEBHOOK_SECRET || '',
};

// Validate required config
if (!config.agentPrivateKey && process.argv.length > 2) {
  const command = process.argv[2];
  
  // Only warn for commands that require a private key
  const requiresKey = ['id:create', 'agent:claim', 'agent:submit', 'bounty:create', 'escrow:release', 'envelope:sign'];
  
  if (requiresKey.includes(command)) {
    console.warn('⚠️  AGENT_PRIVATE_KEY not set in environment');
    console.warn('   Add it to .env file or set it in your environment\n');
  }
}
