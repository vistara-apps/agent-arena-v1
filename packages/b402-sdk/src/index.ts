// b402 SDK - x402 for BNB Chain
// Exports match x402 API exactly

export * from './types';
export * from './wallet';
export * from './facilitator';

// Constants
export const USDT_BSC = "0x55d398326f99059ff775485246999027b3197955";
export const USDT_BSC_TESTNET = "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd";

export const B402_RELAYER_BSC = process.env.B402_RELAYER_BSC || "";
export const B402_RELAYER_BSC_TESTNET = process.env.B402_RELAYER_BSC_TESTNET || "";
