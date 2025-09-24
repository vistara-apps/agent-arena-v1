import { createConfig, http } from 'wagmi';
import { base } from 'wagmi/chains';
import { coinbaseWallet } from 'wagmi/connectors';

// Base MiniKit configuration
export const config = createConfig({
  chains: [base],
  connectors: [
    coinbaseWallet({
      appName: 'ClipperVerse',
      preference: 'smartWalletOnly',
    }),
  ],
  transports: {
    [base.id]: http(),
  },
});

// Public client for reading data
export const publicClient = config.getClient().extend(() => ({
  transport: http(),
}));

// Wallet client for transactions
export const walletClient = config.getClient().extend(() => ({
  transport: http(),
}));

// MiniKit utilities
export const minikit = {
  // Check if running in MiniKit environment
  isMiniKit: () => {
    return typeof window !== 'undefined' && window.location.protocol === 'https:' &&
           (window.location.hostname.includes('minikit') || window.location.hostname.includes('base'));
  },

  // Get connected wallet address
  getAddress: async () => {
    try {
      const accounts = await walletClient.getAddresses();
      return accounts[0];
    } catch (error) {
      console.error('Failed to get address:', error);
      return null;
    }
  },

  // Sign a message
  signMessage: async (message: string) => {
    try {
      const address = await minikit.getAddress();
      if (!address) throw new Error('No wallet connected');

      const signature = await walletClient.signMessage({
        account: address,
        message,
      });

      return signature;
    } catch (error) {
      console.error('Failed to sign message:', error);
      throw error;
    }
  },

  // Send a transaction
  sendTransaction: async (tx: {
    to: `0x${string}`;
    value?: bigint;
    data?: `0x${string}`;
  }) => {
    try {
      const address = await minikit.getAddress();
      if (!address) throw new Error('No wallet connected');

      const hash = await walletClient.sendTransaction({
        account: address,
        to: tx.to,
        value: tx.value || 0n,
        data: tx.data || '0x',
      });

      return hash;
    } catch (error) {
      console.error('Failed to send transaction:', error);
      throw error;
    }
  },

  // Read contract data
  readContract: async (params: {
    address: `0x${string}`;
    abi: any[];
    functionName: string;
    args?: any[];
  }) => {
    try {
      const data = await publicClient.readContract({
        address: params.address,
        abi: params.abi,
        functionName: params.functionName,
        args: params.args || [],
      });

      return data;
    } catch (error) {
      console.error('Failed to read contract:', error);
      throw error;
    }
  },

  // Write to contract
  writeContract: async (params: {
    address: `0x${string}`;
    abi: any[];
    functionName: string;
    args?: any[];
    value?: bigint;
  }) => {
    try {
      const address = await minikit.getAddress();
      if (!address) throw new Error('No wallet connected');

      const hash = await walletClient.writeContract({
        address: params.address,
        abi: params.abi,
        functionName: params.functionName,
        args: params.args || [],
        value: params.value || 0n,
        account: address,
      });

      return hash;
    } catch (error) {
      console.error('Failed to write contract:', error);
      throw error;
    }
  },
};

export default minikit;

