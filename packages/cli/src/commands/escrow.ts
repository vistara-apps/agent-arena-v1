import chalk from 'chalk';
import ora from 'ora';
import { Wallet, ethers, JsonRpcProvider } from 'ethers';
import { config } from '../config';

const BOUNTY_SYSTEM_ABI = [
  'function approveBounty(uint256 bountyId, bytes32 attestationHash) external',
  'function getBountyEscrow(uint256 bountyId) external view returns (uint256)',
  'event BountyCompleted(uint256 indexed bountyId, address indexed agent, uint256 amount, bytes32 attestationHash)'
];

interface ReleaseOptions {
  bounty: string;
  attestation: string;
}

async function releaseEscrow(options: ReleaseOptions) {
  const spinner = ora('Releasing escrow').start();

  try {
    const wallet = new Wallet(config.agentPrivateKey);
    const provider = new JsonRpcProvider(config.rpcUrl);
    const signer = wallet.connect(provider);

    const bountySystem = new ethers.Contract(
      config.bountySystemAddress,
      BOUNTY_SYSTEM_ABI,
      signer
    );

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
      .map((log: any) => {
        try {
          return bountySystem.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((e: any) => e && e.name === 'BountyCompleted');

    spinner.succeed(chalk.green('Escrow released!'));

    console.log('\n' + chalk.bold('Payment Details'));
    console.log(chalk.gray('─'.repeat(50)));
    console.log(chalk.bold('Bounty ID:'), chalk.cyan(options.bounty));
    if (event) {
      console.log(chalk.bold('Agent:'), event.args.agent);
      console.log(chalk.bold('Amount:'), ethers.formatEther(event.args.amount), 'ETH');
    }
    console.log(chalk.bold('Attestation:'), attestationHash);
    console.log(chalk.bold('Transaction:'), chalk.gray(receipt.hash));
    console.log(chalk.gray('─'.repeat(50)));
    console.log('\n' + chalk.green('✓ Payment complete!') + '\n');

  } catch (error: any) {
    spinner.fail(chalk.red('Failed to release escrow'));
    console.error(error.message);
    process.exit(1);
  }
}

async function checkEscrowStatus(bountyId: string) {
  const spinner = ora(`Checking escrow for bounty #${bountyId}`).start();

  try {
    const provider = new JsonRpcProvider(config.rpcUrl);

    const bountySystem = new ethers.Contract(
      config.bountySystemAddress,
      BOUNTY_SYSTEM_ABI,
      provider
    );

    const escrowAmount = await bountySystem.getBountyEscrow(bountyId);

    spinner.succeed(chalk.green('Escrow status retrieved'));

    console.log('\n' + chalk.bold(`Escrow Status - Bounty #${bountyId}`));
    console.log(chalk.gray('─'.repeat(50)));
    console.log(chalk.bold('Escrowed Amount:'), ethers.formatEther(escrowAmount), 'ETH');
    console.log(chalk.bold('Status:'), Number(escrowAmount) > 0 ? chalk.green('Active') : chalk.yellow('Released/Empty'));
    console.log(chalk.gray('─'.repeat(50)) + '\n');

  } catch (error: any) {
    spinner.fail(chalk.red('Failed to check escrow status'));
    console.error(error.message);
    process.exit(1);
  }
}

export const escrowCommand = {
  release: releaseEscrow,
  status: checkEscrowStatus
};
