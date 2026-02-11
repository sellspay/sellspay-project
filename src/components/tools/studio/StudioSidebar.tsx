import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Rocket, ListChecks, Share2, AudioLines, FolderOpen,
  Star, Download, ArrowLeft,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useNavigate } from "react-router-dom";
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

const NAV_ITEMS: { id: StudioSection; label: string; icon: typeof Rocket }[] = [
  { id: "campaign", label: "Campaign", icon: Rocket },
  { id: "listings", label: "Listings", icon: ListChecks },
  { id: "social", label: "Social", icon: Share2 },
  { id: "media", label: "Media", icon: AudioLines },
];

const BOTTOM_ITEMS: { id: StudioSection; label: string; icon: typeof Star }[] = [
  { id: "assets", label: "My Assets", icon: FolderOpen },
];

export function StudioSidebar({
  collapsed, onToggleCollapse, activeSection, onSectionChange,
  creditBalance, isLoadingCredits, activeTool,
}: StudioSidebarProps) {
  const navigate = useNavigate();

  return (
    <TooltipProvider delayDuration={0}>
      <motion.aside
        className="h-full flex flex-col bg-[#0F1115] overflow-hidden"
        animate={{ width: collapsed ? 56 : 200 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
      >
        {/* Exit Studio */}
        <div className="shrink-0 px-3 pt-4 pb-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => navigate("/")}
                className={cn(
                  "flex items-center gap-2.5 w-full rounded-lg px-2.5 py-2 text-sm text-muted-foreground/60 hover:text-foreground hover:bg-white/[0.04] transition-colors",
                  collapsed && "justify-center"
                )}
              >
                <ArrowLeft className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="font-medium">Exit Studio</span>}
              </button>
            </TooltipTrigger>
            {collapsed && <TooltipContent side="right">Exit Studio</TooltipContent>}
          </Tooltip>
        </div>

        {/* Main nav */}
        <nav className="flex-1 px-3 py-2 space-y-0.5">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const isActive = !activeTool && activeSection === id;
            const btn = (
              <button
                key={id}
                onClick={() => onSectionChange(id)}
                className={cn(
                  "flex items-center gap-2.5 w-full rounded-lg px-2.5 py-2 text-sm transition-colors",
                isActive
                    ? "bg-gradient-to-r from-[#FF7A1A] to-[#E85C00] text-white font-medium shadow-sm"
                    : "text-muted-foreground/60 hover:text-foreground/80 hover:bg-white/[0.03]"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{label}</span>}
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

          {/* Separator */}
          <div className="!my-3 h-px bg-white/[0.06] mx-1" />

          {/* Bottom nav items */}
          {BOTTOM_ITEMS.map(({ id, label, icon: Icon }) => {
            const isActive = !activeTool && activeSection === id;
            const btn = (
              <button
                key={id}
                onClick={() => onSectionChange(id)}
                className={cn(
                  "flex items-center gap-2.5 w-full rounded-lg px-2.5 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-gradient-to-r from-[#FF7A1A] to-[#E85C00] text-white font-medium shadow-sm"
                    : "text-muted-foreground/60 hover:text-foreground/80 hover:bg-white/[0.03]"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{label}</span>}
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

        {/* Credit pill */}
        <div className={cn(
          "shrink-0 px-3 py-4 border-t border-white/[0.06]",
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
