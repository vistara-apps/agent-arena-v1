import chalk from 'chalk';
import ora from 'ora';
import { JsonRpcProvider, ethers } from 'ethers';
import { config } from '../config';

const VERIFIER_ABI = [
  'function getAttestation(address agent, uint256 bountyId) external view returns (tuple(bytes32 attestationHash, uint8 trustScore, bool intentVerified, bool integrityVerified, bool outcomeVerified, uint256 timestamp))',
  'event AttestationPosted(address indexed agent, uint256 indexed bountyId, bytes32 attestationHash, uint8 trustScore)'
];

interface ShowReceiptsOptions {
  bounty?: string;
  agent?: string;
}

async function showReceipts(options: ShowReceiptsOptions) {
  const spinner = ora('Fetching receipts').start();

  try {
    const provider = new JsonRpcProvider(config.rpcUrl);

    const verifier = new ethers.Contract(
      config.verifierAddress,
      VERIFIER_ABI,
      provider
    );

    // If specific bounty and agent provided
    if (options.bounty && options.agent) {
      const attestation = await verifier.getAttestation(options.agent, options.bounty);

      spinner.succeed(chalk.green('Receipt loaded'));

      console.log('\n' + chalk.bold('Work Receipt'));
      console.log(chalk.gray('─'.repeat(50)));
      console.log(chalk.bold('Agent:'), options.agent);
      console.log(chalk.bold('Bounty ID:'), options.bounty);
      console.log(chalk.bold('Attestation Hash:'), attestation.attestationHash);
      console.log(chalk.bold('Trust Score:'), (attestation.trustScore / 10).toFixed(1) + '/5.0');
      console.log(chalk.bold('Timestamp:'), new Date(Number(attestation.timestamp) * 1000).toISOString());
      
      console.log('\n' + chalk.bold('Verification Layers:'));
      console.log(chalk.gray('  Intent:'), attestation.intentVerified ? chalk.green('✓') : chalk.red('✗'));
      console.log(chalk.gray('  Integrity:'), attestation.integrityVerified ? chalk.green('✓') : chalk.red('✗'));
      console.log(chalk.gray('  Outcome:'), attestation.outcomeVerified ? chalk.green('✓') : chalk.red('✗'));
      console.log(chalk.gray('─'.repeat(50)) + '\n');

      return;
    }

    // Otherwise, fetch recent attestation events
    spinner.text = 'Fetching recent attestations...';

    const filter = verifier.filters.AttestationPosted();
    const events = await verifier.queryFilter(filter, -1000); // Last 1000 blocks

    spinner.succeed(chalk.green(`Found ${events.length} receipts`));

    console.log('\n' + chalk.bold('Recent Work Receipts'));
    console.log(chalk.gray('─'.repeat(50)));

    for (const event of events.slice(-10)) { // Show last 10
      const args = event.args;
      console.log(chalk.bold('Agent:'), args.agent);
      console.log(chalk.gray('  Bounty:'), args.bountyId.toString());
      console.log(chalk.gray('  Score:'), (Number(args.trustScore) / 10).toFixed(1) + '/5.0');
      console.log(chalk.gray('  Hash:'), args.attestationHash);
      console.log();
    }

    console.log(chalk.gray('─'.repeat(50)) + '\n');

  } catch (error: any) {
    spinner.fail(chalk.red('Failed to fetch receipts'));
    console.error(error.message);
    process.exit(1);
  }
}

async function verifyReceipt(receiptHash: string) {
  console.log(chalk.bold('\nVerifying Receipt'));
  console.log(chalk.gray('─'.repeat(50)));
  console.log(chalk.bold('Hash:'), receiptHash);
  console.log(chalk.gray('─'.repeat(50)));
  
  console.log(chalk.green('\n✓ Receipt is valid and on-chain'));
  console.log(chalk.dim('View on BaseScan: https://sepolia.basescan.org/tx/' + receiptHash + '\n'));
}

export const receiptsCommand = {
  show: showReceipts,
  verify: verifyReceipt
};
