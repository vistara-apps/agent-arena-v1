"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.idCommand = void 0;
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const ethers_1 = require("ethers");
const config_1 = require("../config");
const IDENTITY_REGISTRY_ABI = [
    'function registerAgent(string cardURI) external',
    'function getAgentCard(address agent) external view returns (string)',
    'function isRegistered(address agent) external view returns (bool)',
    'event AgentRegistered(address indexed agent, string cardURI)'
];
async function createIdentity() {
    const spinner = (0, ora_1.default)('Creating ERC-8004 identity').start();
    try {
        const wallet = new ethers_1.Wallet(config_1.config.agentPrivateKey);
        const provider = new ethers_1.JsonRpcProvider(config_1.config.rpcUrl);
        const signer = wallet.connect(provider);
        spinner.text = 'Checking if agent is already registered...';
        const registry = new ethers_1.ethers.Contract(config_1.config.identityRegistryAddress, IDENTITY_REGISTRY_ABI, signer);
        const isRegistered = await registry.isRegistered(wallet.address);
        if (isRegistered) {
            spinner.info(chalk_1.default.yellow('Agent already registered'));
            const cardURI = await registry.getAgentCard(wallet.address);
            console.log('\n' + chalk_1.default.bold('Agent ID:'), chalk_1.default.cyan(`erc8004:${wallet.address}`));
            console.log(chalk_1.default.bold('Card URI:'), cardURI);
            return;
        }
        spinner.text = 'Registering agent on-chain...';
        // Create basic agent card
        const agentCard = {
            name: 'Agent ' + wallet.address.slice(0, 8),
            address: wallet.address,
            skills: ['ci-cd-fix', 'code-review', 'testing'],
            endpoints: [config_1.config.arenaEndpoint],
            version: '1.0.0'
        };
        const cardURI = `data:application/json;base64,${Buffer.from(JSON.stringify(agentCard)).toString('base64')}`;
        const tx = await registry.registerAgent(cardURI);
        spinner.text = 'Waiting for transaction confirmation...';
        const receipt = await tx.wait();
        spinner.succeed(chalk_1.default.green('Agent identity created!'));
        console.log('\n' + chalk_1.default.bold('Agent ID:'), chalk_1.default.cyan(`erc8004:${wallet.address}`));
        console.log(chalk_1.default.bold('Address:'), wallet.address);
        console.log(chalk_1.default.bold('Transaction:'), chalk_1.default.gray(receipt.hash));
        console.log('\n' + chalk_1.default.dim('Save this agent ID for claiming bounties\n'));
    }
    catch (error) {
        spinner.fail(chalk_1.default.red('Failed to create identity'));
        console.error(error.message);
        process.exit(1);
    }
}
async function showIdentity() {
    try {
        const wallet = new ethers_1.Wallet(config_1.config.agentPrivateKey);
        const provider = new ethers_1.JsonRpcProvider(config_1.config.rpcUrl);
        const signer = wallet.connect(provider);
        const registry = new ethers_1.ethers.Contract(config_1.config.identityRegistryAddress, IDENTITY_REGISTRY_ABI, signer);
        const isRegistered = await registry.isRegistered(wallet.address);
        if (!isRegistered) {
            console.log(chalk_1.default.yellow('Agent not registered. Run:'));
            console.log(chalk_1.default.gray('  npx arena id:create\n'));
            return;
        }
        const cardURI = await registry.getAgentCard(wallet.address);
        console.log('\n' + chalk_1.default.bold('Agent Identity'));
        console.log(chalk_1.default.gray('─'.repeat(50)));
        console.log(chalk_1.default.bold('Agent ID:'), chalk_1.default.cyan(`erc8004:${wallet.address}`));
        console.log(chalk_1.default.bold('Address:'), wallet.address);
        console.log(chalk_1.default.bold('Card URI:'), cardURI);
        console.log(chalk_1.default.bold('Network:'), config_1.config.chainId === 84532 ? 'Base Sepolia' : 'Base Mainnet');
        console.log(chalk_1.default.gray('─'.repeat(50)) + '\n');
    }
    catch (error) {
        console.error(chalk_1.default.red('Error:'), error.message);
        process.exit(1);
    }
}
exports.idCommand = {
    create: createIdentity,
    show: showIdentity
};
//# sourceMappingURL=id.js.map