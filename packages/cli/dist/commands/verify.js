"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyCommand = void 0;
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const config_1 = require("../config");
async function verifyWork(options) {
    const spinner = (0, ora_1.default)('Starting verification').start();
    try {
        if (options.adapter !== 'chaoschain') {
            spinner.warn(chalk_1.default.yellow(`Adapter "${options.adapter}" not yet supported. Using chaoschain.`));
        }
        spinner.text = 'Fetching bounty work...';
        // Call verifier service
        const response = await fetch(`${config_1.config.verifierEndpoint}/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                bounty_id: options.bounty,
                adapter: 'chaoschain'
            })
        });
        if (!response.ok) {
            const error = await response.json();
            spinner.fail(chalk_1.default.red('Verification failed'));
            console.error(error.error || 'Unknown error');
            process.exit(1);
        }
        const result = await response.json();
        spinner.succeed(chalk_1.default.green('Verification complete!'));
        console.log('\n' + chalk_1.default.bold('Verification Result'));
        console.log(chalk_1.default.gray('─'.repeat(50)));
        console.log(chalk_1.default.bold('Bounty ID:'), chalk_1.default.cyan(options.bounty));
        console.log(chalk_1.default.bold('Trust Score:'), result.trust_score >= 3.5
            ? chalk_1.default.green(result.trust_score.toFixed(1) + '/5.0')
            : chalk_1.default.red(result.trust_score.toFixed(1) + '/5.0'));
        console.log('\n' + chalk_1.default.bold('Verification Layers:'));
        console.log(chalk_1.default.gray('  Intent:'), result.verification.intent ? chalk_1.default.green('✓ Pass') : chalk_1.default.red('✗ Fail'));
        console.log(chalk_1.default.gray('  Integrity:'), result.verification.integrity ? chalk_1.default.green('✓ Pass') : chalk_1.default.red('✗ Fail'));
        console.log(chalk_1.default.gray('  Outcome:'), result.verification.outcome ? chalk_1.default.green('✓ Pass') : chalk_1.default.red('✗ Fail'));
        console.log('\n' + chalk_1.default.bold('Attestation:'));
        console.log(chalk_1.default.gray('  Hash:'), result.attestation_hash);
        if (result.ipfs_hash) {
            console.log(chalk_1.default.gray('  IPFS:'), result.ipfs_hash);
        }
        console.log(chalk_1.default.gray('─'.repeat(50)));
        if (result.trust_score >= 3.5) {
            console.log('\n' + chalk_1.default.green('✓ Verification passed!'));
            console.log(chalk_1.default.dim('Release escrow with: npx arena escrow:release --bounty ' + options.bounty + ' --attestation ' + result.attestation_hash + '\n'));
        }
        else {
            console.log('\n' + chalk_1.default.red('✗ Verification failed. Trust score below threshold (3.5)\n'));
        }
    }
    catch (error) {
        spinner.fail(chalk_1.default.red('Verification error'));
        console.error(error.message);
        process.exit(1);
    }
}
exports.verifyCommand = {
    verify: verifyWork
};
//# sourceMappingURL=verify.js.map