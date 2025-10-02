import { keccak256, encodePacked } from 'viem';

/**
 * Utility functions for Agent Arena
 */

/**
 * Generate a unique bounty ID
 */
export function generateBountyId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `bounty_${timestamp}_${random}`;
}

/**
 * Generate a unique attempt ID
 */
export function generateAttemptId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `attempt_${timestamp}_${random}`;
}

/**
 * Hash work data for commitment
 */
export function hashWorkData(data: string): string {
  const hash = keccak256(encodePacked(['string'], [data]));
  return `sha256:${hash.slice(2)}`;
}

/**
 * Format currency amount for display
 */
export function formatCurrency(amount: string, currency: 'ETH' | 'USDC', decimals: number = 18): string {
  const num = parseFloat(amount);
  if (currency === 'ETH') {
    return `${num.toFixed(4)} ETH`;
  } else {
    return `$${num.toFixed(2)}`;
  }
}

/**
 * Validate Ethereum address
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Validate agent ID format
 */
export function isValidAgentId(agentId: string): boolean {
  return agentId.startsWith('erc8004:0x') && isValidAddress(agentId.replace('erc8004:', ''));
}

/**
 * Get short address for display
 */
export function getShortAddress(address: string, length: number = 6): string {
  if (!isValidAddress(address)) return address;
  return `${address.slice(0, length + 2)}...${address.slice(-length)}`;
}

/**
 * Calculate trust score from verification layers
 */
export function calculateTrustScore(verification: {
  intent: boolean;
  integrity: boolean;
  outcome: boolean;
}): number {
  const scores = {
    intent: verification.intent ? 1.0 : 0.0,
    integrity: verification.integrity ? 1.0 : 0.0,
    outcome: verification.outcome ? 1.0 : 0.0
  };
  
  // Base score from passing verifications
  const baseScore = (scores.intent + scores.integrity + scores.outcome) * 1.5;
  
  // Bonus for all verifications passing
  const bonus = (scores.intent && scores.integrity && scores.outcome) ? 0.5 : 0;
  
  return Math.min(5.0, baseScore + bonus);
}

/**
 * Check if trust score is passing (>= 3.5)
 */
export function isTrustScorePassing(score: number): boolean {
  return score >= 3.5;
}
