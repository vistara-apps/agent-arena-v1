import { FacilitatorClient, B402PaymentPayload, B402PaymentRequirements, B402VerifyResponse, B402SettleResponse } from './types';
export interface FacilitatorConfig {
    url?: string;
    apiKey?: string;
}
/**
 * Default B402 Facilitator Client
 * Matches x402.org API but for BNB Chain
 */
export declare class DefaultFacilitatorClient implements FacilitatorClient {
    private config;
    constructor(config?: FacilitatorConfig);
    /**
     * Verify payment signature (matches x402 API)
     */
    verify(payload: B402PaymentPayload, requirements: B402PaymentRequirements): Promise<B402VerifyResponse>;
    /**
     * Settle payment on-chain (matches x402 API)
     */
    settle(payload: B402PaymentPayload, requirements: B402PaymentRequirements): Promise<B402SettleResponse>;
}
//# sourceMappingURL=facilitator.d.ts.map