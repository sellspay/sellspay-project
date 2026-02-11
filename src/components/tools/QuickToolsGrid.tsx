import { ToolCard } from "./ToolCard";
import { getQuickTools, SUBCATEGORY_LABELS, type ToolSubcategory } from "./toolsRegistry";

interface QuickToolsGridProps {
  onLaunch: (toolId: string) => void;
}

export function QuickToolsGrid({ onLaunch }: QuickToolsGridProps) {
  const tools = getQuickTools();
  const subcategories: ToolSubcategory[] = ["store_growth", "social_content", "media_creation", "utility"];

  return (
    <div className="space-y-10">
      {subcategories.map(sub => {
        const group = tools.filter(t => t.subcategory === sub);
        if (group.length === 0) return null;
        return (
          <section key={sub}>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              {SUBCATEGORY_LABELS[sub]}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {group.map(tool => (
                <ToolCard key={tool.id} tool={tool} onLaunch={onLaunch} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
