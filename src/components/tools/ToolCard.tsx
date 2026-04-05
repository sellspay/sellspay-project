import { Crown, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ToolRegistryEntry } from "./toolsRegistry";

const GRAD = "bg-gradient-to-br from-[#4da6ff] via-[#7cc8ff] to-[#bfe6ff]";

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
        "group relative rounded-[22px] w-full text-left will-change-transform",
        "transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.01]",
        "disabled:opacity-50 disabled:cursor-default disabled:hover:translate-y-0 disabled:hover:scale-100"
      )}
    >
      {/* Layer 1: SOFT GLOW */}
      <div className={cn(
        "absolute -inset-[1px] rounded-[22px] opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-60",
        GRAD,
      )} />

      {/* Layer 2: CRISP EDGE */}
      <div className={cn("relative rounded-[22px] p-[1px]", GRAD)}>

        {/* Layer 3: INNER CARD */}
        <div className="rounded-[21px] bg-[#0b1220] p-5 h-full transition-colors duration-300 group-hover:bg-[#0e1628] overflow-hidden">
          {/* Glass highlight */}
          <div className="absolute inset-0 rounded-[21px] bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none" />

          <div className="relative z-10 flex flex-col gap-3">
            {/* Icon + badges */}
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0e1a2e] text-[#74beff]">
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
              <h3 className="bg-gradient-to-r from-[#58b3ff] to-[#c8e9ff] bg-clip-text text-base font-semibold text-transparent">{tool.name}</h3>
              <p className="mt-1 text-sm text-slate-400 leading-relaxed line-clamp-2">{tool.description}</p>
            </div>

            {tool.comingSoon && (
              <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-slate-500">
                <Clock className="h-3 w-3" /> COMING SOON
              </div>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
