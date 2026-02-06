import React from 'react';

interface StickyNavProps {
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  variant?: 'glass' | 'solid' | 'minimal';
  className?: string;
}

export function StickyNav({
  tabs,
  activeTab,
  onTabChange,
  variant = 'glass',
  className = ''
}: StickyNavProps) {
  const variants = {
    glass: 'bg-background/80 backdrop-blur-xl border-b border-border',
    solid: 'bg-background border-b border-border',
    minimal: 'bg-transparent',
  };

  return (
    <nav className={`sticky top-0 z-40 ${variants[variant]} ${className}`}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex gap-1 py-2">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab 
                  ? 'bg-accent text-accent-foreground' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}

export default StickyNav;
