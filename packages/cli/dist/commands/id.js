"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.idCommand = void 0;
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const ethers_1 = require("ethers");
const config_1 = require("../config");
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
    const spinner = (0, ora_1.default)('Creating ERC-8004 identity (minting NFT)').start();
    try {
        const wallet = new ethers_1.Wallet(config_1.config.agentPrivateKey);
        const provider = new ethers_1.JsonRpcProvider(config_1.config.rpcUrl);
        const signer = wallet.connect(provider);
        spinner.text = 'Checking if agent already has identity...';
        const registry = new ethers_1.ethers.Contract(config_1.config.identityRegistryAddress, IDENTITY_REGISTRY_ABI, signer);
        // Check if agent already owns an NFT
        const balance = await registry.balanceOf(wallet.address);
        if (balance > 0) {
            const agentId = await registry.tokenOfOwnerByIndex(wallet.address, 0);
            const tokenURI = await registry.tokenURI(agentId);
            spinner.info(chalk_1.default.yellow('Agent already has identity'));
            console.log('\n' + chalk_1.default.bold('Agent ID:'), chalk_1.default.cyan(`#${agentId}`));
            console.log(chalk_1.default.bold('Address:'), wallet.address);
            console.log(chalk_1.default.bold('Token URI:'), tokenURI);
            console.log(chalk_1.default.bold('NFTs Owned:'), balance.toString());
            console.log('\n' + chalk_1.default.dim('This identity works on ALL ERC-8004 platforms!\n'));
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
                    endpoint: `eip155:${config_1.config.chainId}:${wallet.address}`
                }
            ],
            supportedTrust: ['reputation', 'validation']
        };
        const tokenURI = `data:application/json;base64,${Buffer.from(JSON.stringify(agentCard)).toString('base64')}`;
        const tx = await registry.register(tokenURI);
        spinner.text = 'Waiting for transaction confirmation...';
        const receipt = await tx.wait();
        // Extract agent ID from Transfer event
        const transferEvent = receipt.logs.find((log) => log.topics[0] === ethers_1.ethers.id('Transfer(address,address,uint256)'));
        const agentId = transferEvent ? ethers_1.ethers.toBigInt(transferEvent.topics[3]) : 0n;
        spinner.succeed(chalk_1.default.green('Agent identity created!'));
        console.log('\n' + chalk_1.default.bold('🎉 Your Agent NFT:'));
        console.log(chalk_1.default.gray('─'.repeat(50)));
        console.log(chalk_1.default.bold('Agent ID:'), chalk_1.default.cyan(`#${agentId}`));
        console.log(chalk_1.default.bold('Address:'), wallet.address);
        console.log(chalk_1.default.bold('Network:'), config_1.config.chainId === 84532 ? 'Base Sepolia' : 'Base');
        console.log(chalk_1.default.bold('Transaction:'), chalk_1.default.gray(receipt.hash));
        console.log(chalk_1.default.gray('─'.repeat(50)));
        console.log('\n' + chalk_1.default.green('✨ This identity works on ALL ERC-8004 platforms!'));
        console.log(chalk_1.default.dim('Your reputation is now portable forever.\n'));
        console.log(chalk_1.default.bold('View on BaseScan:'));
        const explorerUrl = config_1.config.chainId === 84532
            ? `https://sepolia.basescan.org/tx/${receipt.hash}`
            : `https://basescan.org/tx/${receipt.hash}`;
        console.log(chalk_1.default.blue(explorerUrl) + '\n');
    }
    catch (error) {
        spinner.fail(chalk_1.default.red('Failed to create identity'));
        console.error(error.message);
        process.exit(1);
    }
}
async function showIdentity() {
    try {
        const wallet = new ethers_1.Wallet(config_1.config.agentPrivateKey);
        const provider = new ethers_1.JsonRpcProvider(config_1.config.rpcUrl);
        const signer = wallet.connect(provider);
        const registry = new ethers_1.ethers.Contract(config_1.config.identityRegistryAddress, IDENTITY_REGISTRY_ABI, signer);
        const balance = await registry.balanceOf(wallet.address);
        if (balance === 0n) {
            console.log(chalk_1.default.yellow('\n⚠️  No agent identity found\n'));
            console.log(chalk_1.default.bold('Create one with:'));
            console.log(chalk_1.default.gray('  npx arena id:create\n'));
            return;
        }
        const agentId = await registry.tokenOfOwnerByIndex(wallet.address, 0);
        const tokenURI = await registry.tokenURI(agentId);
        console.log('\n' + chalk_1.default.bold('🤖 Agent Identity (ERC-721 NFT)'));
        console.log(chalk_1.default.gray('─'.repeat(50)));
        console.log(chalk_1.default.bold('Agent ID:'), chalk_1.default.cyan(`#${agentId}`));
        console.log(chalk_1.default.bold('Address:'), wallet.address);
        console.log(chalk_1.default.bold('NFTs Owned:'), balance.toString());
        console.log(chalk_1.default.bold('Token URI:'), tokenURI);
        console.log(chalk_1.default.bold('Network:'), config_1.config.chainId === 84532 ? 'Base Sepolia' : 'Base');
        console.log(chalk_1.default.bold('Registry:'), chalk_1.default.gray(config_1.config.identityRegistryAddress));
        console.log(chalk_1.default.gray('─'.repeat(50)));
        console.log('\n' + chalk_1.default.green('✨ This is the OFFICIAL ERC-8004 singleton'));
        console.log(chalk_1.default.dim('Your identity works across ALL platforms that use ERC-8004!\n'));
        // Show BaseScan link
        const nftUrl = config_1.config.chainId === 84532
            ? `https://sepolia.basescan.org/token/${config_1.config.identityRegistryAddress}?a=${agentId}`
            : `https://basescan.org/token/${config_1.config.identityRegistryAddress}?a=${agentId}`;
        console.log(chalk_1.default.bold('View on BaseScan:'));
        console.log(chalk_1.default.blue(nftUrl) + '\n');
    }
    catch (error) {
        console.error(chalk_1.default.red('Error:'), error.message);
        process.exit(1);
    }
}
exports.idCommand = {
    create: createIdentity,
    show: showIdentity
};
//# sourceMappingURL=id.js.map