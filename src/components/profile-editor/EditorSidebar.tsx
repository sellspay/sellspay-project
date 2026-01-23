import { Button } from '@/components/ui/button';
import { Home, Layers, Settings } from 'lucide-react';

interface EditorSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function EditorSidebar({ activeTab, onTabChange }: EditorSidebarProps) {
  const tabs = [
    { id: 'sections', label: 'Sections', icon: Layers },
    { id: 'style', label: 'Store Style', icon: Settings },
  ];

  return (
    <div className="w-16 border-r border-border bg-card flex flex-col items-center py-4 gap-2">
      {tabs.map((tab) => (
        <Button
          key={tab.id}
          variant={activeTab === tab.id ? 'secondary' : 'ghost'}
          size="icon"
          className="w-12 h-12"
          onClick={() => onTabChange(tab.id)}
          title={tab.label}
        >
          <tab.icon className="w-5 h-5" />
        </Button>
      ))}
    </div>
  );
}
