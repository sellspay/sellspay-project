import { Badge } from "@/components/ui/badge";
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
      className="group relative flex flex-col items-start gap-3 rounded-2xl p-5 text-left transition-all duration-250 overflow-hidden bg-[#333333] border border-[#383838] shadow-[0_2px_12px_rgba(0,0,0,0.3)] hover:border-emerald-500/60 hover:shadow-[0_4px_20px_rgba(16,185,129,0.15)] hover:-translate-y-1 disabled:opacity-50 disabled:cursor-default"
    >
      {/* Left accent bar */}
      <div className="w-[3px] h-full absolute left-0 top-0 bg-emerald-500/60 group-hover:bg-emerald-400 transition-colors" />

      {/* Icon + badges row */}
      <div className="flex w-full items-center justify-between pl-1">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 transition-colors group-hover:bg-emerald-500/20">
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
            <Badge variant="outline" className="gap-1 border-[#474747] bg-[#383838] text-[#a3a3a3] text-[10px] px-1.5 py-0">
              <Coins className="h-2.5 w-2.5" /> {tool.creditCost}
            </Badge>
          )}
        </div>
      </div>

      {/* Title + description */}
      <div className="space-y-1 pl-1">
        <h3 className="text-sm font-bold text-[#f5f5f5] leading-tight">{tool.name}</h3>
        <p className="text-xs text-[#a3a3a3] leading-relaxed line-clamp-2">{tool.description}</p>
      </div>

      {/* Footer */}
      <div className="mt-auto pt-2 w-full pl-1">
        {tool.comingSoon ? (
          <div className="flex items-center gap-1.5 text-[11px] text-[#737373]">
            <Clock className="h-3 w-3" /> Coming Soon
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-400 opacity-0 transition-opacity group-hover:opacity-100">
            Launch <ArrowRight className="h-3 w-3" />
          </div>
        )}
      </div>
    </button>
  );
}
