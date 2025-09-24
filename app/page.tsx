'use client';

import { useState, useEffect } from 'react';
import { ConnectWallet, Wallet } from '@coinbase/onchainkit/wallet';
import { Name, Avatar } from '@coinbase/onchainkit/identity';
import { Plus, TrendingUp, Users, Award, DollarSign, Loader2 } from 'lucide-react';
import { Navigation } from './components/Navigation';
import { BountyCard } from './components/BountyCard';
import { AgentProfileCard } from './components/AgentProfileCard';
import { BountyModal } from './components/BountyModal';
import { CreateBountyModal } from './components/CreateBountyModal';
import { ActionButton } from './components/ActionButton';
import { AgentOnboardingModal } from './components/AgentOnboardingModal';
import { MOCK_BOUNTIES, MOCK_AGENTS } from '@/lib/constants';
import { Bounty, Agent } from '@/lib/types';
import { minikit } from '@/lib/minikit';
import { getBountySystemContract, getIdentityRegistryContract } from '@/lib/contracts';

export default function ClipperVersePage() {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedBounty, setSelectedBounty] = useState<Bounty | null>(null);
  const [showBountyModal, setShowBountyModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [bounties, setBounties] = useState<Bounty[]>(MOCK_BOUNTIES);
  const [agents] = useState<Agent[]>(MOCK_AGENTS);
  const [isLoading, setIsLoading] = useState(false);
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const [isMiniKit, setIsMiniKit] = useState(false);

  // Check for MiniKit environment and wallet connection
  useEffect(() => {
    const checkMiniKit = async () => {
      setIsMiniKit(minikit.isMiniKit());

      try {
        const address = await minikit.getAddress();
        setConnectedAddress(address);
      } catch (error) {
        console.log('Wallet not connected');
      }
    };

    checkMiniKit();
  }, []);

  const handleBountyClick = (bounty: Bounty) => {
    setSelectedBounty(bounty);
    setShowBountyModal(true);
  };

  const handleCreateBounty = async (bountyData: any) => {
    if (!connectedAddress) {
      alert('Please connect your wallet first');
      return;
    }

    setIsLoading(true);
    try {
      const bountySystem = getBountySystemContract();

      // Convert deadline to Unix timestamp
      const deadline = Math.floor(new Date(bountyData.submissionDeadline).getTime() / 1000);

      // Convert reward amount to wei (assuming ETH)
      const rewardAmount = BigInt(Math.floor(parseFloat(bountyData.rewardAmount) * 1e18));

      // Create bounty on-chain
      const txHash = await minikit.writeContract({
        address: bountySystem.address,
        abi: bountySystem.abi as any,
        functionName: 'createBounty',
        args: [
          bountyData.description,
          rewardAmount,
          '0x0000000000000000000000000000000000000000', // ETH address
          deadline,
          bountyData.verificationMethod || 'manual'
        ],
        value: rewardAmount,
      });

      console.log('Bounty created:', txHash);

      // For demo purposes, add to local state
      // In production, you'd listen for events or refetch from contract
      const newBounty: Bounty = {
        bountyId: (bounties.length + 1).toString(),
        creatorAddress: connectedAddress,
        status: 'open',
        ...bountyData
      };
      setBounties(prev => [newBounty, ...prev]);

    } catch (error) {
      console.error('Failed to create bounty:', error);
      alert('Failed to create bounty. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderMetrics = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="metric-card">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center">
            <Award className="w-5 h-5 text-accent" />
          </div>
          <div>
            <div className="text-2xl font-bold text-fg">{bounties.length}</div>
            <div className="text-sm text-text-muted">Active Bounties</div>
          </div>
        </div>
      </div>

      <div className="metric-card">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="text-2xl font-bold text-fg">{agents.length}</div>
            <div className="text-sm text-text-muted">Verified Agents</div>
          </div>
        </div>
      </div>

      <div className="metric-card">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-fg">12.5</div>
            <div className="text-sm text-text-muted">ETH Rewards</div>
          </div>
        </div>
      </div>

      <div className="metric-card">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-fg">89%</div>
            <div className="text-sm text-text-muted">Success Rate</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderHome = () => (
    <div className="space-y-6">
      {renderMetrics()}
      
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-fg">Recent Bounties</h2>
        <ActionButton
          variant="primary"
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          <span>Create Bounty</span>
        </ActionButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {bounties.slice(0, 4).map((bounty) => (
          <BountyCard
            key={bounty.bountyId}
            bounty={bounty}
            onClick={() => handleBountyClick(bounty)}
          />
        ))}
      </div>

      <div>
        <h2 className="text-2xl font-bold text-fg mb-4">Top Agents</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.slice(0, 3).map((agent) => (
            <AgentProfileCard
              key={agent.agentAddress}
              agent={agent}
              variant="detailed"
            />
          ))}
        </div>
      </div>
    </div>
  );

  const renderBounties = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-fg">All Bounties</h2>
        <ActionButton
          variant="primary"
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          <span>Create Bounty</span>
        </ActionButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {bounties.map((bounty) => (
          <BountyCard
            key={bounty.bountyId}
            bounty={bounty}
            onClick={() => handleBountyClick(bounty)}
          />
        ))}
      </div>
    </div>
  );

  const renderAgents = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-fg">Verified Agents</h2>
        <ActionButton
          variant="primary"
          onClick={() => setShowAgentModal(true)}
          className="flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Become an Agent</span>
        </ActionButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((agent) => (
          <AgentProfileCard
            key={agent.agentAddress}
            agent={agent}
            variant="detailed"
          />
        ))}
      </div>
    </div>
  );

  const renderResults = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-fg">Results & Verification</h2>
      
      <div className="glass-card p-6 text-center">
        <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Award className="w-8 h-8 text-accent" />
        </div>
        <h3 className="text-xl font-semibold text-fg mb-2">No Results Yet</h3>
        <p className="text-text-muted mb-4">
          Results and verification status will appear here once bounties are completed.
        </p>
        <ActionButton
          variant="secondary"
          onClick={() => setActiveTab('bounties')}
        >
          View Bounties
        </ActionButton>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return renderHome();
      case 'bounties':
        return renderBounties();
      case 'agents':
        return renderAgents();
      case 'results':
        return renderResults();
      default:
        return renderHome();
    }
  };

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-screen-lg mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gradient mb-2">ClipperVerse</h1>
            <p className="text-text-muted">On-chain bounties powered by verified agents</p>
          </div>
          
          <Wallet>
            <ConnectWallet>
              <div className="flex items-center space-x-3 glass-card px-4 py-2">
                <Avatar className="w-8 h-8" />
                <div className="flex flex-col">
                  <Name className="font-medium" />
                  {connectedAddress && (
                    <span className="text-caption text-text-muted">
                      {connectedAddress.slice(0, 6)}...{connectedAddress.slice(-4)}
                    </span>
                  )}
                  {isMiniKit && (
                    <span className="text-caption text-accent">MiniKit</span>
                  )}
                </div>
              </div>
            </ConnectWallet>
          </Wallet>
        </div>

        {/* Navigation */}
        <Navigation activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Content */}
        {renderContent()}

        {/* Modals */}
        <BountyModal
          bounty={selectedBounty}
          isOpen={showBountyModal}
          onClose={() => {
            setShowBountyModal(false);
            setSelectedBounty(null);
          }}
        />

        <CreateBountyModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateBounty}
        />

        <AgentOnboardingModal
          isOpen={showAgentModal}
          onClose={() => setShowAgentModal(false)}
        />
      </div>
    </div>
  );
}
