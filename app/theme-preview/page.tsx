'use client';

import { useTheme } from '../components/ThemeProvider';
import { ActionButton } from '../components/ActionButton';
import { BountyCard } from '../components/BountyCard';
import { AgentProfileCard } from '../components/AgentProfileCard';
import { StatusBadge } from '../components/StatusBadge';
import { MOCK_BOUNTIES, MOCK_AGENTS } from '@/lib/constants';

export default function ThemePreview() {
  const { theme, setTheme } = useTheme();

  const themes = [
    { id: 'default', name: 'ClipperVerse Finance', description: 'Professional finance theme with gold accents' },
    { id: 'celo', name: 'Celo', description: 'Black background with yellow accents' },
    { id: 'solana', name: 'Solana', description: 'Dark purple with magenta accents' },
    { id: 'base', name: 'Base', description: 'Dark blue with Base blue accents' },
    { id: 'coinbase', name: 'Coinbase', description: 'Navy with Coinbase blue accents' },
  ] as const;

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-screen-lg mx-auto px-4 py-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gradient mb-2">Theme Preview</h1>
          <p className="text-text-muted">Preview different themes for ClipperVerse</p>
        </div>

        {/* Theme Selector */}
        <div className="glass-card p-6 mb-8">
          <h2 className="text-xl font-semibold text-fg mb-4">Select Theme</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                  theme === t.id
                    ? 'border-accent bg-accent/10'
                    : 'border-border bg-surface hover:border-accent/50'
                }`}
              >
                <div className="font-semibold text-fg mb-1">{t.name}</div>
                <div className="text-sm text-text-muted">{t.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Component Previews */}
        <div className="space-y-8">
          {/* Buttons */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-fg mb-4">Buttons</h3>
            <div className="flex flex-wrap gap-4">
              <ActionButton variant="primary">Primary Button</ActionButton>
              <ActionButton variant="secondary">Secondary Button</ActionButton>
              <ActionButton variant="destructive">Destructive Button</ActionButton>
              <ActionButton variant="primary" loading>Loading...</ActionButton>
            </div>
          </div>

          {/* Status Badges */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-fg mb-4">Status Badges</h3>
            <div className="flex flex-wrap gap-4">
              <StatusBadge status="open" />
              <StatusBadge status="processing" />
              <StatusBadge status="completed" />
              <StatusBadge status="disputed" />
            </div>
          </div>

          {/* Bounty Cards */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-fg mb-4">Bounty Cards</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {MOCK_BOUNTIES.slice(0, 2).map((bounty) => (
                <BountyCard key={bounty.bountyId} bounty={bounty} />
              ))}
            </div>
          </div>

          {/* Agent Cards */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-fg mb-4">Agent Cards</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {MOCK_AGENTS.slice(0, 3).map((agent) => (
                <AgentProfileCard key={agent.agentAddress} agent={agent} variant="detailed" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
