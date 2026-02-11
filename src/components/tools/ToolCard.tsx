import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Crown, Coins, ArrowRight, Clock } from "lucide-react";
import type { ToolRegistryEntry } from "./toolsRegistry";

interface ToolCardProps {
  tool: ToolRegistryEntry;
  onLaunch: (toolId: string) => void;
}

export function ToolCard({ tool, onLaunch }: ToolCardProps) {
  const Icon = tool.icon;
  const isFree = tool.creditCost === 0;

  return (
    <button
      onClick={() => !tool.comingSoon && onLaunch(tool.id)}
      disabled={tool.comingSoon}
      className="group relative flex flex-col items-start gap-3 rounded-xl border border-border/50 bg-card p-5 text-left transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 disabled:opacity-70 disabled:cursor-default"
    >
      {/* Icon + badges row */}
      <div className="flex w-full items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex items-center gap-1.5">
          {tool.isPro && (
            <Badge variant="outline" className="gap-1 border-amber-500/30 bg-amber-500/10 text-amber-500 text-[10px] px-1.5 py-0">
              <Crown className="h-2.5 w-2.5" /> Pro
            </Badge>
          )}
          {isFree ? (
            <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-500 text-[10px] px-1.5 py-0">
              Free
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1 border-border bg-muted/50 text-muted-foreground text-[10px] px-1.5 py-0">
              <Coins className="h-2.5 w-2.5" /> {tool.creditCost}
            </Badge>
          )}
        </div>
      </div>

      {/* Title + description */}
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-foreground leading-tight">{tool.name}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{tool.description}</p>
      </div>

      {/* Footer */}
      <div className="mt-auto pt-2 w-full">
        {tool.comingSoon ? (
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Clock className="h-3 w-3" /> Coming Soon
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
            Launch <ArrowRight className="h-3 w-3" />
          </div>
        )}
      </div>
    </button>
  );
}
