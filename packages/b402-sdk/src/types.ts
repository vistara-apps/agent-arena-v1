// b402 Types - Matching x402 API exactly

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
  x402Version: 1; // Keep version 1 for compatibility
  scheme: "exact";
  network: SupportedNetwork;
  token: string; // USDT address
  payload: {
    authorization: B402Authorization;
    signature: string;
  };
}

export interface B402PaymentRequirements {
  scheme: "exact";
  network: SupportedNetwork;
  asset: string; // USDT address
  payTo: string;
  maxAmountRequired: string;
  maxTimeoutSeconds: number;
  description?: string;
  resource?: string;
  relayerContract: string; // B402Relayer address
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
  verify(
    payload: B402PaymentPayload,
    requirements: B402PaymentRequirements
  ): Promise<B402VerifyResponse>;

  settle(
    payload: B402PaymentPayload,
    requirements: B402PaymentRequirements
  ): Promise<B402SettleResponse>;
}
