import { Address } from 'viem';

// Contract ABIs (simplified for demo - in production, use full compiled ABIs)
export const IDENTITY_REGISTRY_ABI = [
  {
    inputs: [{ name: 'cardURI', type: 'string' }],
    name: 'registerAgent',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'agent', type: 'address' }],
    name: 'getAgentCardURI',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'agent', type: 'address' }],
    name: 'isAgentActive',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'agent', type: 'address' },
      { name: 'message', type: 'bytes32' },
      { name: 'signature', type: 'bytes' },
    ],
    name: 'verifyAgentSignature',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
];

export const BOUNTY_SYSTEM_ABI = [
  {
    inputs: [
      { name: 'description', type: 'string' },
      { name: 'rewardAmount', type: 'uint256' },
      { name: 'rewardToken', type: 'address' },
      { name: 'submissionDeadline', type: 'uint256' },
      { name: 'verificationMethod', type: 'string' },
    ],
    name: 'createBounty',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'bountyId', type: 'uint256' },
      { name: 'taskInputRefs', type: 'string[]' },
      { name: 'resultHash', type: 'string' },
      { name: 'signature', type: 'bytes' },
      { name: 'resultURI', type: 'string' },
    ],
    name: 'submitReceipt',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'bountyId', type: 'uint256' }],
    name: 'approveBounty',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'bountyId', type: 'uint256' }],
    name: 'getBounty',
    outputs: [
      {
        components: [
          { name: 'bountyId', type: 'uint256' },
          { name: 'creator', type: 'address' },
          { name: 'description', type: 'string' },
          { name: 'rewardAmount', type: 'uint256' },
          { name: 'rewardToken', type: 'address' },
          { name: 'status', type: 'string' },
          { name: 'submissionDeadline', type: 'uint256' },
          { name: 'verificationMethod', type: 'string' },
          { name: 'createdAt', type: 'uint256' },
          { name: 'assignedAgent', type: 'address' },
          { name: 'resultURI', type: 'string' },
          { name: 'platformFee', type: 'uint256' },
        ],
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'bountyId', type: 'uint256' }],
    name: 'getBountyReceipts',
    outputs: [
      {
        components: [
          { name: 'agentAddress', type: 'address' },
          { name: 'bountyId', type: 'uint256' },
          { name: 'taskInputRefs', type: 'string[]' },
          { name: 'resultHash', type: 'string' },
          { name: 'timestamp', type: 'uint256' },
          { name: 'signature', type: 'bytes' },
          { name: 'resultURI', type: 'string' },
        ],
        type: 'tuple[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
];

// Contract addresses (deploy to Base testnet/mainnet)
export const CONTRACT_ADDRESSES = {
  IDENTITY_REGISTRY: '0x0000000000000000000000000000000000000000' as Address, // Replace with deployed address
  BOUNTY_SYSTEM: '0x0000000000000000000000000000000000000000' as Address, // Replace with deployed address
} as const;

// Contract instances
export const getIdentityRegistryContract = () => {
  return {
    contract: getContract({
      address: CONTRACT_ADDRESSES.IDENTITY_REGISTRY,
      abi: IDENTITY_REGISTRY_ABI,
      client: { public: publicClient, wallet: walletClient },
    }),
    address: CONTRACT_ADDRESSES.IDENTITY_REGISTRY,
    abi: IDENTITY_REGISTRY_ABI,
  };
};

export const getBountySystemContract = () => {
  return {
    contract: getContract({
      address: CONTRACT_ADDRESSES.BOUNTY_SYSTEM,
      abi: BOUNTY_SYSTEM_ABI,
      client: { public: publicClient, wallet: walletClient },
    }),
    address: CONTRACT_ADDRESSES.BOUNTY_SYSTEM,
    abi: BOUNTY_SYSTEM_ABI,
  };
};

// Utility functions
export const formatAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const formatTimestamp = (timestamp: number) => {
  return new Date(timestamp * 1000).toLocaleDateString();
};

export const formatCurrency = (amount: string, currency: 'ETH' | 'USDC') => {
  const numAmount = parseFloat(amount);
  if (currency === 'ETH') {
    return `${(numAmount / 1e18).toFixed(4)} ETH`;
  }
  return `${(numAmount / 1e6).toFixed(2)} USDC`;
};
