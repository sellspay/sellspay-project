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
        "group rounded-[22px] p-[1.2px] w-full text-left will-change-transform",
        "bg-[linear-gradient(135deg,#2f95ea_0%,#67b8ff_45%,#b7e0ff_100%)]",
        "transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_0_28px_rgba(59,166,255,0.25)] hover:scale-[1.01]",
        "disabled:opacity-50 disabled:cursor-default disabled:hover:translate-y-0 disabled:hover:scale-100 disabled:hover:shadow-none"
      )}
    >
      <div className="relative overflow-hidden rounded-[21px] bg-[linear-gradient(180deg,#0d1117_0%,#111827_100%)] p-5 h-full transition-all duration-300 group-hover:bg-[linear-gradient(180deg,#101722_0%,#131d2b_100%)]">
        {/* Inner radial glow */}
        <div className="absolute inset-0 rounded-[21px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[radial-gradient(circle_at_top_left,rgba(103,184,255,0.16),transparent_45%)] pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-3">
          {/* Icon + badges */}
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#111c2b] text-[#74beff]">
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex items-center gap-1.5">
              {tool.isPro && (
                <Badge variant="outline" className="gap-1 border-amber-500/30 bg-amber-500/10 text-amber-400 text-[10px] px-1.5 py-0">
                  <Crown className="h-2.5 w-2.5" /> Pro
                </Badge>
              )}
            </div>
          </div>

          {/* Title + description */}
          <div>
            <h3 className="bg-gradient-to-r from-[#58b3ff] to-[#c8e9ff] bg-clip-text text-base font-semibold text-transparent">{tool.name}</h3>
            <p className="mt-1 text-sm text-slate-400 leading-relaxed line-clamp-2">{tool.description}</p>
          </div>

          {/* Footer */}
          {tool.comingSoon && (
            <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-slate-500">
              <Clock className="h-3 w-3" /> COMING SOON
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
