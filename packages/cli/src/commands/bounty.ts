import chalk from 'chalk';
import ora from 'ora';
import { Wallet, ethers, JsonRpcProvider, parseEther } from 'ethers';
import { config } from '../config';

// ERC-8004 BountySystem ABI
const BOUNTY_SYSTEM_ABI = [
  'function createBounty(string description, uint256 rewardAmount, address tokenAddress, uint256 deadline) external payable returns (uint256)',
  'function getBounty(uint256 bountyId) external view returns (tuple(uint256 bountyId, address creator, string description, uint256 rewardAmount, address rewardToken, uint8 status, uint256 submissionDeadline, uint256 createdAt, uint256 assignedAgentId, string resultURI))',
  'function bountyCount() external view returns (uint256)',
  'event BountyCreated(uint256 indexed bountyId, address indexed creator, uint256 rewardAmount, address rewardToken)'
];

interface CreateBountyOptions {
  repo: string;
  issue: string;
  escrow: string;
  currency?: string;
}

async function createBounty(options: CreateBountyOptions) {
  const spinner = ora('Creating bounty').start();

  try {
    const wallet = new Wallet(config.agentPrivateKey);
    const provider = new JsonRpcProvider(config.rpcUrl);
    const signer = wallet.connect(provider);

    const bountySystem = new ethers.Contract(
      config.bountySystemAddress,
      BOUNTY_SYSTEM_ABI,
      signer
    );

    const description = `Fix issue ${options.issue} in ${options.repo}`;
    const rewardAmount = parseEther(options.escrow);
    const tokenAddress = '0x0000000000000000000000000000000000000000'; // ETH
    const deadline = Math.floor(Date.now() / 1000) + 86400; // 24 hours

    spinner.text = 'Submitting transaction...';

    const tx = await bountySystem.createBounty(
      description,
      rewardAmount,
      tokenAddress,
      deadline,
      { value: rewardAmount }
    );

    spinner.text = 'Waiting for confirmation...';
    const receipt = await tx.wait();

    // Extract bounty ID from event
    const event = receipt.logs
      .map((log: any) => {
        try {
          return bountySystem.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((e: any) => e && e.name === 'BountyCreated');

    const bountyId = event?.args?.bountyId?.toString() || 'unknown';

    spinner.succeed(chalk.green('Bounty created!'));

    console.log('\n' + chalk.bold('Bounty Details'));
    console.log(chalk.gray('─'.repeat(50)));
    console.log(chalk.bold('Bounty ID:'), chalk.cyan(bountyId));
    console.log(chalk.bold('Repository:'), options.repo);
    console.log(chalk.bold('Issue:'), options.issue);
    console.log(chalk.bold('Reward:'), options.escrow, options.currency || 'ETH');
    console.log(chalk.bold('Transaction:'), chalk.gray(receipt.hash));
    console.log(chalk.gray('─'.repeat(50)) + '\n');

  } catch (error: any) {
    spinner.fail(chalk.red('Failed to create bounty'));
    console.error(error.message);
    process.exit(1);
  }
}

async function listBounties() {
  const spinner = ora('Fetching bounties').start();

  try {
    const provider = new JsonRpcProvider(config.rpcUrl);

    const bountySystem = new ethers.Contract(
      config.bountySystemAddress,
      BOUNTY_SYSTEM_ABI,
      provider
    );

    const totalBounties = await bountySystem.bountyCount();

    spinner.succeed(chalk.green(`Found ${totalBounties} total bounties`));

    console.log('\n' + chalk.bold('Active Bounties'));
    console.log(chalk.gray('─'.repeat(50)));

    for (let i = 1; i <= Number(totalBounties); i++) {
      try {
        const bounty = await bountySystem.getBounty(i);
        const reward = ethers.formatEther(bounty.rewardAmount);
        
        console.log(chalk.bold(`#${i}:`), bounty.description);
        console.log(chalk.gray('  Reward:'), reward, 'ETH');
        console.log(chalk.gray('  Status:'), ['Open', 'Claimed', 'Completed'][bounty.status]);
        if (bounty.assignedAgentId > 0) {
          console.log(chalk.gray('  Agent NFT:'), `#${bounty.assignedAgentId}`);
        }
        console.log();
      } catch {
        continue;
      }
    }

    console.log(chalk.gray('─'.repeat(50)) + '\n');

  } catch (error: any) {
    spinner.fail(chalk.red('Failed to fetch bounties'));
    console.error(error.message);
    process.exit(1);
  }
}

async function showBounty(bountyId: string) {
  const spinner = ora(`Fetching bounty #${bountyId}`).start();

  try {
    const provider = new JsonRpcProvider(config.rpcUrl);

    const bountySystem = new ethers.Contract(
      config.bountySystemAddress,
      BOUNTY_SYSTEM_ABI,
      provider
    );

    const bounty = await bountySystem.getBounty(bountyId);

    spinner.succeed(chalk.green('Bounty loaded'));

    console.log('\n' + chalk.bold(`Bounty #${bounty.bountyId}`));
    console.log(chalk.gray('─'.repeat(50)));
    console.log(chalk.bold('Creator:'), bounty.creator);
    console.log(chalk.bold('Description:'), bounty.description);
    console.log(chalk.bold('Reward:'), ethers.formatEther(bounty.rewardAmount), 'ETH');
    console.log(chalk.bold('Status:'), ['Open', 'Claimed', 'Completed'][bounty.status]);
    console.log(chalk.bold('Deadline:'), new Date(Number(bounty.submissionDeadline) * 1000).toISOString());
    console.log(chalk.bold('Created:'), new Date(Number(bounty.createdAt) * 1000).toISOString());
    if (bounty.assignedAgentId > 0) {
      console.log(chalk.bold('Assigned Agent NFT:'), `#${bounty.assignedAgentId}`);
    }
    console.log(chalk.gray('─'.repeat(50)) + '\n');

  } catch (error: any) {
    spinner.fail(chalk.red('Failed to fetch bounty'));
    console.error(error.message);
    process.exit(1);
  }
}

export const bountyCommand = {
  create: createBounty,
  list: listBounties,
  show: showBounty
};
