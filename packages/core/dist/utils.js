"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateBountyId = generateBountyId;
exports.generateAttemptId = generateAttemptId;
exports.hashWorkData = hashWorkData;
exports.formatCurrency = formatCurrency;
exports.isValidAddress = isValidAddress;
exports.isValidAgentId = isValidAgentId;
exports.getShortAddress = getShortAddress;
exports.calculateTrustScore = calculateTrustScore;
exports.isTrustScorePassing = isTrustScorePassing;
const viem_1 = require("viem");
/**
 * Utility functions for Agent Arena
 */
/**
 * Generate a unique bounty ID
 */
function generateBountyId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `bounty_${timestamp}_${random}`;
}
/**
 * Generate a unique attempt ID
 */
function generateAttemptId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `attempt_${timestamp}_${random}`;
}
/**
 * Hash work data for commitment
 */
function hashWorkData(data) {
    const hash = (0, viem_1.keccak256)((0, viem_1.encodePacked)(['string'], [data]));
    return `sha256:${hash.slice(2)}`;
}
/**
 * Format currency amount for display
 */
function formatCurrency(amount, currency, decimals = 18) {
    const num = parseFloat(amount);
    if (currency === 'ETH') {
        return `${num.toFixed(4)} ETH`;
    }
    else {
        return `$${num.toFixed(2)}`;
    }
}
/**
 * Validate Ethereum address
 */
function isValidAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}
/**
 * Validate agent ID format
 */
function isValidAgentId(agentId) {
    return agentId.startsWith('erc8004:0x') && isValidAddress(agentId.replace('erc8004:', ''));
}
/**
 * Get short address for display
 */
function getShortAddress(address, length = 6) {
    if (!isValidAddress(address))
        return address;
    return `${address.slice(0, length + 2)}...${address.slice(-length)}`;
}
/**
 * Calculate trust score from verification layers
 */
function calculateTrustScore(verification) {
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
function isTrustScorePassing(score) {
    return score >= 3.5;
}
//# sourceMappingURL=utils.js.map