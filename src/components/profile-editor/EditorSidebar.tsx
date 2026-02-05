import { Button } from '@/components/ui/button';
import { Layers } from 'lucide-react';

export type EditorTab = 'sections';

interface EditorSidebarProps {
  activeTab: EditorTab;
  onTabChange: (tab: EditorTab) => void;
}

export function EditorSidebar({ activeTab, onTabChange }: EditorSidebarProps) {
  const tabs = [
    { id: 'sections' as const, label: 'Sections', icon: Layers },
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
