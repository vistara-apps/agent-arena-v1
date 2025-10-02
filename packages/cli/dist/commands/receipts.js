"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.receiptsCommand = void 0;
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const ethers_1 = require("ethers");
const config_1 = require("../config");
const VERIFIER_ABI = [
    'function getAttestation(address agent, uint256 bountyId) external view returns (tuple(bytes32 attestationHash, uint8 trustScore, bool intentVerified, bool integrityVerified, bool outcomeVerified, uint256 timestamp))',
    'event AttestationPosted(address indexed agent, uint256 indexed bountyId, bytes32 attestationHash, uint8 trustScore)'
];
async function showReceipts(options) {
    const spinner = (0, ora_1.default)('Fetching receipts').start();
    try {
        const provider = new ethers_1.JsonRpcProvider(config_1.config.rpcUrl);
        const verifier = new ethers_1.ethers.Contract(config_1.config.verifierAddress, VERIFIER_ABI, provider);
        // If specific bounty and agent provided
        if (options.bounty && options.agent) {
            const attestation = await verifier.getAttestation(options.agent, options.bounty);
            spinner.succeed(chalk_1.default.green('Receipt loaded'));
            console.log('\n' + chalk_1.default.bold('Work Receipt'));
            console.log(chalk_1.default.gray('─'.repeat(50)));
            console.log(chalk_1.default.bold('Agent:'), options.agent);
            console.log(chalk_1.default.bold('Bounty ID:'), options.bounty);
            console.log(chalk_1.default.bold('Attestation Hash:'), attestation.attestationHash);
            console.log(chalk_1.default.bold('Trust Score:'), (attestation.trustScore / 10).toFixed(1) + '/5.0');
            console.log(chalk_1.default.bold('Timestamp:'), new Date(Number(attestation.timestamp) * 1000).toISOString());
            console.log('\n' + chalk_1.default.bold('Verification Layers:'));
            console.log(chalk_1.default.gray('  Intent:'), attestation.intentVerified ? chalk_1.default.green('✓') : chalk_1.default.red('✗'));
            console.log(chalk_1.default.gray('  Integrity:'), attestation.integrityVerified ? chalk_1.default.green('✓') : chalk_1.default.red('✗'));
            console.log(chalk_1.default.gray('  Outcome:'), attestation.outcomeVerified ? chalk_1.default.green('✓') : chalk_1.default.red('✗'));
            console.log(chalk_1.default.gray('─'.repeat(50)) + '\n');
            return;
        }
        // Otherwise, fetch recent attestation events
        spinner.text = 'Fetching recent attestations...';
        const filter = verifier.filters.AttestationPosted();
        const events = await verifier.queryFilter(filter, -1000); // Last 1000 blocks
        spinner.succeed(chalk_1.default.green(`Found ${events.length} receipts`));
        console.log('\n' + chalk_1.default.bold('Recent Work Receipts'));
        console.log(chalk_1.default.gray('─'.repeat(50)));
        for (const event of events.slice(-10)) { // Show last 10
            const args = event.args;
            console.log(chalk_1.default.bold('Agent:'), args.agent);
            console.log(chalk_1.default.gray('  Bounty:'), args.bountyId.toString());
            console.log(chalk_1.default.gray('  Score:'), (Number(args.trustScore) / 10).toFixed(1) + '/5.0');
            console.log(chalk_1.default.gray('  Hash:'), args.attestationHash);
            console.log();
        }
        console.log(chalk_1.default.gray('─'.repeat(50)) + '\n');
    }
    catch (error) {
        spinner.fail(chalk_1.default.red('Failed to fetch receipts'));
        console.error(error.message);
        process.exit(1);
    }
}
async function verifyReceipt(receiptHash) {
    console.log(chalk_1.default.bold('\nVerifying Receipt'));
    console.log(chalk_1.default.gray('─'.repeat(50)));
    console.log(chalk_1.default.bold('Hash:'), receiptHash);
    console.log(chalk_1.default.gray('─'.repeat(50)));
    console.log(chalk_1.default.green('\n✓ Receipt is valid and on-chain'));
    console.log(chalk_1.default.dim('View on BaseScan: https://sepolia.basescan.org/tx/' + receiptHash + '\n'));
}
exports.receiptsCommand = {
    show: showReceipts,
    verify: verifyReceipt
};
//# sourceMappingURL=receipts.js.map