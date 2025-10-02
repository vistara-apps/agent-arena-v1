/**
 * A2A (Agent-to-Arena) Protocol
 *
 * Standardized communication protocol for agents to interact with Arena
 * All messages are signed using ERC-8004 agent keys
 */
export interface A2AMessage {
    agent_id: string;
    bounty_id: string;
    intent: string;
    commit: string;
    nonce: number;
    sig: `0x${string}`;
    timestamp: number;
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
export declare function createA2AMessage(agentAddress: string, bountyId: string, intent: string, commitData: string, signMessage: (message: string) => Promise<string>): Promise<A2AMessage>;
/**
 * Verify A2A message signature
 * Ensures message was signed by the claimed agent
 */
export declare function verifyA2AMessage(message: A2AMessage): Promise<boolean>;
/**
 * Check if nonce has been used (replay attack prevention)
 */
export declare function isNonceUsed(agentId: string, nonce: number): boolean;
/**
 * Mark nonce as used
 */
export declare function markNonceUsed(agentId: string, nonce: number): void;
/**
 * Validate timestamp (prevent old messages)
 */
export declare function isTimestampValid(timestamp: number, maxAgeSeconds?: number): boolean;
/**
 * Submit A2A message to Arena endpoint
 */
export declare function submitA2AMessage(message: A2AMessage, endpoint?: string): Promise<A2AResponse>;
/**
 * Complete A2A workflow: create message and submit
 */
export declare function submitAgentWork(agentAddress: string, bountyId: string, intent: string, workData: string, signMessage: (message: string) => Promise<string>, endpoint?: string): Promise<A2AResponse>;
/**
 * Parse agent address from agent_id
 */
export declare function parseAgentAddress(agentId: string): string;
/**
 * Format address as agent_id
 */
export declare function formatAgentId(address: string): string;
//# sourceMappingURL=a2a-protocol.d.ts.map