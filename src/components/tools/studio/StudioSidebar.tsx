import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  ChevronsLeft, ChevronsRight,
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

const NAV_ITEMS: { id: StudioSection; label: string }[] = [
  { id: "campaign", label: "Launch Campaign" },
  { id: "listings", label: "Upgrade Listings" },
  { id: "social", label: "Social Factory" },
  { id: "media", label: "Media Lab" },
  { id: "assets", label: "My Assets" },
];

export function StudioSidebar({
  collapsed, onToggleCollapse, activeSection, onSectionChange,
  creditBalance, isLoadingCredits, activeTool,
}: StudioSidebarProps) {
  return (
    <TooltipProvider delayDuration={0}>
      <motion.aside
        className="h-full flex flex-col bg-[hsl(0_0%_3%)] overflow-hidden"
        animate={{ width: collapsed ? 56 : 200 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
      >
        {/* Header */}
        <div className={cn(
          "flex items-center h-14 px-4 shrink-0",
          collapsed ? "justify-center" : "justify-between"
        )}>
          {!collapsed && (
            <span className="text-sm font-semibold text-foreground/80 tracking-tight">Studio</span>
          )}
          <button
            onClick={onToggleCollapse}
            className="p-1 rounded-md hover:bg-white/[0.04] text-muted-foreground/50 transition-colors"
          >
            {collapsed ? <ChevronsRight className="h-3.5 w-3.5" /> : <ChevronsLeft className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* Nav items — typography only */}
        <nav className="flex-1 py-4 px-2 space-y-0.5">
          {NAV_ITEMS.map(({ id, label }) => {
            const isActive = !activeTool && activeSection === id;
            const btn = (
              <button
                key={id}
                onClick={() => onSectionChange(id)}
                className={cn(
                  "w-full text-left px-3 py-2 text-[13px] transition-colors relative",
                  isActive
                    ? "text-foreground font-semibold"
                    : "text-muted-foreground/60 hover:text-foreground/80"
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 rounded-full bg-primary" />
                )}
                {!collapsed && <span>{label}</span>}
                {collapsed && <span className="text-[10px]">{label.charAt(0)}</span>}
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

        {/* Credit pill — minimal */}
        <div className={cn(
          "shrink-0 px-4 py-4",
          collapsed && "flex justify-center px-2"
        )}>
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-[10px] text-muted-foreground/50 tabular-nums text-center">
                  {isLoadingCredits ? "…" : creditBalance}
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                {isLoadingCredits ? "Loading…" : `${creditBalance.toLocaleString()} credits`}
              </TooltipContent>
            </Tooltip>
          ) : (
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary/60" />
              <span className="text-[11px] text-muted-foreground/50 tabular-nums">
                {isLoadingCredits ? "…" : `${creditBalance.toLocaleString()} credits`}
              </span>
            </div>
          )}
        </div>
      </motion.aside>
    </TooltipProvider>
  );
}
