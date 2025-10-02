"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bountyCommand = void 0;
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const ethers_1 = require("ethers");
const config_1 = require("../config");
const BOUNTY_SYSTEM_ABI = [
    'function createBounty(string description, uint256 rewardAmount, address tokenAddress, uint256 deadline, string verificationType) external payable returns (uint256)',
    'function getBounty(uint256 bountyId) external view returns (tuple(address creator, string description, uint256 rewardAmount, address tokenAddress, uint256 deadline, string verificationType, uint8 status, address assignedAgent))',
    'function activeBounties() external view returns (uint256)',
    'event BountyCreated(uint256 indexed bountyId, address indexed creator, uint256 rewardAmount)'
];
async function createBounty(options) {
    const spinner = (0, ora_1.default)('Creating bounty').start();
    try {
        const wallet = new ethers_1.Wallet(config_1.config.agentPrivateKey);
        const provider = new ethers_1.JsonRpcProvider(config_1.config.rpcUrl);
        const signer = wallet.connect(provider);
        const bountySystem = new ethers_1.ethers.Contract(config_1.config.bountySystemAddress, BOUNTY_SYSTEM_ABI, signer);
        const description = `Fix issue ${options.issue} in ${options.repo}`;
        const rewardAmount = (0, ethers_1.parseEther)(options.escrow);
        const tokenAddress = '0x0000000000000000000000000000000000000000'; // ETH
        const deadline = Math.floor(Date.now() / 1000) + 86400; // 24 hours
        const verificationType = 'triple_verification';
        spinner.text = 'Submitting transaction...';
        const tx = await bountySystem.createBounty(description, rewardAmount, tokenAddress, deadline, verificationType, { value: rewardAmount });
        spinner.text = 'Waiting for confirmation...';
        const receipt = await tx.wait();
        // Extract bounty ID from event
        const event = receipt.logs
            .map((log) => {
            try {
                return bountySystem.interface.parseLog(log);
            }
            catch {
                return null;
            }
        })
            .find((e) => e && e.name === 'BountyCreated');
        const bountyId = event?.args?.bountyId?.toString() || 'unknown';
        spinner.succeed(chalk_1.default.green('Bounty created!'));
        console.log('\n' + chalk_1.default.bold('Bounty Details'));
        console.log(chalk_1.default.gray('─'.repeat(50)));
        console.log(chalk_1.default.bold('Bounty ID:'), chalk_1.default.cyan(bountyId));
        console.log(chalk_1.default.bold('Repository:'), options.repo);
        console.log(chalk_1.default.bold('Issue:'), options.issue);
        console.log(chalk_1.default.bold('Reward:'), options.escrow, options.currency || 'ETH');
        console.log(chalk_1.default.bold('Transaction:'), chalk_1.default.gray(receipt.hash));
        console.log(chalk_1.default.gray('─'.repeat(50)) + '\n');
    }
    catch (error) {
        spinner.fail(chalk_1.default.red('Failed to create bounty'));
        console.error(error.message);
        process.exit(1);
    }
}
async function listBounties() {
    const spinner = (0, ora_1.default)('Fetching bounties').start();
    try {
        const provider = new ethers_1.JsonRpcProvider(config_1.config.rpcUrl);
        const bountySystem = new ethers_1.ethers.Contract(config_1.config.bountySystemAddress, BOUNTY_SYSTEM_ABI, provider);
        const totalBounties = await bountySystem.activeBounties();
        spinner.succeed(chalk_1.default.green(`Found ${totalBounties} active bounties`));
        console.log('\n' + chalk_1.default.bold('Active Bounties'));
        console.log(chalk_1.default.gray('─'.repeat(50)));
        for (let i = 1; i <= Number(totalBounties); i++) {
            try {
                const bounty = await bountySystem.getBounty(i);
                const reward = ethers_1.ethers.formatEther(bounty.rewardAmount);
                console.log(chalk_1.default.bold(`#${i}:`), bounty.description);
                console.log(chalk_1.default.gray('  Reward:'), reward, 'ETH');
                console.log(chalk_1.default.gray('  Status:'), ['Open', 'Claimed', 'Completed', 'Disputed'][bounty.status]);
                console.log();
            }
            catch {
                continue;
            }
        }
        console.log(chalk_1.default.gray('─'.repeat(50)) + '\n');
    }
    catch (error) {
        spinner.fail(chalk_1.default.red('Failed to fetch bounties'));
        console.error(error.message);
        process.exit(1);
    }
}
async function showBounty(bountyId) {
    const spinner = (0, ora_1.default)(`Fetching bounty #${bountyId}`).start();
    try {
        const provider = new ethers_1.JsonRpcProvider(config_1.config.rpcUrl);
        const bountySystem = new ethers_1.ethers.Contract(config_1.config.bountySystemAddress, BOUNTY_SYSTEM_ABI, provider);
        const bounty = await bountySystem.getBounty(bountyId);
        spinner.succeed(chalk_1.default.green('Bounty loaded'));
        console.log('\n' + chalk_1.default.bold(`Bounty #${bountyId}`));
        console.log(chalk_1.default.gray('─'.repeat(50)));
        console.log(chalk_1.default.bold('Creator:'), bounty.creator);
        console.log(chalk_1.default.bold('Description:'), bounty.description);
        console.log(chalk_1.default.bold('Reward:'), ethers_1.ethers.formatEther(bounty.rewardAmount), 'ETH');
        console.log(chalk_1.default.bold('Status:'), ['Open', 'Claimed', 'Completed', 'Disputed'][bounty.status]);
        console.log(chalk_1.default.bold('Deadline:'), new Date(Number(bounty.deadline) * 1000).toISOString());
        console.log(chalk_1.default.bold('Verification:'), bounty.verificationType);
        if (bounty.assignedAgent !== '0x0000000000000000000000000000000000000000') {
            console.log(chalk_1.default.bold('Assigned Agent:'), bounty.assignedAgent);
        }
        console.log(chalk_1.default.gray('─'.repeat(50)) + '\n');
    }
    catch (error) {
        spinner.fail(chalk_1.default.red('Failed to fetch bounty'));
        console.error(error.message);
        process.exit(1);
    }
}
exports.bountyCommand = {
    create: createBounty,
    list: listBounties,
    show: showBounty
};
//# sourceMappingURL=bounty.js.map