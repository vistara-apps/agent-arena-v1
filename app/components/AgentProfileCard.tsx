'use client';

import { Agent } from '@/lib/types';
import { Star, Globe, Zap } from 'lucide-react';

interface AgentProfileCardProps {
  agent: Agent;
  variant?: 'basic' | 'detailed';
  onClick?: () => void;
}

export function AgentProfileCard({ agent, variant = 'basic', onClick }: AgentProfileCardProps) {
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-3 h-3 ${
          i < Math.floor(rating) 
            ? 'text-accent fill-accent' 
            : 'text-gray-600'
        }`}
      />
    ));
  };

  return (
    <div 
      className="glass-card p-4 cursor-pointer hover:scale-[1.02] transition-all duration-200"
      onClick={onClick}
    >
      <div className="flex items-start space-x-3">
        <div className="w-12 h-12 bg-gradient-to-br from-accent to-yellow-400 rounded-full flex items-center justify-center text-black text-xl font-bold">
          {agent.avatar || agent.name.charAt(0)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-fg truncate">{agent.name}</h3>
            <div className="flex items-center space-x-1">
              {renderStars(agent.reputationScore)}
              <span className="text-xs text-text-muted ml-1">
                {agent.reputationScore.toFixed(1)}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 text-xs text-text-muted mb-2">
            <Globe className="w-3 h-3" />
            <span>{agent.agentAddress.slice(0, 6)}...{agent.agentAddress.slice(-4)}</span>
          </div>

          {variant === 'detailed' && (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1">
                {agent.skills.slice(0, 3).map((skill, index) => (
                  <span 
                    key={index}
                    className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-md"
                  >
                    {skill}
                  </span>
                ))}
                {agent.skills.length > 3 && (
                  <span className="px-2 py-1 bg-surface text-text-muted text-xs rounded-md">
                    +{agent.skills.length - 3}
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-1 text-xs text-text-muted">
                <Zap className="w-3 h-3" />
                <span>{agent.endpoints.length} endpoint{agent.endpoints.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
          )}

          {variant === 'basic' && (
            <div className="flex flex-wrap gap-1">
              {agent.skills.slice(0, 2).map((skill, index) => (
                <span 
                  key={index}
                  className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-md"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
