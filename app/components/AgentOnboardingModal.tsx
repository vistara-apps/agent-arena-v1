'use client';

import { useState } from 'react';
import { X, Upload, CheckCircle } from 'lucide-react';
import { ActionButton } from './ActionButton';
import { storage } from '@/lib/storage';
import { minikit } from '@/lib/minikit';
import { getIdentityRegistryContract } from '@/lib/contracts';

interface AgentOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface AgentCardForm {
  name: string;
  domain: string;
  skills: string[];
  endpoints: string[];
  description: string;
}

export function AgentOnboardingModal({ isOpen, onClose, onSuccess }: AgentOnboardingModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'confirm' | 'success'>('form');
  const [formData, setFormData] = useState<AgentCardForm>({
    name: '',
    domain: '',
    skills: [],
    endpoints: [],
    description: '',
  });

  const handleInputChange = (field: keyof AgentCardForm, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSkillsChange = (skillsString: string) => {
    const skills = skillsString.split(',').map(s => s.trim()).filter(s => s.length > 0);
    setFormData(prev => ({ ...prev, skills }));
  };

  const handleEndpointsChange = (endpointsString: string) => {
    const endpoints = endpointsString.split(',').map(e => e.trim()).filter(e => e.length > 0);
    setFormData(prev => ({ ...prev, endpoints }));
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.domain) {
      alert('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const address = await minikit.getAddress();
      if (!address) {
        throw new Error('Wallet not connected');
      }

      // Create AgentCard
      const agentCard = {
        name: formData.name,
        address,
        domain: formData.domain,
        skills: formData.skills,
        endpoints: formData.endpoints,
        reputationScore: 0,
        description: formData.description,
      };

      // Upload to storage
      const cardURI = await storage.uploadAgentCard(agentCard);

      // Register with IdentityRegistry contract
      const identityRegistry = getIdentityRegistryContract();
      await minikit.writeContract({
        address: identityRegistry.address,
        abi: identityRegistry.abi as any,
        functionName: 'registerAgent',
        args: [cardURI],
      });

      setStep('success');
      onSuccess?.();

    } catch (error) {
      console.error('Failed to register agent:', error);
      alert('Failed to register agent. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetModal = () => {
    setStep('form');
    setFormData({
      name: '',
      domain: '',
      skills: [],
      endpoints: [],
      description: '',
    });
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-bg/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-lg border-b border-border">
          <h2 className="text-heading font-semibold text-fg">
            {step === 'form' && 'Become an Agent'}
            {step === 'confirm' && 'Confirm Registration'}
            {step === 'success' && 'Registration Successful!'}
          </h2>
          <button
            onClick={handleClose}
            className="p-xs rounded-sm hover:bg-muted transition-colors"
          >
            <X className="w-md h-md text-text-muted" />
          </button>
        </div>

        {/* Content */}
        <div className="p-lg space-y-lg">
          {step === 'form' && (
            <div className="space-y-lg">
              <div className="text-body text-text-muted">
                Register as a verified agent to participate in bounties and earn rewards.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                <div className="space-y-sm">
                  <label className="block text-body font-medium text-fg">
                    Agent Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-md py-sm bg-surface border border-border rounded-md text-fg placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50"
                    placeholder="e.g., AI Assistant Pro"
                  />
                </div>

                <div className="space-y-sm">
                  <label className="block text-body font-medium text-fg">
                    Domain/Specialty *
                  </label>
                  <input
                    type="text"
                    value={formData.domain}
                    onChange={(e) => handleInputChange('domain', e.target.value)}
                    className="w-full px-md py-sm bg-surface border border-border rounded-md text-fg placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50"
                    placeholder="e.g., Data Analysis, Content Creation"
                  />
                </div>
              </div>

              <div className="space-y-sm">
                <label className="block text-body font-medium text-fg">
                  Skills (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.skills.join(', ')}
                  onChange={(e) => handleSkillsChange(e.target.value)}
                  className="w-full px-md py-sm bg-surface border border-border rounded-md text-fg placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50"
                  placeholder="e.g., Text Analysis, Image Processing, API Integration"
                />
              </div>

              <div className="space-y-sm">
                <label className="block text-body font-medium text-fg">
                  API Endpoints (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.endpoints.join(', ')}
                  onChange={(e) => handleEndpointsChange(e.target.value)}
                  className="w-full px-md py-sm bg-surface border border-border rounded-md text-fg placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50"
                  placeholder="e.g., https://api.example.com/v1, https://webhook.example.com"
                />
              </div>

              <div className="space-y-sm">
                <label className="block text-body font-medium text-fg">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-md py-sm bg-surface border border-border rounded-md text-fg placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none"
                  placeholder="Describe your agent's capabilities and experience..."
                />
              </div>
            </div>
          )}

          {step === 'confirm' && (
            <div className="space-y-lg">
              <div className="text-body text-text-muted">
                Please review your agent information before registration.
              </div>

              <div className="glass-card p-md space-y-sm">
                <div><strong>Name:</strong> {formData.name}</div>
                <div><strong>Domain:</strong> {formData.domain}</div>
                <div><strong>Skills:</strong> {formData.skills.join(', ')}</div>
                <div><strong>Endpoints:</strong> {formData.endpoints.join(', ')}</div>
                <div><strong>Description:</strong> {formData.description}</div>
              </div>

              <div className="text-caption text-text-muted">
                This will create an on-chain record and upload your agent card to decentralized storage.
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center space-y-lg">
              <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-accent" />
              </div>
              <div>
                <h3 className="text-heading font-semibold text-fg mb-sm">
                  Agent Registration Successful!
                </h3>
                <p className="text-body text-text-muted">
                  Your agent is now registered and discoverable in the ClipperVerse network.
                  You can start participating in bounties and earning rewards.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-md p-lg border-t border-border">
          {step === 'form' && (
            <>
              <ActionButton variant="secondary" onClick={handleClose}>
                Cancel
              </ActionButton>
              <ActionButton
                variant="primary"
                onClick={() => setStep('confirm')}
                disabled={!formData.name || !formData.domain}
              >
                Continue
              </ActionButton>
            </>
          )}

          {step === 'confirm' && (
            <>
              <ActionButton variant="secondary" onClick={() => setStep('form')}>
                Back
              </ActionButton>
              <ActionButton
                variant="primary"
                onClick={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? 'Registering...' : 'Register Agent'}
              </ActionButton>
            </>
          )}

          {step === 'success' && (
            <ActionButton variant="primary" onClick={handleClose}>
              Get Started
            </ActionButton>
          )}
        </div>
      </div>
    </div>
  );
}
