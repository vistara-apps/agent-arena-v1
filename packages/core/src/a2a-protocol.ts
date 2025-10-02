/**
 * A2A (Agent-to-Arena) Protocol
 * 
 * Standardized communication protocol for agents to interact with Arena
 * All messages are signed using ERC-8004 agent keys
 */

import { keccak256, encodePacked, recoverMessageAddress } from 'viem';

export interface A2AMessage {
  agent_id: string;        // "erc8004:0x..." format
  bounty_id: string;       // "0xBNTY..." or match ID
  intent: string;          // Human-readable task description
  commit: string;          // "sha256:..." - commitment hash of work
  nonce: number;           // Anti-replay nonce
  sig: `0x${string}`;      // Signature over canonical message
  timestamp: number;       // Unix timestamp
}

export interface A2AResponse {
  success: boolean;
  attempt_id?: string;
  error?: string;
  verification_required: boolean;
  message?: string;
}

/**
 * Create a signed A2A message envelope
 */
export async function createA2AMessage(
  agentAddress: string,
  bountyId: string,
  intent: string,
  commitData: string,
  signMessage: (message: string) => Promise<string>
): Promise<A2AMessage> {
  // Format agent ID according to ERC-8004 standard
  const agent_id = `erc8004:${agentAddress.toLowerCase()}`;
  
  // Create commitment hash (sha256 of work data)
  const commitHash = keccak256(encodePacked(['string'], [commitData]));
  const commit = `sha256:${commitHash.slice(2)}`; // Remove 0x prefix
  
  // Generate nonce for replay protection
  const nonce = Math.floor(Math.random() * 1000000);
  const timestamp = Math.floor(Date.now() / 1000);

  // Create canonical message for signing
  // Format: agent_id|bounty_id|intent|commit|nonce|timestamp
  const canonicalMessage = `${agent_id}|${bountyId}|${intent}|${commit}|${nonce}|${timestamp}`;
  
  // Sign the message
  const sig = await signMessage(canonicalMessage) as `0x${string}`;

  return {
    agent_id,
    bounty_id: bountyId,
    intent,
    commit,
    nonce,
    sig,
    timestamp
  };
}

/**
 * Verify A2A message signature
 * Ensures message was signed by the claimed agent
 */
export async function verifyA2AMessage(message: A2AMessage): Promise<boolean> {
  try {
    // Reconstruct canonical message
    const canonical = `${message.agent_id}|${message.bounty_id}|${message.intent}|${message.commit}|${message.nonce}|${message.timestamp}`;
    
    // Extract agent address from agent_id (format: "erc8004:0x...")
    const expectedAddress = message.agent_id.replace('erc8004:', '').toLowerCase();
    
    // Recover address from signature
    const recoveredAddress = await recoverMessageAddress({
      message: canonical,
      signature: message.sig
    });
    
    // Verify addresses match
    const isValid = recoveredAddress.toLowerCase() === expectedAddress;
    
    if (!isValid) {
      console.error('Signature verification failed:', {
        expected: expectedAddress,
        recovered: recoveredAddress
      });
    }
    
    return isValid;
  } catch (error) {
    console.error('A2A message verification error:', error);
    return false;
  }
}

/**
 * Check if nonce has been used (replay attack prevention)
 */
export function isNonceUsed(agentId: string, nonce: number): boolean {
  if (typeof window === 'undefined') return false;
  
  const nonceKey = `a2a_nonce_${agentId}_${nonce}`;
  return localStorage.getItem(nonceKey) === 'used';
}

/**
 * Mark nonce as used
 */
export function markNonceUsed(agentId: string, nonce: number): void {
  if (typeof window === 'undefined') return;
  
  const nonceKey = `a2a_nonce_${agentId}_${nonce}`;
  localStorage.setItem(nonceKey, 'used');
  
  // Auto-cleanup old nonces (keep last 1000)
  const allNonces = Object.keys(localStorage)
    .filter(k => k.startsWith('a2a_nonce_'))
    .sort();
    
  if (allNonces.length > 1000) {
    const toRemove = allNonces.slice(0, allNonces.length - 1000);
    toRemove.forEach(key => localStorage.removeItem(key));
  }
}

/**
 * Validate timestamp (prevent old messages)
 */
export function isTimestampValid(timestamp: number, maxAgeSeconds: number = 300): boolean {
  const now = Math.floor(Date.now() / 1000);
  const age = now - timestamp;
  
  // Reject messages older than maxAgeSeconds (default 5 minutes)
  if (age > maxAgeSeconds) {
    console.error('Message too old:', { age, maxAgeSeconds });
    return false;
  }
  
  // Reject messages from the future (allow 60s clock skew)
  if (age < -60) {
    console.error('Message from future:', { age });
    return false;
  }
  
  return true;
}

/**
 * Submit A2A message to Arena endpoint
 */
export async function submitA2AMessage(
  message: A2AMessage,
  endpoint: string = '/api/arena/a2a'
): Promise<A2AResponse> {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Submission failed');
    }

    return await response.json();
  } catch (error) {
    console.error('A2A submission failed:', error);
    throw error;
  }
}

/**
 * Complete A2A workflow: create message and submit
 */
export async function submitAgentWork(
  agentAddress: string,
  bountyId: string,
  intent: string,
  workData: string,
  signMessage: (message: string) => Promise<string>,
  endpoint?: string
): Promise<A2AResponse> {
  // Create signed message
  const message = await createA2AMessage(agentAddress, bountyId, intent, workData, signMessage);
  
  // Submit to Arena
  return await submitA2AMessage(message, endpoint);
}

/**
 * Parse agent address from agent_id
 */
export function parseAgentAddress(agentId: string): string {
  if (!agentId.startsWith('erc8004:0x')) {
    throw new Error(`Invalid agent_id format: ${agentId}`);
  }
  return agentId.replace('erc8004:', '');
}

/**
 * Format address as agent_id
 */
export function formatAgentId(address: string): string {
  return `erc8004:${address.toLowerCase()}`;
}
