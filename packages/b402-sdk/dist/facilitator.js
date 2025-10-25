"use strict";
// b402 Facilitator Client - Matches x402 DefaultFacilitatorClient API
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultFacilitatorClient = void 0;
/**
 * Default B402 Facilitator Client
 * Matches x402.org API but for BNB Chain
 */
class DefaultFacilitatorClient {
    constructor(config) {
        // Default to b402.ai facilitator
        const url = config?.url || 'https://api.b402.ai';
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            throw new Error(`Invalid URL ${url}, must start with http:// or https://`);
        }
        this.config = {
            url: url.endsWith('/') ? url.slice(0, -1) : url,
            apiKey: config?.apiKey,
        };
    }
    /**
     * Verify payment signature (matches x402 API)
     */
    async verify(payload, requirements) {
        try {
            const response = await fetch(`${this.config.url}/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` }),
                },
                body: JSON.stringify({
                    x402Version: payload.x402Version,
                    paymentPayload: payload,
                    paymentRequirements: requirements,
                }),
            });
            if (!response.ok) {
                return {
                    isValid: false,
                    invalidReason: `HTTP ${response.status}: ${response.statusText}`,
                };
            }
            const data = await response.json();
            return {
                isValid: data.isValid || data.is_valid || false,
                payer: data.payer,
                invalidReason: data.invalidReason || data.invalid_reason,
            };
        }
        catch (error) {
            return {
                isValid: false,
                invalidReason: `Network error: ${error instanceof Error ? error.message : String(error)}`,
            };
        }
    }
    /**
     * Settle payment on-chain (matches x402 API)
     */
    async settle(payload, requirements) {
        try {
            const response = await fetch(`${this.config.url}/settle`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` }),
                },
                body: JSON.stringify({
                    x402Version: payload.x402Version,
                    paymentPayload: payload,
                    paymentRequirements: requirements,
                }),
            });
            if (!response.ok) {
                return {
                    success: false,
                    network: requirements.network,
                    errorReason: `HTTP ${response.status}: ${response.statusText}`,
                };
            }
            const data = await response.json();
            return {
                success: data.success || false,
                transaction: data.transaction || data.transactionHash,
                network: data.network || requirements.network,
                payer: data.payer,
                errorReason: data.errorReason || data.error_reason,
            };
        }
        catch (error) {
            return {
                success: false,
                network: requirements.network,
                errorReason: `Network error: ${error instanceof Error ? error.message : String(error)}`,
            };
        }
    }
}
exports.DefaultFacilitatorClient = DefaultFacilitatorClient;
//# sourceMappingURL=facilitator.js.map