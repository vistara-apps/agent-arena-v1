"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = require("dotenv");
// Load environment variables
(0, dotenv_1.config)();
// Official ERC-8004 Singleton Addresses
const ERC8004_SINGLETONS = {
    baseSepolia: {
        identityRegistry: '0x8004AA63c570c570eBF15376c0dB199918BFe9Fb',
        reputationRegistry: '0x8004bd8daB57f14Ed299135749a5CB5c42d341BF',
        validationRegistry: '0x8004C269D0A5647E51E121FeB226200ECE932d55',
    },
    // Base Mainnet addresses (coming by end of October 2025)
    baseMainnet: {
        identityRegistry: '0x8004AA63c570c570eBF15376c0dB199918BFe9Fb', // TBA
        reputationRegistry: '0x8004bd8daB57f14Ed299135749a5CB5c42d341BF', // TBA
        validationRegistry: '0x8004C269D0A5647E51E121FeB226200ECE932d55', // TBA
    }
};
exports.config = {
    // Network configuration
    chainId: parseInt(process.env.CHAIN_ID || '84532'),
    rpcUrl: process.env.RPC_URL || 'https://sepolia.base.org',
    // Contract addresses - Use official ERC-8004 singletons
    identityRegistryAddress: process.env.IDENTITY_REGISTRY_ADDRESS || ERC8004_SINGLETONS.baseSepolia.identityRegistry,
    reputationRegistryAddress: process.env.REPUTATION_REGISTRY_ADDRESS || ERC8004_SINGLETONS.baseSepolia.reputationRegistry,
    validationRegistryAddress: process.env.VALIDATION_REGISTRY_ADDRESS || ERC8004_SINGLETONS.baseSepolia.validationRegistry,
    // Your deployed BountySystem (update this!)
    bountySystemAddress: process.env.BOUNTY_SYSTEM_ADDRESS || '0x8f3109EB4ebF4A0e5a78302296d69578C17C384A',
    // Legacy (keeping for backwards compatibility)
    verifierAddress: process.env.VERIFIER_ADDRESS || '0x7bEc7A517F344842e923A5e460C7bf0FBe8E9511',
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
if (!exports.config.agentPrivateKey && process.argv.length > 2) {
    const command = process.argv[2];
    // Only warn for commands that require a private key
    const requiresKey = ['id:create', 'agent:claim', 'agent:submit', 'bounty:create', 'escrow:release', 'envelope:sign'];
    if (requiresKey.includes(command)) {
        console.warn('⚠️  AGENT_PRIVATE_KEY not set in environment');
        console.warn('   Add it to .env file or set it in your environment\n');
    }
}
//# sourceMappingURL=config.js.map