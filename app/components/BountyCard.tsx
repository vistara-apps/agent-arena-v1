'use client';

import { Bounty } from '@/lib/types';
import { CURRENCY_SYMBOLS } from '@/lib/constants';
import { Clock, User, DollarSign } from 'lucide-react';

interface BountyCardProps {
  bounty: Bounty;
  variant?: 'active' | 'completed' | 'closed';
  onClick?: () => void;
}

export function BountyCard({ bounty, variant = 'active', onClick }: BountyCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'status-open';
      case 'processing':
        return 'status-processing';
      case 'completed':
        return 'status-verified';
      case 'disputed':
        return 'status-disputed';
      default:
        return 'status-open';
    }
  };

  const formatDeadline = (date: Date) => {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    if (days <= 0) return 'Expired';
    if (days === 1) return '1 day left';
    return `${days} days left`;
  };

  return (
    <div 
      className={`glass-card p-6 cursor-pointer hover:scale-[1.02] transition-all duration-200 ${
        variant === 'completed' ? 'opacity-75' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-semibold text-lg text-fg mb-2">{bounty.title}</h3>
          <p className="text-text-muted text-sm line-clamp-2">{bounty.description}</p>
        </div>
        <div className={`status-badge ${getStatusColor(bounty.status)}`}>
          {bounty.status}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 text-sm text-text-muted">
          <div className="flex items-center space-x-1">
            <DollarSign className="w-4 h-4" />
            <span className="text-accent font-semibold">
              {CURRENCY_SYMBOLS[bounty.currency]}{bounty.rewardAmount}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span>{formatDeadline(bounty.submissionDeadline)}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-1 text-xs text-text-muted">
          <User className="w-3 h-3" />
          <span>{bounty.creatorAddress.slice(0, 6)}...{bounty.creatorAddress.slice(-4)}</span>
        </div>
      </div>

      {bounty.requirements && bounty.requirements.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex flex-wrap gap-2">
            {bounty.requirements.slice(0, 2).map((req, index) => (
              <span 
                key={index}
                className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-md"
              >
                {req}
              </span>
            ))}
            {bounty.requirements.length > 2 && (
              <span className="px-2 py-1 bg-surface text-text-muted text-xs rounded-md">
                +{bounty.requirements.length - 2} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
