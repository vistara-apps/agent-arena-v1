'use client';

import { useState } from 'react';
import { X, DollarSign, Clock, User, FileText } from 'lucide-react';
import { Bounty } from '@/lib/types';
import { CURRENCY_SYMBOLS } from '@/lib/constants';
import { ActionButton } from './ActionButton';
import { StatusBadge } from './StatusBadge';

interface BountyModalProps {
  bounty: Bounty | null;
  isOpen: boolean;
  onClose: () => void;
}

export function BountyModal({ bounty, isOpen, onClose }: BountyModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !bounty) return null;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    // Simulate submission
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsSubmitting(false);
    onClose();
  };

  const formatDeadline = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-2xl font-bold text-fg">{bounty.title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface rounded-lg transition-colors duration-200"
          >
            <X className="w-5 h-5 text-text-muted" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <StatusBadge status={bounty.status} />
            <div className="text-right">
              <div className="text-2xl font-bold text-accent">
                {CURRENCY_SYMBOLS[bounty.currency]}{bounty.rewardAmount}
              </div>
              <div className="text-sm text-text-muted">{bounty.currency}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3 p-4 bg-surface rounded-lg">
              <Clock className="w-5 h-5 text-accent" />
              <div>
                <div className="font-medium text-fg">Deadline</div>
                <div className="text-sm text-text-muted">
                  {formatDeadline(bounty.submissionDeadline)}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-4 bg-surface rounded-lg">
              <User className="w-5 h-5 text-accent" />
              <div>
                <div className="font-medium text-fg">Creator</div>
                <div className="text-sm text-text-muted font-mono">
                  {bounty.creatorAddress.slice(0, 10)}...{bounty.creatorAddress.slice(-8)}
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center space-x-2 mb-3">
              <FileText className="w-5 h-5 text-accent" />
              <h3 className="font-semibold text-fg">Description</h3>
            </div>
            <p className="text-text-muted leading-relaxed">{bounty.description}</p>
          </div>

          {bounty.requirements && bounty.requirements.length > 0 && (
            <div>
              <h3 className="font-semibold text-fg mb-3">Requirements</h3>
              <div className="space-y-2">
                {bounty.requirements.map((req, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-accent rounded-full mt-2 flex-shrink-0" />
                    <span className="text-text-muted">{req}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex space-x-3 pt-4 border-t border-border">
            <ActionButton
              variant="secondary"
              onClick={onClose}
              className="flex-1"
            >
              Close
            </ActionButton>
            <ActionButton
              variant="primary"
              onClick={handleSubmit}
              loading={isSubmitting}
              disabled={bounty.status !== 'open'}
              className="flex-1"
            >
              {bounty.status === 'open' ? 'Submit Proposal' : 'Not Available'}
            </ActionButton>
          </div>
        </div>
      </div>
    </div>
  );
}
