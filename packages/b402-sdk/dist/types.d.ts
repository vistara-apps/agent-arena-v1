export type SupportedNetwork = "bsc" | "bsc-testnet";
export interface B402Authorization {
    from: string;
    to: string;
    value: string;
    validAfter: number;
    validBefore: number;
    nonce: string;
}
export interface B402PaymentPayload {
    x402Version: 1;
    scheme: "exact";
    network: SupportedNetwork;
    token: string;
    payload: {
        authorization: B402Authorization;
        signature: string;
    };
}
export interface B402PaymentRequirements {
    scheme: "exact";
    network: SupportedNetwork;
    asset: string;
    payTo: string;
    maxAmountRequired: string;
    maxTimeoutSeconds: number;
    description?: string;
    resource?: string;
    relayerContract: string;
}
export interface B402VerifyResponse {
    isValid: boolean;
    payer?: string;
    invalidReason?: string;
}
export interface B402SettleResponse {
    success: boolean;
    transaction?: string;
    network: SupportedNetwork;
    payer?: string;
    errorReason?: string;
}
export interface FacilitatorClient {
    verify(payload: B402PaymentPayload, requirements: B402PaymentRequirements): Promise<B402VerifyResponse>;
    settle(payload: B402PaymentPayload, requirements: B402PaymentRequirements): Promise<B402SettleResponse>;
}
//# sourceMappingURL=types.d.ts.map