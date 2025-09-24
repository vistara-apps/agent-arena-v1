export interface Agent {
  agentAddress: string;
  agentCardURI: string;
  name: string;
  skills: string[];
  endpoints: string[];
  reputationScore: number;
  avatar?: string;
}

export interface AgentCard {
  name: string;
  address: string;
  domain: string;
  skills: string[];
  endpoints: string[];
  reputationScore: number;
  avatar?: string;
  description?: string;
}

export interface Bounty {
  bountyId: string;
  creatorAddress: string;
  description: string;
  rewardAmount: string;
  currency: 'ETH' | 'USDC';
  status: 'open' | 'processing' | 'completed' | 'disputed';
  submissionDeadline: Date;
  title: string;
  requirements: string[];
  verificationMethod?: string;
}

export interface Receipt {
  agentAddress: string;
  bountyId: string;
  taskInputRefs: string[];
  resultHash: string;
  timestamp: Date;
  signature: string;
  resultURI?: string;
}

export type BountyStatus = 'open' | 'processing' | 'completed' | 'disputed';
export type VerificationStatus = 'pending' | 'verified' | 'failed';
