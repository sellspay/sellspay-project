import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
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
        className="h-full flex flex-col bg-[#0F1115] overflow-hidden"
        animate={{ width: collapsed ? 56 : 180 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
      >
        {/* Toggle — thin bar */}
        <div className={cn(
          "flex items-center h-14 shrink-0",
          collapsed ? "justify-center px-2" : "justify-end px-4"
        )}>
          <button
            onClick={onToggleCollapse}
            className="p-2 rounded-md hover:bg-white/[0.04] transition-colors"
          >
            <div className="w-4 h-[2px] rounded-full bg-foreground/20" />
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
                  "w-full text-left px-3 py-2 text-[15px] font-medium transition-colors relative",
                  isActive
                    ? "text-foreground"
                    : "text-foreground/50 hover:text-foreground/80"
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 rounded-full bg-foreground/60" />
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
                <div className="text-[10px] text-muted-foreground/40 tabular-nums text-center">
                  {isLoadingCredits ? "…" : creditBalance}
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                {isLoadingCredits ? "Loading…" : `${creditBalance.toLocaleString()} credits`}
              </TooltipContent>
            </Tooltip>
          ) : (
            <div className="flex items-center gap-2">
              <div className="h-1 w-1 rounded-full bg-foreground/20" />
              <span className="text-[11px] text-muted-foreground/40 tabular-nums">
                {isLoadingCredits ? "…" : `${creditBalance.toLocaleString()} credits`}
              </span>
            </div>
          )}
        </div>
      </motion.aside>
    </TooltipProvider>
  );
}
