import chalk from 'chalk';
import ora from 'ora';
import { Wallet, ethers, JsonRpcProvider } from 'ethers';
import { config } from '../config';

const IDENTITY_REGISTRY_ABI = [
  'function registerAgent(string cardURI) external',
  'function getAgentCard(address agent) external view returns (string)',
  'function isRegistered(address agent) external view returns (bool)',
  'event AgentRegistered(address indexed agent, string cardURI)'
];

async function createIdentity() {
  const spinner = ora('Creating ERC-8004 identity').start();

  try {
    const wallet = new Wallet(config.agentPrivateKey);
    const provider = new JsonRpcProvider(config.rpcUrl);
    const signer = wallet.connect(provider);

    spinner.text = 'Checking if agent is already registered...';

    const registry = new ethers.Contract(
      config.identityRegistryAddress,
      IDENTITY_REGISTRY_ABI,
      signer
    );

    const isRegistered = await registry.isRegistered(wallet.address);

    if (isRegistered) {
      spinner.info(chalk.yellow('Agent already registered'));
      const cardURI = await registry.getAgentCard(wallet.address);
      console.log('\n' + chalk.bold('Agent ID:'), chalk.cyan(`erc8004:${wallet.address}`));
      console.log(chalk.bold('Card URI:'), cardURI);
      return;
    }

    spinner.text = 'Registering agent on-chain...';

    // Create basic agent card
    const agentCard = {
      name: 'Agent ' + wallet.address.slice(0, 8),
      address: wallet.address,
      skills: ['ci-cd-fix', 'code-review', 'testing'],
      endpoints: [config.arenaEndpoint],
      version: '1.0.0'
    };

    const cardURI = `data:application/json;base64,${Buffer.from(JSON.stringify(agentCard)).toString('base64')}`;

    const tx = await registry.registerAgent(cardURI);
    spinner.text = 'Waiting for transaction confirmation...';
    
    const receipt = await tx.wait();

    spinner.succeed(chalk.green('Agent identity created!'));

    console.log('\n' + chalk.bold('Agent ID:'), chalk.cyan(`erc8004:${wallet.address}`));
    console.log(chalk.bold('Address:'), wallet.address);
    console.log(chalk.bold('Transaction:'), chalk.gray(receipt.hash));
    console.log('\n' + chalk.dim('Save this agent ID for claiming bounties\n'));

  } catch (error: any) {
    spinner.fail(chalk.red('Failed to create identity'));
    console.error(error.message);
    process.exit(1);
  }
}

async function showIdentity() {
  try {
    const wallet = new Wallet(config.agentPrivateKey);
    const provider = new JsonRpcProvider(config.rpcUrl);
    const signer = wallet.connect(provider);

    const registry = new ethers.Contract(
      config.identityRegistryAddress,
      IDENTITY_REGISTRY_ABI,
      signer
    );

    const isRegistered = await registry.isRegistered(wallet.address);

    if (!isRegistered) {
      console.log(chalk.yellow('Agent not registered. Run:'));
      console.log(chalk.gray('  npx arena id:create\n'));
      return;
    }

    const cardURI = await registry.getAgentCard(wallet.address);

    console.log('\n' + chalk.bold('Agent Identity'));
    console.log(chalk.gray('─'.repeat(50)));
    console.log(chalk.bold('Agent ID:'), chalk.cyan(`erc8004:${wallet.address}`));
    console.log(chalk.bold('Address:'), wallet.address);
    console.log(chalk.bold('Card URI:'), cardURI);
    console.log(chalk.bold('Network:'), config.chainId === 84532 ? 'Base Sepolia' : 'Base Mainnet');
    console.log(chalk.gray('─'.repeat(50)) + '\n');

  } catch (error: any) {
    console.error(chalk.red('Error:'), error.message);
    process.exit(1);
  }
}

export const idCommand = {
  create: createIdentity,
  show: showIdentity
};
