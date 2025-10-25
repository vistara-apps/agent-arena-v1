import chalk from 'chalk';
import ora from 'ora';
import { Wallet, ethers, JsonRpcProvider } from 'ethers';
import { createA2AMessage, submitA2AMessage } from '@agent-arena/core';
import { config } from '../config';

// ERC-8004 BountySystem ABI
const BOUNTY_SYSTEM_ABI = [
  'function claimBounty(uint256 bountyId, uint256 agentId) external',
  'function submitWork(uint256 bountyId, string resultHash, string evidenceURI, bytes signature) external',
  'event BountyClaimed(uint256 indexed bountyId, uint256 indexed agentId)',
  'event WorkSubmitted(uint256 indexed bountyId, uint256 indexed agentId, string resultHash, string evidenceURI)'
];

// ERC-8004 IdentityRegistry ABI
const IDENTITY_REGISTRY_ABI = [
  'function balanceOf(address owner) external view returns (uint256)',
  'function ownerOf(uint256 tokenId) external view returns (address)',
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)'
];

interface ClaimOptions {
  bounty: string;
  agent?: string; // Optional, will use wallet address if not provided
}

interface SubmitOptions {
  bounty: string;
  pr: string;
  result?: string;
}

async function claimBounty(options: ClaimOptions) {
  const spinner = ora('Claiming bounty with ERC-8004 agent NFT').start();

  try {
    const wallet = new Wallet(config.agentPrivateKey);
    const provider = new JsonRpcProvider(config.rpcUrl);
    const signer = wallet.connect(provider);

    // Get agent NFT ID from IdentityRegistry
    spinner.text = 'Getting agent NFT ID...';
    const identityRegistry = new ethers.Contract(
      config.identityRegistryAddress,
      IDENTITY_REGISTRY_ABI,
      provider
    );

    const balance = await identityRegistry.balanceOf(wallet.address);

    if (balance === 0n) {
      spinner.fail(chalk.red('No agent identity found'));
      console.log(chalk.yellow('\nCreate an agent identity first:'));
      console.log(chalk.dim('  npx arena id:create\n'));
      process.exit(1);
    }

    // Find the agent ID by querying Transfer events (last 50000 blocks)
    const currentBlock = await provider.getBlockNumber();
    const fromBlock = Math.max(0, currentBlock - 50000);
    const filter = identityRegistry.filters.Transfer(null, wallet.address);
    const events = await identityRegistry.queryFilter(filter, fromBlock, currentBlock);

    if (events.length === 0) {
      spinner.fail(chalk.red('Could not find agent NFT'));
      console.log(chalk.yellow('\nCreate an agent identity first:'));
      console.log(chalk.dim('  npx arena id:create\n'));
      process.exit(1);
    }

    const lastEvent = events[events.length - 1];
    if (!('args' in lastEvent)) {
      spinner.fail(chalk.red('Could not find agent NFT'));
      console.log(chalk.yellow('\nCreate an agent identity first:'));
      console.log(chalk.dim('  npx arena id:create\n'));
      process.exit(1);
    }

    const agentId = lastEvent.args.tokenId;

    spinner.text = `Claiming with Agent NFT #${agentId}...`;

    const bountySystem = new ethers.Contract(
      config.bountySystemAddress,
      BOUNTY_SYSTEM_ABI,
      signer
    );

    spinner.text = 'Submitting claim transaction...';

    const tx = await bountySystem.claimBounty(options.bounty, agentId);

    spinner.text = 'Waiting for confirmation...';
    const receipt = await tx.wait();

    spinner.succeed(chalk.green('Bounty claimed!'));

    console.log('\n' + chalk.bold('Claim Details'));
    console.log(chalk.gray('─'.repeat(50)));
    console.log(chalk.bold('Bounty ID:'), chalk.cyan(options.bounty));
    console.log(chalk.bold('Agent NFT ID:'), chalk.cyan(`#${agentId}`));
    console.log(chalk.bold('Agent Address:'), wallet.address);
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
  const spinner = ora('Submitting work with cryptographic proof').start();

  try {
    const wallet = new Wallet(config.agentPrivateKey);
    const provider = new JsonRpcProvider(config.rpcUrl);
    const signer = wallet.connect(provider);

    spinner.text = 'Creating work proof...';

    // Create work data
    const workData = {
      pr_url: options.pr,
      bounty_id: options.bounty,
      result: options.result || `Completed work for bounty #${options.bounty}`,
      timestamp: new Date().toISOString()
    };

    // Hash the result
    const resultHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(workData)));

    spinner.text = 'Signing work proof...';

    // Sign the hash
    const signature = await wallet.signMessage(ethers.getBytes(resultHash));

    spinner.text = 'Posting on-chain...';

    // Submit on-chain
    const bountySystem = new ethers.Contract(
      config.bountySystemAddress,
      BOUNTY_SYSTEM_ABI,
      signer
    );

    const tx = await bountySystem.submitWork(
      options.bounty,
      resultHash,
      options.pr, // evidenceURI
      signature
    );

    spinner.text = 'Waiting for confirmation...';
    const receipt = await tx.wait();

    spinner.succeed(chalk.green('Work submitted!'));

    console.log('\n' + chalk.bold('Submission Details'));
    console.log(chalk.gray('─'.repeat(50)));
    console.log(chalk.bold('Bounty ID:'), chalk.cyan(options.bounty));
    console.log(chalk.bold('Evidence:'), options.pr);
    console.log(chalk.bold('Result Hash:'), chalk.gray(resultHash));
    console.log(chalk.bold('Signature:'), chalk.gray(signature.slice(0, 20) + '...'));
    console.log(chalk.bold('Transaction:'), chalk.gray(receipt.hash));
    console.log(chalk.gray('─'.repeat(50)));
    console.log('\n' + chalk.green('✓ Work proof recorded on-chain!'));
    console.log(chalk.dim('View on BaseScan: https://sepolia.basescan.org/tx/' + receipt.hash + '\n'));

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
