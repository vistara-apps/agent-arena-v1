'use client';

import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { ActionButton } from './ActionButton';

interface CreateBountyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (bountyData: any) => void;
}

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

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate submission
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    onSubmit({
      ...formData,
      submissionDeadline: new Date(formData.deadline),
      requirements: formData.requirements.filter(req => req.trim() !== '')
    });
    
    setIsSubmitting(false);
    onClose();
    
    // Reset form
    setFormData({
      title: '',
      description: '',
      rewardAmount: '',
      currency: 'ETH',
      deadline: '',
      requirements: ['']
    });
  };

  const addRequirement = () => {
    setFormData(prev => ({
      ...prev,
      requirements: [...prev.requirements, '']
    }));
  };

  const removeRequirement = (index: number) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index)
    }));
  };

  const updateRequirement = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.map((req, i) => i === index ? value : req)
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-2xl font-bold text-fg">Create New Bounty</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface rounded-lg transition-colors duration-200"
          >
            <X className="w-5 h-5 text-text-muted" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-fg mb-2">
              Bounty Title
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-fg placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50"
              placeholder="Enter bounty title..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-fg mb-2">
              Description
            </label>
            <textarea
              required
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-fg placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50"
              placeholder="Describe the task and requirements..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-fg mb-2">
                Reward Amount
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.rewardAmount}
                onChange={(e) => setFormData(prev => ({ ...prev, rewardAmount: e.target.value }))}
                className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-fg placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-fg mb-2">
                Currency
              </label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value as 'ETH' | 'USDC' }))}
                className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-fg focus:outline-none focus:ring-2 focus:ring-accent/50"
              >
                <option value="ETH">ETH</option>
                <option value="USDC">USDC</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-fg mb-2">
              Submission Deadline
            </label>
            <input
              type="datetime-local"
              required
              value={formData.deadline}
              onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
              className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-fg focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-fg">
                Requirements
              </label>
              <button
                type="button"
                onClick={addRequirement}
                className="flex items-center space-x-1 text-accent hover:text-yellow-400 text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </div>
            <div className="space-y-2">
              {formData.requirements.map((req, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={req}
                    onChange={(e) => updateRequirement(index, e.target.value)}
                    className="flex-1 px-4 py-2 bg-surface border border-border rounded-lg text-fg placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50"
                    placeholder="Enter requirement..."
                  />
                  {formData.requirements.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRequirement(index)}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors duration-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex space-x-3 pt-4 border-t border-border">
            <ActionButton
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </ActionButton>
            <ActionButton
              type="submit"
              variant="primary"
              loading={isSubmitting}
              className="flex-1"
            >
              Create Bounty
            </ActionButton>
          </div>
        </form>
      </div>
    </div>
  );
}
