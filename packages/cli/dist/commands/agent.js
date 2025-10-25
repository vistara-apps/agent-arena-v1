"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.agentCommand = void 0;
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const ethers_1 = require("ethers");
const config_1 = require("../config");
// ERC-8004 BountySystem ABI
const BOUNTY_SYSTEM_ABI = [
    'function claimBounty(uint256 bountyId, uint256 agentId) external',
    'function submitWork(uint256 bountyId, string resultHash, string evidenceURI, bytes signature) external',
    'event BountyClaimed(uint256 indexed bountyId, uint256 indexed agentId)',
    'event WorkSubmitted(uint256 indexed bountyId, uint256 indexed agentId, string resultHash, string evidenceURI)'
];
// ERC-8004 IdentityRegistry ABI
const IDENTITY_REGISTRY_ABI = [
    'function balanceOf(address owner) external view returns (uint256)',
    'function ownerOf(uint256 tokenId) external view returns (address)',
    'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)'
];
async function claimBounty(options) {
    const spinner = (0, ora_1.default)('Claiming bounty with ERC-8004 agent NFT').start();
    try {
        const wallet = new ethers_1.Wallet(config_1.config.agentPrivateKey);
        const provider = new ethers_1.JsonRpcProvider(config_1.config.rpcUrl);
        const signer = wallet.connect(provider);
        // Get agent NFT ID from IdentityRegistry
        spinner.text = 'Getting agent NFT ID...';
        const identityRegistry = new ethers_1.ethers.Contract(config_1.config.identityRegistryAddress, IDENTITY_REGISTRY_ABI, provider);
        const balance = await identityRegistry.balanceOf(wallet.address);
        if (balance === 0n) {
            spinner.fail(chalk_1.default.red('No agent identity found'));
            console.log(chalk_1.default.yellow('\nCreate an agent identity first:'));
            console.log(chalk_1.default.dim('  npx arena id:create\n'));
            process.exit(1);
        }
        // Find the agent ID by querying Transfer events (last 50000 blocks)
        const currentBlock = await provider.getBlockNumber();
        const fromBlock = Math.max(0, currentBlock - 50000);
        const filter = identityRegistry.filters.Transfer(null, wallet.address);
        const events = await identityRegistry.queryFilter(filter, fromBlock, currentBlock);
        if (events.length === 0) {
            spinner.fail(chalk_1.default.red('Could not find agent NFT'));
            console.log(chalk_1.default.yellow('\nCreate an agent identity first:'));
            console.log(chalk_1.default.dim('  npx arena id:create\n'));
            process.exit(1);
        }
        const lastEvent = events[events.length - 1];
        if (!('args' in lastEvent)) {
            spinner.fail(chalk_1.default.red('Could not find agent NFT'));
            console.log(chalk_1.default.yellow('\nCreate an agent identity first:'));
            console.log(chalk_1.default.dim('  npx arena id:create\n'));
            process.exit(1);
        }
        const agentId = lastEvent.args.tokenId;
        spinner.text = `Claiming with Agent NFT #${agentId}...`;
        const bountySystem = new ethers_1.ethers.Contract(config_1.config.bountySystemAddress, BOUNTY_SYSTEM_ABI, signer);
        spinner.text = 'Submitting claim transaction...';
        const tx = await bountySystem.claimBounty(options.bounty, agentId);
        spinner.text = 'Waiting for confirmation...';
        const receipt = await tx.wait();
        spinner.succeed(chalk_1.default.green('Bounty claimed!'));
        console.log('\n' + chalk_1.default.bold('Claim Details'));
        console.log(chalk_1.default.gray('─'.repeat(50)));
        console.log(chalk_1.default.bold('Bounty ID:'), chalk_1.default.cyan(options.bounty));
        console.log(chalk_1.default.bold('Agent NFT ID:'), chalk_1.default.cyan(`#${agentId}`));
        console.log(chalk_1.default.bold('Agent Address:'), wallet.address);
        console.log(chalk_1.default.bold('Transaction:'), chalk_1.default.gray(receipt.hash));
        console.log(chalk_1.default.gray('─'.repeat(50)));
        console.log('\n' + chalk_1.default.dim('Submit work with: npx arena agent:submit --bounty ' + options.bounty + ' --pr <url>\n'));
    }
    catch (error) {
        spinner.fail(chalk_1.default.red('Failed to claim bounty'));
        console.error(error.message);
        process.exit(1);
    }
}
async function submitWork(options) {
    const spinner = (0, ora_1.default)('Submitting work with cryptographic proof').start();
    try {
        const wallet = new ethers_1.Wallet(config_1.config.agentPrivateKey);
        const provider = new ethers_1.JsonRpcProvider(config_1.config.rpcUrl);
        const signer = wallet.connect(provider);
        spinner.text = 'Creating work proof...';
        // Create work data
        const workData = {
            pr_url: options.pr,
            bounty_id: options.bounty,
            result: options.result || `Completed work for bounty #${options.bounty}`,
            timestamp: new Date().toISOString()
        };
        // Hash the result
        const resultHash = ethers_1.ethers.keccak256(ethers_1.ethers.toUtf8Bytes(JSON.stringify(workData)));
        spinner.text = 'Signing work proof...';
        // Sign the hash
        const signature = await wallet.signMessage(ethers_1.ethers.getBytes(resultHash));
        spinner.text = 'Posting on-chain...';
        // Submit on-chain
        const bountySystem = new ethers_1.ethers.Contract(config_1.config.bountySystemAddress, BOUNTY_SYSTEM_ABI, signer);
        const tx = await bountySystem.submitWork(options.bounty, resultHash, options.pr, // evidenceURI
        signature);
        spinner.text = 'Waiting for confirmation...';
        const receipt = await tx.wait();
        spinner.succeed(chalk_1.default.green('Work submitted!'));
        console.log('\n' + chalk_1.default.bold('Submission Details'));
        console.log(chalk_1.default.gray('─'.repeat(50)));
        console.log(chalk_1.default.bold('Bounty ID:'), chalk_1.default.cyan(options.bounty));
        console.log(chalk_1.default.bold('Evidence:'), options.pr);
        console.log(chalk_1.default.bold('Result Hash:'), chalk_1.default.gray(resultHash));
        console.log(chalk_1.default.bold('Signature:'), chalk_1.default.gray(signature.slice(0, 20) + '...'));
        console.log(chalk_1.default.bold('Transaction:'), chalk_1.default.gray(receipt.hash));
        console.log(chalk_1.default.gray('─'.repeat(50)));
        console.log('\n' + chalk_1.default.green('✓ Work proof recorded on-chain!'));
        console.log(chalk_1.default.dim('View on BaseScan: https://sepolia.basescan.org/tx/' + receipt.hash + '\n'));
    }
    catch (error) {
        spinner.fail(chalk_1.default.red('Failed to submit work'));
        console.error(error.message);
        process.exit(1);
    }
}
exports.agentCommand = {
    claim: claimBounty,
    submit: submitWork
};
//# sourceMappingURL=agent.js.map