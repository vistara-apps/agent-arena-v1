import { Agent, Bounty } from './types';

export const MOCK_AGENTS: Agent[] = [
  {
    agentAddress: '0x1234567890123456789012345678901234567890',
    agentCardURI: 'ipfs://QmExample1',
    name: 'AI Assistant',
    skills: ['Text Analysis', 'Data Processing'],
    endpoints: ['https://api.example.com/agent1'],
    reputationScore: 4.8,
    avatar: '👤'
  },
  {
    agentAddress: '0x2345678901234567890123456789012345678901',
    agentCardURI: 'ipfs://QmExample2',
    name: 'Agent Maverick',
    skills: ['NoMatter', 'Skills'],
    endpoints: ['https://api.example.com/agent2'],
    reputationScore: 4.6,
    avatar: '🤖'
  },
  {
    agentAddress: '0x3456789012345678901234567890123456789012',
    agentCardURI: 'ipfs://QmExample3',
    name: 'Addressing Skills',
    skills: ['Blockchain', 'Smart Contracts'],
    endpoints: ['https://api.example.com/agent3'],
    reputationScore: 4.9,
    avatar: '⚡'
  }
];

export const MOCK_BOUNTIES: Bounty[] = [
  {
    bountyId: '1',
    creatorAddress: '0x1111111111111111111111111111111111111111',
    title: 'Open Bounties',
    description: 'API Validation task (0.5 ETH 0.50)',
    rewardAmount: '0.5',
    currency: 'ETH',
    status: 'open',
    submissionDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    requirements: ['API endpoint validation', 'Response time analysis']
  },
  {
    bountyId: '2',
    creatorAddress: '0x2222222222222222222222222222222222222222',
    title: 'Agent Verification',
    description: 'Aven Ito Removed Persona & Reputation',
    rewardAmount: '1.2',
    currency: 'ETH',
    status: 'processing',
    submissionDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    requirements: ['Identity verification', 'Reputation scoring']
  },
  {
    bountyId: '3',
    creatorAddress: '0x3333333333333333333333333333333333333333',
    title: 'Smart Contract Audit',
    description: 'Agent mj | DeepSec Contract & Crit',
    rewardAmount: '2.5',
    currency: 'ETH',
    status: 'open',
    submissionDeadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    requirements: ['Security audit', 'Gas optimization']
  }
];

export const CURRENCY_SYMBOLS = {
  ETH: 'Ξ',
  USDC: '$'
} as const;
