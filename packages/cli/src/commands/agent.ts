import chalk from 'chalk';
import ora from 'ora';
import { Wallet, ethers, JsonRpcProvider } from 'ethers';
import { createA2AMessage, submitA2AMessage } from '@agent-arena/core';
import { config } from '../config';

const BOUNTY_SYSTEM_ABI = [
  'function claimBounty(uint256 bountyId) external',
  'function submitWork(uint256 bountyId, string resultURI) external',
  'event BountyClaimed(uint256 indexed bountyId, address indexed agent)',
  'event WorkSubmitted(uint256 indexed bountyId, address indexed agent, string resultURI)'
];

interface ClaimOptions {
  bounty: string;
  agent: string;
}

interface SubmitOptions {
  bounty: string;
  pr: string;
  result?: string;
}

async function claimBounty(options: ClaimOptions) {
  const spinner = ora('Claiming bounty').start();

  try {
    const wallet = new Wallet(config.agentPrivateKey);
    const provider = new JsonRpcProvider(config.rpcUrl);
    const signer = wallet.connect(provider);

    if (wallet.address.toLowerCase() !== options.agent.toLowerCase()) {
      spinner.fail(chalk.red('Agent address does not match wallet'));
      console.log(chalk.yellow('Expected:'), options.agent);
      console.log(chalk.yellow('Got:'), wallet.address);
      process.exit(1);
    }

    const bountySystem = new ethers.Contract(
      config.bountySystemAddress,
      BOUNTY_SYSTEM_ABI,
      signer
    );

    spinner.text = 'Submitting claim transaction...';

    const tx = await bountySystem.claimBounty(options.bounty);

    spinner.text = 'Waiting for confirmation...';
    const receipt = await tx.wait();

    spinner.succeed(chalk.green('Bounty claimed!'));

    console.log('\n' + chalk.bold('Claim Details'));
    console.log(chalk.gray('─'.repeat(50)));
    console.log(chalk.bold('Bounty ID:'), chalk.cyan(options.bounty));
    console.log(chalk.bold('Agent:'), options.agent);
    console.log(chalk.bold('Transaction:'), chalk.gray(receipt.hash));
    console.log(chalk.gray('─'.repeat(50)));
    console.log('\n' + chalk.dim('Submit work with: npx arena agent:submit --bounty ' + options.bounty + ' --pr <url>\n'));

  } catch (error: any) {
    spinner.fail(chalk.red('Failed to claim bounty'));
    console.error(error.message);
    process.exit(1);
  }
}

async function submitWork(options: SubmitOptions) {
  const spinner = ora('Submitting work').start();

  try {
    const wallet = new Wallet(config.agentPrivateKey);
    const provider = new JsonRpcProvider(config.rpcUrl);
    const signer = wallet.connect(provider);

    spinner.text = 'Creating A2A envelope...';

    // Create signed A2A message
    const workData = {
      pr_url: options.pr,
      bounty_id: options.bounty,
      result: options.result || options.pr,
      timestamp: new Date().toISOString()
    };

    const message = await createA2AMessage(
      wallet.address,
      options.bounty,
      'Fix CI/CD pipeline',
      JSON.stringify(workData),
      (msg) => wallet.signMessage(msg)
    );

    spinner.text = 'Submitting to Arena...';

    // Submit A2A message
    const response = await submitA2AMessage(message, config.arenaEndpoint);

    if (!response.success) {
      spinner.fail(chalk.red('Arena rejected submission'));
      console.error(response.error);
      process.exit(1);
    }

    spinner.text = 'Posting on-chain...';

    // Submit on-chain
    const bountySystem = new ethers.Contract(
      config.bountySystemAddress,
      BOUNTY_SYSTEM_ABI,
      signer
    );

    const resultURI = `ipfs://a2a/${message.commit}`;
    const tx = await bountySystem.submitWork(options.bounty, resultURI);

    spinner.text = 'Waiting for confirmation...';
    const receipt = await tx.wait();

    spinner.succeed(chalk.green('Work submitted!'));

    console.log('\n' + chalk.bold('Submission Details'));
    console.log(chalk.gray('─'.repeat(50)));
    console.log(chalk.bold('Bounty ID:'), chalk.cyan(options.bounty));
    console.log(chalk.bold('PR:'), options.pr);
    console.log(chalk.bold('Attempt ID:'), response.attempt_id || 'N/A');
    console.log(chalk.bold('Transaction:'), chalk.gray(receipt.hash));
    console.log(chalk.gray('─'.repeat(50)));
    console.log('\n' + chalk.dim('Verify work with: npx arena verify --bounty ' + options.bounty + ' --adapter chaoschain\n'));

  } catch (error: any) {
    spinner.fail(chalk.red('Failed to submit work'));
    console.error(error.message);
    process.exit(1);
  }
}

export const agentCommand = {
  claim: claimBounty,
  submit: submitWork
};
