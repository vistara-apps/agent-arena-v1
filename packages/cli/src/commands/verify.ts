import chalk from 'chalk';
import ora from 'ora';
import { config } from '../config';

interface VerifyOptions {
  bounty: string;
  adapter: string;
}

async function verifyWork(options: VerifyOptions) {
  const spinner = ora('Starting verification').start();

  try {
    if (options.adapter !== 'chaoschain') {
      spinner.warn(chalk.yellow(`Adapter "${options.adapter}" not yet supported. Using chaoschain.`));
    }

    spinner.text = 'Fetching bounty work...';

    // Call verifier service
    const response = await fetch(`${config.verifierEndpoint}/verify`, {
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
      const error = await response.json() as any;
      spinner.fail(chalk.red('Verification failed'));
      console.error(error.error || 'Unknown error');
      process.exit(1);
    }

    const result = await response.json() as any;

    spinner.succeed(chalk.green('Verification complete!'));

    console.log('\n' + chalk.bold('Verification Result'));
    console.log(chalk.gray('─'.repeat(50)));
    console.log(chalk.bold('Bounty ID:'), chalk.cyan(options.bounty));
    console.log(chalk.bold('Trust Score:'), result.trust_score >= 3.5
      ? chalk.green(result.trust_score.toFixed(1) + '/5.0')
      : chalk.red(result.trust_score.toFixed(1) + '/5.0'));

    console.log('\n' + chalk.bold('Verification Layers:'));
    console.log(chalk.gray('  Intent:'), result.verification?.intent ? chalk.green('✓ Pass') : chalk.red('✗ Fail'));
    console.log(chalk.gray('  Integrity:'), result.verification?.integrity ? chalk.green('✓ Pass') : chalk.red('✗ Fail'));
    console.log(chalk.gray('  Outcome:'), result.verification?.outcome ? chalk.green('✓ Pass') : chalk.red('✗ Fail'));

    console.log('\n' + chalk.bold('Attestation:'));
    console.log(chalk.gray('  Hash:'), result.attestation_hash);
    if (result.ipfs_hash) {
      console.log(chalk.gray('  IPFS:'), result.ipfs_hash);
    }
    console.log(chalk.gray('─'.repeat(50)));

    if (result.trust_score >= 3.5) {
      console.log('\n' + chalk.green('✓ Verification passed!'));
      console.log(chalk.dim('Release escrow with: npx arena escrow:release --bounty ' + options.bounty + ' --attestation ' + result.attestation_hash + '\n'));
    } else {
      console.log('\n' + chalk.red('✗ Verification failed. Trust score below threshold (3.5)\n'));
    }

  } catch (error: any) {
    spinner.fail(chalk.red('Verification error'));
    console.error(error.message);
    process.exit(1);
  }
}

export const verifyCommand = {
  verify: verifyWork
};
