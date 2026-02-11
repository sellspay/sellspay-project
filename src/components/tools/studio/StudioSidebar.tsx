import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Flame, TrendingUp, Share2, AudioLines, Layers,
  ChevronsLeft, ChevronsRight, Zap,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { StudioSection } from "./StudioLayout";

interface StudioSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  activeSection: StudioSection;
  onSectionChange: (s: StudioSection) => void;
  creditBalance: number;
  isLoadingCredits: boolean;
  activeTool: string | null;
}

const NAV_ITEMS: { id: StudioSection; label: string; icon: React.ElementType }[] = [
  { id: "campaign", label: "Launch Campaign", icon: Flame },
  { id: "listings", label: "Upgrade Listings", icon: TrendingUp },
  { id: "social", label: "Social Factory", icon: Share2 },
  { id: "media", label: "Media Lab", icon: AudioLines },
  { id: "assets", label: "My Assets", icon: Layers },
];

export function StudioSidebar({
  collapsed, onToggleCollapse, activeSection, onSectionChange,
  creditBalance, isLoadingCredits, activeTool,
}: StudioSidebarProps) {
  return (
    <TooltipProvider delayDuration={0}>
      <motion.aside
        className="h-full flex flex-col border-r border-white/[0.06] bg-[hsl(0_0%_3%)] overflow-hidden"
        animate={{ width: collapsed ? 64 : 240 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
      >
        {/* Logo / collapse toggle */}
        <div className={cn(
          "flex items-center h-14 px-3 border-b border-white/[0.06] shrink-0",
          collapsed ? "justify-center" : "justify-between"
        )}>
          {!collapsed && (
            <span className="text-sm font-bold text-foreground tracking-tight">AI Studio</span>
          )}
          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-md hover:bg-white/[0.06] text-muted-foreground transition-colors"
          >
            {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-3 px-2 space-y-1">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const isActive = !activeTool && activeSection === id;
            const btn = (
              <button
                key={id}
                onClick={() => onSectionChange(id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  isActive
                    ? "bg-primary/[0.08] text-primary border-l-2 border-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04] border-l-2 border-transparent"
                )}
              >
                <Icon className={cn("h-4.5 w-4.5 shrink-0", isActive && "text-primary")} />
                {!collapsed && <span className="truncate">{label}</span>}
              </button>
            );

            if (collapsed) {
              return (
                <Tooltip key={id}>
                  <TooltipTrigger asChild>{btn}</TooltipTrigger>
                  <TooltipContent side="right">{label}</TooltipContent>
                </Tooltip>
              );
            }
            return btn;
          })}
        </nav>

        {/* Credit gauge */}
        <div className={cn(
          "shrink-0 border-t border-white/[0.06] px-3 py-3",
          collapsed && "flex justify-center"
        )}>
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/[0.08]">
                  <Zap className="h-4 w-4 text-primary" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                {isLoadingCredits ? "Loading…" : `${creditBalance.toLocaleString()} credits`}
              </TooltipContent>
            </Tooltip>
          ) : (
            <div className="flex items-center gap-2 px-2 py-2 rounded-lg bg-primary/[0.06]">
              <Zap className="h-4 w-4 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-muted-foreground">Credits</p>
                <p className="text-sm font-bold text-foreground tabular-nums">
                  {isLoadingCredits ? "…" : creditBalance.toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </div>
      </motion.aside>
    </TooltipProvider>
  );
}
