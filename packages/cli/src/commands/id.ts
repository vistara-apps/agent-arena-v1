import chalk from 'chalk';
import ora from 'ora';
import { Wallet, ethers, JsonRpcProvider } from 'ethers';
import { config } from '../config';

// Official ERC-8004 IdentityRegistry (ERC-721)
const IDENTITY_REGISTRY_ABI = [
  'function register(string tokenUri) external returns (uint256)',
  'function ownerOf(uint256 tokenId) external view returns (address)',
  'function tokenURI(uint256 tokenId) external view returns (string)',
  'function balanceOf(address owner) external view returns (uint256)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256)',
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
  'event Registered(uint256 indexed agentId, string tokenURI, address indexed owner)'
];

async function createIdentity() {
  const spinner = ora('Creating ERC-8004 identity (minting NFT)').start();

  try {
    const wallet = new Wallet(config.agentPrivateKey);
    const provider = new JsonRpcProvider(config.rpcUrl);
    const signer = wallet.connect(provider);

    spinner.text = 'Checking if agent already has identity...';

    const registry = new ethers.Contract(
      config.identityRegistryAddress,
      IDENTITY_REGISTRY_ABI,
      signer
    );

    // Check if agent already owns an NFT
    const balance = await registry.balanceOf(wallet.address);

    if (balance > 0) {
      const agentId = await registry.tokenOfOwnerByIndex(wallet.address, 0);
      const tokenURI = await registry.tokenURI(agentId);

      spinner.info(chalk.yellow('Agent already has identity'));
      console.log('\n' + chalk.bold('Agent ID:'), chalk.cyan(`#${agentId}`));
      console.log(chalk.bold('Address:'), wallet.address);
      console.log(chalk.bold('Token URI:'), tokenURI);
      console.log(chalk.bold('NFTs Owned:'), balance.toString());
      console.log('\n' + chalk.dim('This identity works on ALL ERC-8004 platforms!\n'));
      return;
    }

    spinner.text = 'Minting agent NFT...';

    // Create agent card
    const agentCard = {
      type: 'https://eips.ethereum.org/EIPS/eip-8004#registration-v1',
      name: 'Agent ' + wallet.address.slice(0, 8),
      description: 'Agent Arena agent with portable reputation',
      endpoints: [
        {
          name: 'agentWallet',
          endpoint: `eip155:${config.chainId}:${wallet.address}`
        }
      ],
      supportedTrust: ['reputation', 'validation']
    };

    const tokenURI = `data:application/json;base64,${Buffer.from(JSON.stringify(agentCard)).toString('base64')}`;

    const tx = await registry.register(tokenURI);
    spinner.text = 'Waiting for transaction confirmation...';

    const receipt = await tx.wait();

    // Extract agent ID from Transfer event
    const transferEvent = receipt.logs.find((log: any) =>
      log.topics[0] === ethers.id('Transfer(address,address,uint256)')
    );

    const agentId = transferEvent ? ethers.toBigInt(transferEvent.topics[3]) : 0n;

    spinner.succeed(chalk.green('Agent identity created!'));

    console.log('\n' + chalk.bold('🎉 Your Agent NFT:'));
    console.log(chalk.gray('─'.repeat(50)));
    console.log(chalk.bold('Agent ID:'), chalk.cyan(`#${agentId}`));
    console.log(chalk.bold('Address:'), wallet.address);
    console.log(chalk.bold('Network:'), config.chainId === 84532 ? 'Base Sepolia' : 'Base');
    console.log(chalk.bold('Transaction:'), chalk.gray(receipt.hash));
    console.log(chalk.gray('─'.repeat(50)));
    console.log('\n' + chalk.green('✨ This identity works on ALL ERC-8004 platforms!'));
    console.log(chalk.dim('Your reputation is now portable forever.\n'));

    console.log(chalk.bold('View on BaseScan:'));
    const explorerUrl = config.chainId === 84532
      ? `https://sepolia.basescan.org/tx/${receipt.hash}`
      : `https://basescan.org/tx/${receipt.hash}`;
    console.log(chalk.blue(explorerUrl) + '\n');

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

    const balance = await registry.balanceOf(wallet.address);

    if (balance === 0n) {
      console.log(chalk.yellow('\n⚠️  No agent identity found\n'));
      console.log(chalk.bold('Create one with:'));
      console.log(chalk.gray('  npx arena id:create\n'));
      return;
    }

    const agentId = await registry.tokenOfOwnerByIndex(wallet.address, 0);
    const tokenURI = await registry.tokenURI(agentId);

    console.log('\n' + chalk.bold('🤖 Agent Identity (ERC-721 NFT)'));
    console.log(chalk.gray('─'.repeat(50)));
    console.log(chalk.bold('Agent ID:'), chalk.cyan(`#${agentId}`));
    console.log(chalk.bold('Address:'), wallet.address);
    console.log(chalk.bold('NFTs Owned:'), balance.toString());
    console.log(chalk.bold('Token URI:'), tokenURI);
    console.log(chalk.bold('Network:'), config.chainId === 84532 ? 'Base Sepolia' : 'Base');
    console.log(chalk.bold('Registry:'), chalk.gray(config.identityRegistryAddress));
    console.log(chalk.gray('─'.repeat(50)));

    console.log('\n' + chalk.green('✨ This is the OFFICIAL ERC-8004 singleton'));
    console.log(chalk.dim('Your identity works across ALL platforms that use ERC-8004!\n'));

    // Show BaseScan link
    const nftUrl = config.chainId === 84532
      ? `https://sepolia.basescan.org/token/${config.identityRegistryAddress}?a=${agentId}`
      : `https://basescan.org/token/${config.identityRegistryAddress}?a=${agentId}`;

    console.log(chalk.bold('View on BaseScan:'));
    console.log(chalk.blue(nftUrl) + '\n');

  } catch (error: any) {
    console.error(chalk.red('Error:'), error.message);
    process.exit(1);
  }
}

export const idCommand = {
  create: createIdentity,
  show: showIdentity
};
