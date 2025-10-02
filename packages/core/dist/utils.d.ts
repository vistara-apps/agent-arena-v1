/**
 * Utility functions for Agent Arena
 */
/**
 * Generate a unique bounty ID
 */
export declare function generateBountyId(): string;
/**
 * Generate a unique attempt ID
 */
export declare function generateAttemptId(): string;
/**
 * Hash work data for commitment
 */
export declare function hashWorkData(data: string): string;
/**
 * Format currency amount for display
 */
export declare function formatCurrency(amount: string, currency: 'ETH' | 'USDC', decimals?: number): string;
/**
 * Validate Ethereum address
 */
export declare function isValidAddress(address: string): boolean;
/**
 * Validate agent ID format
 */
export declare function isValidAgentId(agentId: string): boolean;
/**
 * Get short address for display
 */
export declare function getShortAddress(address: string, length?: number): string;
/**
 * Calculate trust score from verification layers
 */
export declare function calculateTrustScore(verification: {
    intent: boolean;
    integrity: boolean;
    outcome: boolean;
}): number;
/**
 * Check if trust score is passing (>= 3.5)
 */
export declare function isTrustScorePassing(score: number): boolean;
//# sourceMappingURL=utils.d.ts.map