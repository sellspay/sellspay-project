import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  ArrowLeft, Home, Zap, Sparkles, ChevronDown, ChevronRight, FolderOpen,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { toolsRegistry, SUBCATEGORY_LABELS, type ToolSubcategory } from "@/components/tools/toolsRegistry";

interface StudioSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  activeSection: string;
  onSectionChange: (s: string) => void;
  creditBalance: number;
  isLoadingCredits: boolean;
  activeTool: string | null;
  onToolSelect: (toolId: string) => void;
  onGoHome: () => void;
}

const SUBCATEGORY_ORDER: ToolSubcategory[] = ["media_creation", "store_growth", "social_content", "utility"];

export function StudioSidebar({
  collapsed, onToggleCollapse, activeSection, onSectionChange,
  creditBalance, isLoadingCredits, activeTool, onToolSelect, onGoHome,
}: StudioSidebarProps) {
  const navigate = useNavigate();
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    media_creation: true,
    store_growth: true,
    social_content: false,
    utility: false,
  });

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const quickTools = toolsRegistry.filter(t => t.category === "quick_tool" && t.isActive);

  return (
    <TooltipProvider delayDuration={0}>
      <motion.aside
        className="h-full flex flex-col bg-[#0F1115] overflow-hidden"
        animate={{ width: collapsed ? 56 : 220 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
      >
        {/* Exit Studio */}
        <div className="shrink-0 px-3 pt-4 pb-1">
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

        {/* Home button */}
        <div className="shrink-0 px-3 pb-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onGoHome}
                className={cn(
                  "flex items-center gap-2.5 w-full rounded-lg px-2.5 py-2 text-sm transition-colors",
                  !activeTool && activeSection === "home"
                    ? "bg-gradient-to-r from-[#FF7A1A] to-[#E85C00] text-white font-medium shadow-sm"
                    : "text-muted-foreground/60 hover:text-foreground/80 hover:bg-white/[0.03]",
                  collapsed && "justify-center"
                )}
              >
                <Home className="h-4 w-4 shrink-0" />
                {!collapsed && <span>Home</span>}
              </button>
            </TooltipTrigger>
            {collapsed && <TooltipContent side="right">Home</TooltipContent>}
          </Tooltip>
        </div>

        <div className="h-px bg-white/[0.06] mx-3" />

        {/* Tool groups */}
        <nav className="flex-1 overflow-y-auto custom-scrollbar px-2 py-2 space-y-1">
          {SUBCATEGORY_ORDER.map(subcat => {
            const tools = quickTools
              .filter(t => t.subcategory === subcat)
              .sort((a, b) => a.sortOrder - b.sortOrder);
            if (!tools.length) return null;

            const isExpanded = expandedGroups[subcat] ?? false;

            return (
              <div key={subcat}>
                {!collapsed ? (
                  <button
                    onClick={() => toggleGroup(subcat)}
                    className="flex items-center gap-1.5 w-full px-2 py-1.5 text-[10px] font-semibold text-muted-foreground/40 uppercase tracking-wider hover:text-muted-foreground/60 transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-3 w-3 shrink-0" />
                    ) : (
                      <ChevronRight className="h-3 w-3 shrink-0" />
                    )}
                    {SUBCATEGORY_LABELS[subcat]}
                  </button>
                ) : (
                  <div className="h-px bg-white/[0.04] mx-1 my-1.5" />
                )}

                {(isExpanded || collapsed) && (
                  <div className="space-y-0.5">
                    {tools.map(tool => {
                      const Icon = tool.icon;
                      const isActive = activeTool === tool.id || activeTool === tool.legacyRoute;

                      const btn = (
                        <button
                          key={tool.id}
                          onClick={() => onToolSelect(tool.id)}
                          className={cn(
                            "flex items-center gap-2.5 w-full rounded-lg px-2.5 py-2 text-[13px] transition-colors",
                            isActive
                              ? "bg-gradient-to-r from-[#FF7A1A] to-[#E85C00] text-white font-medium shadow-sm"
                              : "text-muted-foreground/50 hover:text-foreground/80 hover:bg-white/[0.03]",
                            collapsed && "justify-center"
                          )}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          {!collapsed && (
                            <span className="truncate flex-1 text-left">{tool.name}</span>
                          )}
                          {!collapsed && tool.isPro && (
                            <Sparkles className="h-3 w-3 text-primary/60 shrink-0" />
                          )}
                          {!collapsed && tool.comingSoon && (
                            <span className="text-[8px] text-muted-foreground/30 uppercase font-bold shrink-0">Soon</span>
                          )}
                        </button>
                      );

                      if (collapsed) {
                        return (
                          <Tooltip key={tool.id}>
                            <TooltipTrigger asChild>{btn}</TooltipTrigger>
                            <TooltipContent side="right">{tool.name}</TooltipContent>
                          </Tooltip>
                        );
                      }
                      return <div key={tool.id}>{btn}</div>;
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Assets + Credits */}
        <div className="shrink-0 border-t border-white/[0.06]">
          <div className="px-3 py-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onSectionChange("assets")}
                  className={cn(
                    "flex items-center gap-2.5 w-full rounded-lg px-2.5 py-2 text-sm transition-colors",
                    "text-muted-foreground/50 hover:text-foreground/80 hover:bg-white/[0.03]",
                    collapsed && "justify-center"
                  )}
                >
                  <FolderOpen className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>My Assets</span>}
                </button>
              </TooltipTrigger>
              {collapsed && <TooltipContent side="right">My Assets</TooltipContent>}
            </Tooltip>
          </div>

          <div className={cn(
            "px-3 py-3 border-t border-white/[0.06]",
            collapsed && "flex justify-center px-2"
          )}>
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-[#FF7A1A]/10">
                    <Zap className="h-3.5 w-3.5 text-[#FF7A1A]" />
                    <span className="text-[11px] font-bold text-[#FF7A1A] tabular-nums">
                      {isLoadingCredits ? "…" : creditBalance}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {isLoadingCredits ? "Loading…" : `${creditBalance.toLocaleString()} credits`}
                </TooltipContent>
              </Tooltip>
            ) : (
              <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-[#FF7A1A]/10">
                <Zap className="h-4 w-4 text-[#FF7A1A]" />
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-[#FF7A1A] tabular-nums">
                    {isLoadingCredits ? "…" : creditBalance.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-[#FF7A1A]/50 -mt-0.5">credits</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.aside>
    </TooltipProvider>
  );
}
