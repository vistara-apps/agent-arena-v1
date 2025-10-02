#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { initCommand } from './commands/init';
import { idCommand } from './commands/id';
import { envelopeCommand } from './commands/envelope';
import { bountyCommand } from './commands/bounty';
import { agentCommand } from './commands/agent';
import { verifyCommand } from './commands/verify';
import { escrowCommand } from './commands/escrow';
import { receiptsCommand } from './commands/receipts';

const program = new Command();

program
  .name('arena')
  .description('Agent Arena CLI - The git for agent work')
  .version('1.0.0');

// Initialize project
program
  .command('init <project>')
  .description('Initialize a new Agent Arena project')
  .action(initCommand);

// Identity management
program
  .command('id:create')
  .description('Create ERC-8004 agent identity')
  .action(idCommand.create);

program
  .command('id:show')
  .description('Show current agent identity')
  .action(idCommand.show);

// A2A envelope signing
program
  .command('envelope:sign')
  .description('Sign A2A envelope')
  .requiredOption('--action <action>', 'Action to perform')
  .requiredOption('--payload <payload>', 'Payload JSON file or inline JSON')
  .action(envelopeCommand.sign);

// Bounty management
program
  .command('bounty:create')
  .description('Create a new bounty')
  .requiredOption('--repo <url>', 'Repository URL')
  .requiredOption('--issue <id>', 'Issue ID')
  .requiredOption('--escrow <amount>', 'Escrow amount')
  .option('--currency <currency>', 'Currency (ETH/USDC)', 'ETH')
  .action(bountyCommand.create);

program
  .command('bounty:list')
  .description('List available bounties')
  .action(bountyCommand.list);

program
  .command('bounty:show <id>')
  .description('Show bounty details')
  .action(bountyCommand.show);

// Agent actions
program
  .command('agent:claim')
  .description('Claim a bounty')
  .requiredOption('--bounty <id>', 'Bounty ID')
  .requiredOption('--agent <address>', 'Agent address')
  .action(agentCommand.claim);

program
  .command('agent:submit')
  .description('Submit work for bounty')
  .requiredOption('--bounty <id>', 'Bounty ID')
  .requiredOption('--pr <url>', 'Pull request URL')
  .option('--result <file>', 'Result file path')
  .action(agentCommand.submit);

// Verification
program
  .command('verify')
  .description('Verify agent work')
  .requiredOption('--bounty <id>', 'Bounty ID')
  .requiredOption('--adapter <adapter>', 'Verification adapter (chaoschain)')
  .action(verifyCommand.verify);

// Escrow management
program
  .command('escrow:release')
  .description('Release escrow payment')
  .requiredOption('--bounty <id>', 'Bounty ID')
  .requiredOption('--attestation <hash>', 'Attestation hash')
  .action(escrowCommand.release);

program
  .command('escrow:status <bounty>')
  .description('Check escrow status')
  .action(escrowCommand.status);

// Receipts
program
  .command('receipts:show')
  .description('Show work receipts')
  .option('--bounty <id>', 'Filter by bounty ID')
  .option('--agent <address>', 'Filter by agent address')
  .action(receiptsCommand.show);

program
  .command('receipts:verify <receipt>')
  .description('Verify a receipt')
  .action(receiptsCommand.verify);

// Error handling
program.configureHelp({
  formatHelp: (cmd, helper) => {
    const title = chalk.bold.blue('Agent Arena CLI');
    const description = chalk.gray('The git for agent work');
    const version = chalk.gray(`v${program.version()}`);
    
    return `${title} ${version}\n${description}\n\n${helper.formatHelp(cmd)}`;
  }
});

// Global error handler
program.exitOverride((err) => {
  if (err.code === 'commander.help') {
    process.exit(0);
  }
  console.error(chalk.red('Error:'), err.message);
  process.exit(1);
});

// Parse command line arguments
program.parse();
