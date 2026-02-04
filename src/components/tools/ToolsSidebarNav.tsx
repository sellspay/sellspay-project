import { cn } from "@/lib/utils";
import { toolsData, ToolData } from "./toolsData";
import { Sparkles } from "lucide-react";

interface ToolsSidebarNavProps {
  selectedToolId: string | null;
  onSelectTool: (toolId: string) => void;
}

export function ToolsSidebarNav({ 
  selectedToolId, 
  onSelectTool
}: ToolsSidebarNavProps) {
  const availableTools = toolsData.filter(t => t.available);
  const proTools = availableTools.filter(t => t.isPro);
  const freeTools = availableTools.filter(t => !t.isPro);

  return (
    <div className="w-64 flex-shrink-0 border-r border-border/50 bg-background/50 flex flex-col h-screen sticky top-0">
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <h2 className="text-lg font-semibold text-foreground">AI Studio</h2>
        <p className="text-sm text-muted-foreground mt-1">Powerful audio tools</p>
      </div>
      
      {/* Tool Lists */}
      <div className="flex-1 overflow-y-auto py-2">
        {/* Pro Tools */}
        <div className="px-3 py-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2">
            Pro Tools
          </span>
        </div>
        <div className="space-y-0.5 px-2">
          {proTools.map((tool) => (
            <ToolNavItem 
              key={tool.id}
              tool={tool}
              isSelected={selectedToolId === tool.id}
              onClick={() => onSelectTool(tool.id)}
            />
          ))}
        </div>
        
        {/* Free Tools */}
        <div className="px-3 py-2 mt-4">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2">
            Free Tools
          </span>
        </div>
        <div className="space-y-0.5 px-2">
          {freeTools.map((tool) => (
            <ToolNavItem 
              key={tool.id}
              tool={tool}
              isSelected={selectedToolId === tool.id}
              onClick={() => onSelectTool(tool.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface ToolNavItemProps {
  tool: ToolData;
  isSelected: boolean;
  onClick: () => void;
}

function ToolNavItem({ tool, isSelected, onClick }: ToolNavItemProps) {
  const Icon = tool.icon;
  
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all",
        isSelected
          ? "bg-primary/10 text-foreground border border-primary/30"
          : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground border border-transparent"
      )}
    >
      <Icon className={cn(
        "w-4 h-4 flex-shrink-0",
        isSelected && "text-primary"
      )} />
      <span className="text-sm font-medium truncate flex-1">{tool.title}</span>
      {tool.isPro && (
        <Sparkles className="w-3 h-3 text-primary flex-shrink-0" />
      )}
    </button>
  );
}
