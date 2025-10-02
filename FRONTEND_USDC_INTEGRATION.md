# Frontend USDC Integration Guide

## Current Status

✅ **UI Ready**: Frontend has USDC option in CreateBountyModal  
❌ **Contract Integration Missing**: Need to add USDC approval flow

## What Needs to Be Added

### 1. USDC Token Contract Integration

Add to `lib/contracts.ts`:

```typescript
// Add USDC ABI
export const ERC20_ABI = [
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
];

// Update get functions
export const getUSDCContract = (chainId: number) => {
  const usdcAddress = chainId === 84532 
    ? BASE_SEPOLIA_TOKENS.USDC 
    : BASE_MAINNET_TOKENS.USDC;
    
  return {
    address: usdcAddress,
    abi: ERC20_ABI,
  };
};
```

### 2. Update CreateBountyModal with USDC Flow

Replace the `handleSubmit` function in `app/components/CreateBountyModal.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { parseEther, parseUnits } from 'ethers';
import { useWalletClient, usePublicClient } from 'wagmi';
import { BASE_SEPOLIA_TOKENS } from '@/lib/constants';

// ... existing imports

export function CreateBountyModal({ isOpen, onClose, onSubmit }: CreateBountyModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    rewardAmount: '',
    currency: 'ETH' as 'ETH' | 'USDC',
    deadline: '',
    requirements: ['']
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState<'form' | 'approving' | 'creating'>('form');
  
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletClient || !publicClient) {
      alert('Please connect your wallet');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const tokenAddress = formData.currency === 'USDC' 
        ? BASE_SEPOLIA_TOKENS.USDC 
        : '0x0000000000000000000000000000000000000000';
      
      const rewardAmount = formData.currency === 'USDC'
        ? parseUnits(formData.rewardAmount, 6) // USDC has 6 decimals
        : parseEther(formData.rewardAmount);
      
      // Step 1: Approve USDC if needed
      if (formData.currency === 'USDC') {
        setCurrentStep('approving');
        
        // Check current allowance
        const allowance = await publicClient.readContract({
          address: BASE_SEPOLIA_TOKENS.USDC,
          abi: ERC20_ABI,
          functionName: 'allowance',
          args: [walletClient.account.address, process.env.NEXT_PUBLIC_BOUNTY_SYSTEM_ADDRESS]
        });
        
        // Approve if needed
        if (allowance < rewardAmount) {
          const approveTx = await walletClient.writeContract({
            address: BASE_SEPOLIA_TOKENS.USDC,
            abi: ERC20_ABI,
            functionName: 'approve',
            args: [process.env.NEXT_PUBLIC_BOUNTY_SYSTEM_ADDRESS, rewardAmount]
          });
          
          // Wait for approval confirmation
          await publicClient.waitForTransactionReceipt({ hash: approveTx });
        }
      }
      
      // Step 2: Create bounty
      setCurrentStep('creating');
      
      const deadline = Math.floor(new Date(formData.deadline).getTime() / 1000);
      
      const tx = await walletClient.writeContract({
        address: process.env.NEXT_PUBLIC_BOUNTY_SYSTEM_ADDRESS as `0x${string}`,
        abi: BOUNTY_SYSTEM_ABI,
        functionName: 'createBounty',
        args: [
          formData.description,
          rewardAmount,
          tokenAddress,
          deadline,
          'triple_verification'
        ],
        value: formData.currency === 'ETH' ? rewardAmount : 0n
      });
      
      // Wait for transaction
      const receipt = await publicClient.waitForTransactionReceipt({ hash: tx });
      
      // Extract bounty ID from events
      const bountyCreatedEvent = receipt.logs
        .map(log => {
          try {
            return publicClient.decodeEventLog({
              abi: BOUNTY_SYSTEM_ABI,
              data: log.data,
              topics: log.topics
            });
          } catch {
            return null;
          }
        })
        .find(event => event && event.eventName === 'BountyCreated');
      
      const bountyId = bountyCreatedEvent?.args?.bountyId;
      
      onSubmit({
        ...formData,
        bountyId: bountyId?.toString(),
        transactionHash: tx,
        submissionDeadline: new Date(formData.deadline),
        requirements: formData.requirements.filter(req => req.trim() !== '')
      });
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        rewardAmount: '',
        currency: 'ETH',
        deadline: '',
        requirements: ['']
      });
      
      setCurrentStep('form');
      onClose();
      
    } catch (error: any) {
      console.error('Failed to create bounty:', error);
      alert(`Failed to create bounty: ${error.message}`);
    } finally {
      setIsSubmitting(false);
      setCurrentStep('form');
    }
  };

  // ... rest of component

  // Update submit button text based on step
  const getSubmitButtonText = () => {
    if (!isSubmitting) return 'Create Bounty';
    switch (currentStep) {
      case 'approving':
        return 'Approving USDC...';
      case 'creating':
        return 'Creating Bounty...';
      default:
        return 'Processing...';
    }
  };

  return (
    // ... existing JSX with updated button:
    <ActionButton
      type="submit"
      variant="primary"
      loading={isSubmitting}
      className="flex-1"
    >
      {getSubmitButtonText()}
    </ActionButton>
  );
}
```

### 3. Add Environment Variables

Ensure `.env.local` has:

```bash
NEXT_PUBLIC_BOUNTY_SYSTEM_ADDRESS=0x23D2a6573DE053B470c1e743569FeCe318a0A0De
```

### 4. Import Token Constants

Update `lib/constants.ts` (already done ✅):

```typescript
// Base Sepolia
export const BASE_SEPOLIA_TOKENS = {
  USDC: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
  WETH: '0x4200000000000000000000000000000000000006',
  ETH: '0x0000000000000000000000000000000000000000',
};

// Base Mainnet
export const BASE_MAINNET_TOKENS = {
  USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  WETH: '0x4200000000000000000000000000000000000006',
  ETH: '0x0000000000000000000000000000000000000000',
};
```

## Testing USDC Flow

1. **Get Test USDC**:
   - Base Sepolia Faucet: https://faucet.circle.com/ (select Base Sepolia)
   - Or swap from ETH on Base Sepolia testnet

2. **Test Bounty Creation**:
   ```bash
   # Start frontend
   npm run dev
   
   # Connect wallet
   # Select USDC currency
   # Enter amount (e.g., 10 USDC)
   # Click Create Bounty
   # Approve USDC (first transaction)
   # Create bounty (second transaction)
   ```

3. **Verify on BaseScan**:
   - Check USDC approval: https://sepolia.basescan.org/token/0x036CbD53842c5426634e7929541eC2318f3dCF7e
   - Check bounty creation: https://sepolia.basescan.org/address/0x23D2a6573DE053B470c1e743569FeCe318a0A0De

## Summary

**Current State:**
- ✅ UI has USDC option
- ✅ Token addresses defined
- ❌ Contract integration not connected

**Next Steps:**
1. Add ERC20 ABI to contracts.ts
2. Update CreateBountyModal with approval flow
3. Test with Base Sepolia USDC
4. Deploy to production

**Estimated Time:** 30 minutes to implement and test

---

**Note**: The backend contracts already support USDC (see `rewardToken` parameter in `BountySystem.sol`). We just need to connect the frontend UI to the smart contract properly.
