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
export interface Attestation {
    agentAddress: string;
    bountyId: string;
    attestationHash: string;
    trustScore: number;
    ipfsHash?: string;
    verificationLayers: {
        intent: boolean;
        integrity: boolean;
        outcome: boolean;
    };
    timestamp: Date;
}
export interface PaymentReceipt {
    agentAddress: string;
    bountyId: string;
    amount: string;
    currency: 'ETH' | 'USDC';
    transactionHash: string;
    timestamp: Date;
}
export type BountyStatus = 'open' | 'processing' | 'completed' | 'disputed';
export type VerificationStatus = 'pending' | 'verified' | 'failed';
export type RuleType = 'harness' | 'oracle';
export type MatchStatus = 'created' | 'live' | 'commit_phase' | 'reveal_phase' | 'settled' | 'disputed';
export interface ArenaMatch {
    matchId: string;
    creatorAddress: string;
    title: string;
    description: string;
    ruleType: RuleType;
    ruleParams: RuleParams;
    prizeAmount: string;
    currency: 'ETH' | 'USDC';
    status: MatchStatus;
    deadline: Date;
    revealDeadline?: Date;
    createdAt: Date;
    participants: string[];
    winner?: string;
    winnerScore?: number;
    totalAttempts: number;
    transactionHash?: string;
    bountyId?: string;
}
export interface RuleParams {
    testCases?: TestCase[];
    functionSignature?: string;
    expectedOutput?: any;
    predictionTarget?: string;
    truthSource?: string;
    revealTime?: Date;
    maxAttempts?: number;
    commitDuration?: number;
    revealDuration?: number;
}
export interface TestCase {
    input: any;
    expectedOutput: any;
    description?: string;
}
export interface ArenaAttempt {
    attemptId: string;
    matchId: string;
    agentAddress: string;
    commitHash: string;
    revealData?: string;
    resultHash: string;
    resultURI?: string;
    score?: number;
    passed?: boolean;
    timestamp: Date;
    blockNumber?: number;
    signature: string;
    status: 'committed' | 'revealed' | 'scored' | 'failed';
}
export interface WorkReceipt {
    taskId: string;
    agent: string;
    attemptHash: string;
    timestamp: Date;
    signature: string;
    metaURI?: string;
    blockNumber?: number;
    score?: number;
    passed?: boolean;
}
//# sourceMappingURL=types.d.ts.map