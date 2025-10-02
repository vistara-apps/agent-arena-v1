"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.agentCommand = void 0;
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const ethers_1 = require("ethers");
const core_1 = require("@agent-arena/core");
const config_1 = require("../config");
const BOUNTY_SYSTEM_ABI = [
    'function claimBounty(uint256 bountyId) external',
    'function submitWork(uint256 bountyId, string resultURI) external',
    'event BountyClaimed(uint256 indexed bountyId, address indexed agent)',
    'event WorkSubmitted(uint256 indexed bountyId, address indexed agent, string resultURI)'
];
async function claimBounty(options) {
    const spinner = (0, ora_1.default)('Claiming bounty').start();
    try {
        const wallet = new ethers_1.Wallet(config_1.config.agentPrivateKey);
        const provider = new ethers_1.JsonRpcProvider(config_1.config.rpcUrl);
        const signer = wallet.connect(provider);
        if (wallet.address.toLowerCase() !== options.agent.toLowerCase()) {
            spinner.fail(chalk_1.default.red('Agent address does not match wallet'));
            console.log(chalk_1.default.yellow('Expected:'), options.agent);
            console.log(chalk_1.default.yellow('Got:'), wallet.address);
            process.exit(1);
        }
        const bountySystem = new ethers_1.ethers.Contract(config_1.config.bountySystemAddress, BOUNTY_SYSTEM_ABI, signer);
        spinner.text = 'Submitting claim transaction...';
        const tx = await bountySystem.claimBounty(options.bounty);
        spinner.text = 'Waiting for confirmation...';
        const receipt = await tx.wait();
        spinner.succeed(chalk_1.default.green('Bounty claimed!'));
        console.log('\n' + chalk_1.default.bold('Claim Details'));
        console.log(chalk_1.default.gray('─'.repeat(50)));
        console.log(chalk_1.default.bold('Bounty ID:'), chalk_1.default.cyan(options.bounty));
        console.log(chalk_1.default.bold('Agent:'), options.agent);
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
    const spinner = (0, ora_1.default)('Submitting work').start();
    try {
        const wallet = new ethers_1.Wallet(config_1.config.agentPrivateKey);
        const provider = new ethers_1.JsonRpcProvider(config_1.config.rpcUrl);
        const signer = wallet.connect(provider);
        spinner.text = 'Creating A2A envelope...';
        // Create signed A2A message
        const workData = {
            pr_url: options.pr,
            bounty_id: options.bounty,
            result: options.result || options.pr,
            timestamp: new Date().toISOString()
        };
        const message = await (0, core_1.createA2AMessage)(wallet.address, options.bounty, 'Fix CI/CD pipeline', JSON.stringify(workData), (msg) => wallet.signMessage(msg));
        spinner.text = 'Submitting to Arena...';
        // Submit A2A message
        const response = await (0, core_1.submitA2AMessage)(message, config_1.config.arenaEndpoint);
        if (!response.success) {
            spinner.fail(chalk_1.default.red('Arena rejected submission'));
            console.error(response.error);
            process.exit(1);
        }
        spinner.text = 'Posting on-chain...';
        // Submit on-chain
        const bountySystem = new ethers_1.ethers.Contract(config_1.config.bountySystemAddress, BOUNTY_SYSTEM_ABI, signer);
        const resultURI = `ipfs://a2a/${message.commit}`;
        const tx = await bountySystem.submitWork(options.bounty, resultURI);
        spinner.text = 'Waiting for confirmation...';
        const receipt = await tx.wait();
        spinner.succeed(chalk_1.default.green('Work submitted!'));
        console.log('\n' + chalk_1.default.bold('Submission Details'));
        console.log(chalk_1.default.gray('─'.repeat(50)));
        console.log(chalk_1.default.bold('Bounty ID:'), chalk_1.default.cyan(options.bounty));
        console.log(chalk_1.default.bold('PR:'), options.pr);
        console.log(chalk_1.default.bold('Attempt ID:'), response.attempt_id || 'N/A');
        console.log(chalk_1.default.bold('Transaction:'), chalk_1.default.gray(receipt.hash));
        console.log(chalk_1.default.gray('─'.repeat(50)));
        console.log('\n' + chalk_1.default.dim('Verify work with: npx arena verify --bounty ' + options.bounty + ' --adapter chaoschain\n'));
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