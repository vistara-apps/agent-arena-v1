// b402 Wallet - Payment signing (matches x402 processPayment)

import { Wallet, TypedDataDomain } from 'ethers';
import { B402PaymentRequirements, B402PaymentPayload } from './types';

/**
 * Process payment - sign authorization off-chain (0 gas)
 * Matches x402's processPayment() API exactly
 */
export async function processPayment(
  requirements: B402PaymentRequirements,
  wallet: Wallet
): Promise<B402PaymentPayload> {
  // Generate timestamps
  const now = Math.floor(Date.now() / 1000);
  const validBefore = now + requirements.maxTimeoutSeconds;

  // Generate random 32-byte nonce (same as x402)
  const nonceBytes = new Uint8Array(32);
  crypto.getRandomValues(nonceBytes);
  const nonce = '0x' + Array.from(nonceBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  // Create authorization (EIP-3009 compatible structure)
  const authorization = {
    from: wallet.address,
    to: requirements.payTo,
    value: requirements.maxAmountRequired,
    validAfter: 0,
    validBefore,
    nonce,
  };

  // EIP-712 domain (matches B402Relayer contract)
  const domain: TypedDataDomain = {
    name: "B402",
    version: "1",
    chainId: requirements.network === "bsc" ? 56 : 97,
    verifyingContract: requirements.relayerContract,
  };

  // EIP-712 types (matches transferWithAuthorization)
  const types = {
    TransferWithAuthorization: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
      { name: "validAfter", type: "uint256" },
      { name: "validBefore", type: "uint256" },
      { name: "nonce", type: "bytes32" },
    ],
  };

  // Sign with EIP-712
  const signature = await wallet.signTypedData(domain, types, authorization);

  // Return x402-compatible payload
  return {
    x402Version: 1,
    scheme: "exact",
    network: requirements.network,
    token: requirements.asset,
    payload: {
      authorization,
      signature,
    },
  };
}
