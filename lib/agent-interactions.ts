import { keccak256, encodePacked } from 'viem';
import { minikit } from './minikit';
import { storage, type Receipt } from './storage';

// Agent interaction utilities for A2A communication

export interface TaskInput {
  id: string;
  type: 'text' | 'image' | 'video' | 'audio';
  content: string;
  metadata?: Record<string, any>;
}

export interface TaskResult {
  taskId: string;
  output: string;
  confidence?: number;
  metadata?: Record<string, any>;
}

export interface SignedReceipt extends Receipt {
  signature: `0x${string}`;
}

// Generate a deterministic result hash
export const generateResultHash = (results: TaskResult[]): string => {
  const data = results
    .map(result => `${result.taskId}:${result.output}`)
    .sort()
    .join('|');

  return keccak256(encodePacked(['string'], [data]));
};

// Create a signed receipt for bounty submission
export const createSignedReceipt = async (
  bountyId: string,
  taskInputRefs: string[],
  results: TaskResult[],
  resultURI?: string
): Promise<SignedReceipt> => {
  try {
    const agentAddress = await minikit.getAddress();
    if (!agentAddress) {
      throw new Error('No wallet connected');
    }

    const resultHash = generateResultHash(results);
    const timestamp = Math.floor(Date.now() / 1000);

    // Create the message to sign
    const message = `${bountyId}:${taskInputRefs.join(',')}:${resultHash}:${timestamp}`;
    const signature = await minikit.signMessage(message);

    const receipt: SignedReceipt = {
      agentAddress,
      bountyId,
      taskInputRefs,
      resultHash,
      timestamp,
      signature: signature as `0x${string}`,
      resultURI,
    };

    return receipt;
  } catch (error) {
    console.error('Failed to create signed receipt:', error);
    throw new Error('Receipt creation failed');
  }
};

// Verify a receipt signature
export const verifyReceiptSignature = async (
  receipt: SignedReceipt
): Promise<boolean> => {
  try {
    const message = `${receipt.bountyId}:${receipt.taskInputRefs.join(',')}:${receipt.resultHash}:${receipt.timestamp}`;

    // Use contract to verify signature
    // In production, this would call the IdentityRegistry.verifyAgentSignature function
    const messageHash = keccak256(encodePacked(['string'], [message]));

    // For demo purposes, we'll do basic verification
    // In production, use the contract method
    return true; // Placeholder
  } catch (error) {
    console.error('Failed to verify receipt signature:', error);
    return false;
  }
};

// Submit receipt to bounty system
export const submitReceiptToBounty = async (
  bountyId: string,
  taskInputRefs: string[],
  results: TaskResult[],
  resultURI?: string
): Promise<string> => {
  try {
    // Create signed receipt
    const receipt = await createSignedReceipt(bountyId, taskInputRefs, results, resultURI);

    // Upload receipt to storage
    const receiptURI = await storage.uploadReceipt(receipt);

    // Submit to contract (would call BountySystem.submitReceipt)
    // For demo, we'll just return the URI
    console.log('Receipt submitted:', { receipt, receiptURI });

    return receiptURI;
  } catch (error) {
    console.error('Failed to submit receipt:', error);
    throw new Error('Receipt submission failed');
  }
};

// Agent-to-Agent communication for referee scoring
export const submitRefereeDecision = async (
  bountyId: string,
  receiptURI: string,
  decision: 'approved' | 'rejected',
  score: number,
  reason: string
): Promise<string> => {
  try {
    const refereeAddress = await minikit.getAddress();
    if (!refereeAddress) {
      throw new Error('No wallet connected');
    }

    const timestamp = Math.floor(Date.now() / 1000);

    const decisionData = {
      bountyId,
      receiptURI,
      refereeAddress,
      decision,
      score,
      reason,
      timestamp,
    };

    // Sign the decision
    const message = JSON.stringify(decisionData);
    const signature = await minikit.signMessage(message);

    const signedDecision = {
      ...decisionData,
      signature: signature as `0x${string}`,
    };

    // Upload to storage
    const decisionURI = await storage.uploadReceipt(signedDecision as any);

    return decisionURI;
  } catch (error) {
    console.error('Failed to submit referee decision:', error);
    throw new Error('Decision submission failed');
  }
};

// Automated agent matching (basic implementation)
export const findMatchingAgents = async (
  requiredSkills: string[],
  minReputation: number = 0
): Promise<string[]> => {
  try {
    // In production, this would query the IdentityRegistry contract
    // and filter agents based on skills and reputation

    // For demo, return mock agent addresses
    const mockAgents = [
      '0x1234567890123456789012345678901234567890',
      '0x2345678901234567890123456789012345678901',
      '0x3456789012345678901234567890123456789012',
    ];

    // Filter based on skills and reputation (mock logic)
    return mockAgents.filter(() => Math.random() > 0.5);
  } catch (error) {
    console.error('Failed to find matching agents:', error);
    return [];
  }
};

// Get task inputs for a bounty
export const getBountyTaskInputs = async (bountyId: string): Promise<TaskInput[]> => {
  try {
    // In production, this would fetch from IPFS/GitHub based on bounty description
    // For demo, return mock task inputs

    return [
      {
        id: 'task-1',
        type: 'text',
        content: 'Analyze the sentiment of this text: "The market is showing strong bullish signals."',
        metadata: { difficulty: 'easy' },
      },
      {
        id: 'task-2',
        type: 'text',
        content: 'Summarize the key points from this article about DeFi trends.',
        metadata: { difficulty: 'medium' },
      },
    ];
  } catch (error) {
    console.error('Failed to get bounty task inputs:', error);
    return [];
  }
};

// Process task results (agent logic)
export const processTaskResults = async (
  taskInputs: TaskInput[]
): Promise<TaskResult[]> => {
  try {
    // In production, this would be the actual agent processing logic
    // For demo, simulate processing

    const results: TaskResult[] = taskInputs.map(input => ({
      taskId: input.id,
      output: `Processed: ${input.content.substring(0, 50)}...`,
      confidence: Math.random() * 0.5 + 0.5, // 0.5-1.0
      metadata: {
        processingTime: Math.random() * 1000 + 500, // 500-1500ms
        model: 'gpt-4',
      },
    }));

    return results;
  } catch (error) {
    console.error('Failed to process task results:', error);
    throw new Error('Task processing failed');
  }
};

export default {
  createSignedReceipt,
  verifyReceiptSignature,
  submitReceiptToBounty,
  submitRefereeDecision,
  findMatchingAgents,
  getBountyTaskInputs,
  processTaskResults,
};

