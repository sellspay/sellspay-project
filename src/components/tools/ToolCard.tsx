import { Crown, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ToolRegistryEntry } from "./toolsRegistry";

interface ToolCardProps {
  tool: ToolRegistryEntry;
  onLaunch: (toolId: string) => void;
}

export function ToolCard({ tool, onLaunch }: ToolCardProps) {
  const Icon = tool.icon;

  return (
    <button
      onClick={() => !tool.comingSoon && onLaunch(tool.id)}
      disabled={tool.comingSoon}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-[#1e3a5f]/50 bg-[#0b1220] w-full text-left",
        "transition-all duration-300 hover:border-[#3b82f6]/50 hover:shadow-[0_0_16px_rgba(59,130,246,0.12)]",
        "disabled:opacity-50 disabled:cursor-default disabled:hover:border-[#1e3a5f]/50 disabled:hover:shadow-none"
      )}
    >
      <div className="p-5 flex flex-col gap-3">
        {/* Icon + badges */}
        <div className="flex items-center justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0e1a2e] text-[#58b3ff]">
            <Icon className="h-5 w-5" />
          </div>
          {tool.isPro && (
            <Badge variant="outline" className="gap-1 border-amber-500/30 bg-amber-500/10 text-amber-400 text-[10px] px-1.5 py-0">
              <Crown className="h-2.5 w-2.5" /> Pro
            </Badge>
          )}
        </div>

        {/* Title + description */}
        <div>
          <h3 className="text-[15px] font-semibold text-[#58b3ff]">{tool.name}</h3>
          <p className="mt-1 text-[13px] text-[#64748b] leading-relaxed line-clamp-2">{tool.description}</p>
        </div>

        {tool.comingSoon && (
          <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-wide text-[#475569] uppercase">
            <Clock className="h-3 w-3" /> Coming Soon
          </div>
        )}
      </div>
    </button>
  );
}
