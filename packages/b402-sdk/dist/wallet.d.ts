import { Wallet } from 'ethers';
import { B402PaymentRequirements, B402PaymentPayload } from './types';
/**
 * Process payment - sign authorization off-chain (0 gas)
 * Matches x402's processPayment() API exactly
 */
export declare function processPayment(requirements: B402PaymentRequirements, wallet: Wallet): Promise<B402PaymentPayload>;
//# sourceMappingURL=wallet.d.ts.map