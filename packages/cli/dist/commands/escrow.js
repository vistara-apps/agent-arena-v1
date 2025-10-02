"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.escrowCommand = void 0;
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const ethers_1 = require("ethers");
const config_1 = require("../config");
const BOUNTY_SYSTEM_ABI = [
    'function approveBounty(uint256 bountyId, bytes32 attestationHash) external',
    'function getBountyEscrow(uint256 bountyId) external view returns (uint256)',
    'event BountyCompleted(uint256 indexed bountyId, address indexed agent, uint256 amount, bytes32 attestationHash)'
];
async function releaseEscrow(options) {
    const spinner = (0, ora_1.default)('Releasing escrow').start();
    try {
        const wallet = new ethers_1.Wallet(config_1.config.agentPrivateKey);
        const provider = new ethers_1.JsonRpcProvider(config_1.config.rpcUrl);
        const signer = wallet.connect(provider);
        const bountySystem = new ethers_1.ethers.Contract(config_1.config.bountySystemAddress, BOUNTY_SYSTEM_ABI, signer);
        // Format attestation hash
        const attestationHash = options.attestation.startsWith('0x')
            ? options.attestation
            : '0x' + options.attestation;
        spinner.text = 'Submitting release transaction...';
        const tx = await bountySystem.approveBounty(options.bounty, attestationHash);
        spinner.text = 'Waiting for confirmation...';
        const receipt = await tx.wait();
        // Extract payment details from event
        const event = receipt.logs
            .map((log) => {
            try {
                return bountySystem.interface.parseLog(log);
            }
            catch {
                return null;
            }
        })
            .find((e) => e && e.name === 'BountyCompleted');
        spinner.succeed(chalk_1.default.green('Escrow released!'));
        console.log('\n' + chalk_1.default.bold('Payment Details'));
        console.log(chalk_1.default.gray('─'.repeat(50)));
        console.log(chalk_1.default.bold('Bounty ID:'), chalk_1.default.cyan(options.bounty));
        if (event) {
            console.log(chalk_1.default.bold('Agent:'), event.args.agent);
            console.log(chalk_1.default.bold('Amount:'), ethers_1.ethers.formatEther(event.args.amount), 'ETH');
        }
        console.log(chalk_1.default.bold('Attestation:'), attestationHash);
        console.log(chalk_1.default.bold('Transaction:'), chalk_1.default.gray(receipt.hash));
        console.log(chalk_1.default.gray('─'.repeat(50)));
        console.log('\n' + chalk_1.default.green('✓ Payment complete!') + '\n');
    }
    catch (error) {
        spinner.fail(chalk_1.default.red('Failed to release escrow'));
        console.error(error.message);
        process.exit(1);
    }
}
async function checkEscrowStatus(bountyId) {
    const spinner = (0, ora_1.default)(`Checking escrow for bounty #${bountyId}`).start();
    try {
        const provider = new ethers_1.JsonRpcProvider(config_1.config.rpcUrl);
        const bountySystem = new ethers_1.ethers.Contract(config_1.config.bountySystemAddress, BOUNTY_SYSTEM_ABI, provider);
        const escrowAmount = await bountySystem.getBountyEscrow(bountyId);
        spinner.succeed(chalk_1.default.green('Escrow status retrieved'));
        console.log('\n' + chalk_1.default.bold(`Escrow Status - Bounty #${bountyId}`));
        console.log(chalk_1.default.gray('─'.repeat(50)));
        console.log(chalk_1.default.bold('Escrowed Amount:'), ethers_1.ethers.formatEther(escrowAmount), 'ETH');
        console.log(chalk_1.default.bold('Status:'), Number(escrowAmount) > 0 ? chalk_1.default.green('Active') : chalk_1.default.yellow('Released/Empty'));
        console.log(chalk_1.default.gray('─'.repeat(50)) + '\n');
    }
    catch (error) {
        spinner.fail(chalk_1.default.red('Failed to check escrow status'));
        console.error(error.message);
        process.exit(1);
    }
}
exports.escrowCommand = {
    release: releaseEscrow,
    status: checkEscrowStatus
};
//# sourceMappingURL=escrow.js.map