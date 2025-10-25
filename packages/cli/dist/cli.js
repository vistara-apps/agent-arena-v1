#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const init_1 = require("./commands/init");
const id_1 = require("./commands/id");
const envelope_1 = require("./commands/envelope");
const bounty_1 = require("./commands/bounty");
const agent_1 = require("./commands/agent");
const verify_1 = require("./commands/verify");
const escrow_1 = require("./commands/escrow");
const receipts_1 = require("./commands/receipts");
const program = new commander_1.Command();
program
    .name('arena')
    .description('Agent Arena CLI - The git for agent work')
    .version('1.0.0');
// Initialize project
program
    .command('init <project>')
    .description('Initialize a new Agent Arena project')
    .action(init_1.initCommand);
// Identity management
program
    .command('id:create')
    .description('Create ERC-8004 agent identity')
    .action(id_1.idCommand.create);
program
    .command('id:show')
    .description('Show current agent identity')
    .action(id_1.idCommand.show);
// A2A envelope signing
program
    .command('envelope:sign')
    .description('Sign A2A envelope')
    .requiredOption('--action <action>', 'Action to perform')
    .requiredOption('--payload <payload>', 'Payload JSON file or inline JSON')
    .action(envelope_1.envelopeCommand.sign);
// Bounty management
program
    .command('bounty:create')
    .description('Create a new bounty')
    .requiredOption('--repo <url>', 'Repository URL')
    .requiredOption('--issue <id>', 'Issue ID')
    .requiredOption('--escrow <amount>', 'Escrow amount')
    .option('--currency <currency>', 'Currency (ETH/USDC)', 'ETH')
    .action(bounty_1.bountyCommand.create);
program
    .command('bounty:list')
    .description('List available bounties')
    .action(bounty_1.bountyCommand.list);
program
    .command('bounty:show <id>')
    .description('Show bounty details')
    .action(bounty_1.bountyCommand.show);
// Agent actions
program
    .command('agent:claim')
    .description('Claim a bounty with your ERC-8004 agent NFT')
    .requiredOption('--bounty <id>', 'Bounty ID')
    .action(agent_1.agentCommand.claim);
program
    .command('agent:submit')
    .description('Submit work for bounty')
    .requiredOption('--bounty <id>', 'Bounty ID')
    .requiredOption('--pr <url>', 'Pull request URL')
    .option('--result <file>', 'Result file path')
    .action(agent_1.agentCommand.submit);
// Verification
program
    .command('verify')
    .description('Verify agent work')
    .requiredOption('--bounty <id>', 'Bounty ID')
    .requiredOption('--adapter <adapter>', 'Verification adapter (chaoschain)')
    .action(verify_1.verifyCommand.verify);
// Escrow management
program
    .command('escrow:release')
    .description('Release escrow payment')
    .requiredOption('--bounty <id>', 'Bounty ID')
    .requiredOption('--attestation <hash>', 'Attestation hash')
    .action(escrow_1.escrowCommand.release);
program
    .command('escrow:status <bounty>')
    .description('Check escrow status')
    .action(escrow_1.escrowCommand.status);
// Receipts
program
    .command('receipts:show')
    .description('Show work receipts')
    .option('--bounty <id>', 'Filter by bounty ID')
    .option('--agent <address>', 'Filter by agent address')
    .action(receipts_1.receiptsCommand.show);
program
    .command('receipts:verify <receipt>')
    .description('Verify a receipt')
    .action(receipts_1.receiptsCommand.verify);
// Custom help - keep it simple to avoid recursion
program.configureOutput({
    writeOut: (str) => {
        const lines = str.split('\n');
        console.log(chalk_1.default.bold.blue('Agent Arena CLI') + ' ' + chalk_1.default.gray('v1.0.0'));
        console.log(chalk_1.default.gray('The git for agent work') + '\n');
        console.log(lines.slice(1).join('\n'));
    }
});
// Global error handler
program.exitOverride((err) => {
    if (err.code === 'commander.help') {
        process.exit(0);
    }
    console.error(chalk_1.default.red('Error:'), err.message);
    process.exit(1);
});
// Parse command line arguments
program.parse();
//# sourceMappingURL=cli.js.map