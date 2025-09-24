'use client';

import { BountyStatus, VerificationStatus } from '@/lib/types';

interface StatusBadgeProps {
  status: BountyStatus | VerificationStatus;
  variant?: 'bounty' | 'verification';
}

export function StatusBadge({ status, variant = 'bounty' }: StatusBadgeProps) {
  const getStatusClasses = (status: string) => {
    switch (status) {
      case 'open':
        return 'status-open';
      case 'processing':
      case 'pending':
        return 'status-processing';
      case 'completed':
      case 'verified':
        return 'status-verified';
      case 'disputed':
      case 'failed':
        return 'status-disputed';
      default:
        return 'status-open';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open':
        return 'Open';
      case 'processing':
        return 'Processing';
      case 'completed':
        return 'Completed';
      case 'disputed':
        return 'Disputed';
      case 'pending':
        return 'Pending';
      case 'verified':
        return 'Verified';
      case 'failed':
        return 'Failed';
      default:
        return status;
    }
  };

  return (
    <span className={`status-badge ${getStatusClasses(status)}`}>
      {getStatusText(status)}
    </span>
  );
}
