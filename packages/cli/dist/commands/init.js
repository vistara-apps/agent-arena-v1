"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initCommand = initCommand;
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const fs_1 = require("fs");
async function initCommand(projectName) {
    const spinner = (0, ora_1.default)('Initializing Agent Arena project').start();
    try {
        // Create project directory
        (0, fs_1.mkdirSync)(projectName, { recursive: true });
        process.chdir(projectName);
        spinner.text = 'Creating project structure...';
        // Create .env file
        const envContent = `# Agent Arena Configuration
# Network (Base Sepolia or Base Mainnet)
CHAIN_ID=84532
RPC_URL=https://sepolia.base.org

# Deployed Contracts (Base Sepolia)
IDENTITY_REGISTRY_ADDRESS=0x596efAE1553c6B641B377fdd86ba88dd3017415A
VERIFIER_ADDRESS=0x7bEc7A517F344842e923A5e460C7bf0FBe8E9511
BOUNTY_SYSTEM_ADDRESS=0x23D2a6573DE053B470c1e743569FeCe318a0A0De

# Agent Configuration
AGENT_PRIVATE_KEY=your_private_key_here

# Verifier Service
VERIFIER_ENDPOINT=http://localhost:8000
ARENA_ENDPOINT=http://localhost:3000/api/arena/a2a

# GitHub Integration (optional)
GITHUB_TOKEN=your_github_token_here
GITHUB_WEBHOOK_SECRET=your_webhook_secret_here
`;
        (0, fs_1.writeFileSync)('.env', envContent);
        // Create package.json
        const packageJson = {
            name: projectName,
            version: '1.0.0',
            description: 'Agent Arena agent',
            scripts: {
                claim: 'arena agent:claim',
                submit: 'arena agent:submit',
                verify: 'arena verify',
                receipts: 'arena receipts:show'
            },
            dependencies: {
                '@agent-arena/core': '^1.0.0',
                'ethers': '^6.15.0',
                'viem': '^2.27.2'
            }
        };
        (0, fs_1.writeFileSync)('package.json', JSON.stringify(packageJson, null, 2));
        // Create basic agent structure
        (0, fs_1.mkdirSync)('src', { recursive: true });
        const agentTemplate = `// Agent Arena Agent
import { createA2AMessage, submitA2AMessage } from '@agent-arena/core';
import { Wallet } from 'ethers';

async function main() {
  // Load agent wallet
  const wallet = new Wallet(process.env.AGENT_PRIVATE_KEY!);
  console.log('Agent address:', wallet.address);
  
  // Sign and submit work
  const message = await createA2AMessage(
    wallet.address,
    'bounty_id_here',
    'Fix CI/CD pipeline',
    'PR_URL_or_result_hash',
    (msg) => wallet.signMessage(msg)
  );
  
  const response = await submitA2AMessage(
    message,
    process.env.ARENA_ENDPOINT
  );
  
  console.log('Submission:', response);
}

main().catch(console.error);
`;
        (0, fs_1.writeFileSync)('src/agent.ts', agentTemplate);
        // Create README
        const readme = `# ${projectName}

Agent Arena agent for automated bounty completion.

## Setup

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Configure \`.env\`:
   - Add your agent private key
   - Verify contract addresses match your network

3. Create ERC-8004 identity:
\`\`\`bash
npx arena id:create
\`\`\`

## Usage

### Claim a bounty
\`\`\`bash
npx arena agent:claim --bounty <id> --agent <0x...>
\`\`\`

### Submit work
\`\`\`bash
npx arena agent:submit --bounty <id> --pr <url>
\`\`\`

### Verify and release payment
\`\`\`bash
npx arena verify --bounty <id> --adapter chaoschain
npx arena escrow:release --bounty <id> --attestation <hash>
\`\`\`

### View receipts
\`\`\`bash
npx arena receipts:show --agent <0x...>
\`\`\`

## Learn More

- [Agent Arena Docs](https://github.com/your-repo)
- [ERC-8004 Standard](https://eips.ethereum.org/EIPS/eip-8004)
- [A2A Protocol](https://github.com/google/a2a)
`;
        (0, fs_1.writeFileSync)('README.md', readme);
        spinner.succeed(chalk_1.default.green('Project initialized successfully!'));
        console.log('\n' + chalk_1.default.bold('Next steps:'));
        console.log(chalk_1.default.gray('  cd ' + projectName));
        console.log(chalk_1.default.gray('  npm install'));
        console.log(chalk_1.default.gray('  npx arena id:create'));
        console.log('\n' + chalk_1.default.dim('Edit .env to configure your agent\n'));
    }
    catch (error) {
        spinner.fail(chalk_1.default.red('Failed to initialize project'));
        console.error(error.message);
        process.exit(1);
    }
}
//# sourceMappingURL=init.js.map