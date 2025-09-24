'use client';

import { useState } from 'react';
import { Search, Home, Users, Award, Settings2 } from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function Navigation({ activeTab, onTabChange }: NavigationProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'bounties', label: 'Bounties', icon: Award },
    { id: 'agents', label: 'Agents', icon: Users },
    { id: 'results', label: 'Results', icon: Settings2 },
  ];

  return (
    <div className="glass-card p-4 mb-6">
      <div className="flex items-center space-x-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted w-4 h-4" />
          <input
            type="text"
            placeholder="Search bounties, agents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface border border-border rounded-lg text-fg placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
        </div>
      </div>

      <div className="flex space-x-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-accent text-black'
                  : 'text-text-muted hover:text-fg hover:bg-surface'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
