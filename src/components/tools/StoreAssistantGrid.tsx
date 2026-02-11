import { ToolCard } from "./ToolCard";
import { getStoreAssistantTools } from "./toolsRegistry";

interface StoreAssistantGridProps {
  onLaunch: (toolId: string) => void;
}

export function StoreAssistantGrid({ onLaunch }: StoreAssistantGridProps) {
  const tools = getStoreAssistantTools();

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground max-w-xl">
        Tools that directly update your storefront. Generate sections, rewrite copy, and optimize your store — all powered by AI and your Brand Kit.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tools.map(tool => (
          <ToolCard key={tool.id} tool={tool} onLaunch={onLaunch} />
        ))}
      </div>
    </div>
  );
}
