'use client';

import { VerificationStatus } from '@/lib/types';
import { CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';

interface ReceiptVerificationStatusProps {
  status: VerificationStatus;
  message?: string;
}

export function ReceiptVerificationStatus({ status, message }: ReceiptVerificationStatusProps) {
  const getStatusIcon = (status: VerificationStatus) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-400" />;
      case 'verified':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-400" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: VerificationStatus) => {
    switch (status) {
      case 'pending':
        return 'border-yellow-500/30 bg-yellow-500/10';
      case 'verified':
        return 'border-green-500/30 bg-green-500/10';
      case 'failed':
        return 'border-red-500/30 bg-red-500/10';
      default:
        return 'border-gray-500/30 bg-gray-500/10';
    }
  };

  const getStatusText = (status: VerificationStatus) => {
    switch (status) {
      case 'pending':
        return 'Verification Pending';
      case 'verified':
        return 'Verification Successful';
      case 'failed':
        return 'Verification Failed';
      default:
        return 'Unknown Status';
    }
  };

  return (
    <div className={`flex items-center space-x-3 p-4 rounded-lg border ${getStatusColor(status)}`}>
      {getStatusIcon(status)}
      <div className="flex-1">
        <h4 className="font-medium text-fg">{getStatusText(status)}</h4>
        {message && (
          <p className="text-sm text-text-muted mt-1">{message}</p>
        )}
      </div>
    </div>
  );
}
