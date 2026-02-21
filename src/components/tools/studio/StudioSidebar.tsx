import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  ArrowLeft, Home, Sparkles, ChevronDown, ChevronRight, FolderOpen,
  User, Settings, CreditCard, LogOut, Zap, Gift, ChevronRight as ChevRight,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useSubscription } from "@/hooks/useSubscription";
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
  const { user, profile, signOut } = useAuth();
  const { plan } = useSubscription();
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
                    ? "bg-gradient-to-r from-[#4B8BF5] to-[#2563EB] text-white font-medium shadow-sm"
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
                              ? "bg-gradient-to-r from-[#4B8BF5] to-[#2563EB] text-white font-medium shadow-sm"
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

        {/* Bottom section: Auth-aware */}
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
            {!user ? (
              /* Guest: Start Free button */
              collapsed ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => navigate("/signup")}
                      className="flex items-center justify-center w-full px-2 py-1.5 rounded-lg bg-primary text-primary-foreground"
                    >
                      <Zap className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Start Now for Free</TooltipContent>
                </Tooltip>
              ) : (
                <button
                  onClick={() => navigate("/signup")}
                  className="flex items-center justify-center gap-2 w-full px-3 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
                >
                  <Zap className="h-4 w-4" />
                  Start Now for Free
                </button>
              )
            ) : (
              /* Signed in: Profile popover */
              <Popover>
                <PopoverTrigger asChild>
                  {collapsed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="w-8 h-8 rounded-full overflow-hidden border border-border hover:ring-2 hover:ring-primary/40 transition-all mx-auto block">
                          {profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                              <span className="text-[10px] font-bold text-primary">
                                {(profile?.username || "U").slice(0, 2).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right">Profile</TooltipContent>
                    </Tooltip>
                  ) : (
                    <button className="flex items-center gap-2.5 w-full rounded-lg px-2.5 py-2 text-sm text-muted-foreground/70 hover:text-foreground hover:bg-white/[0.04] transition-colors">
                      <div className="w-7 h-7 rounded-full overflow-hidden border border-border shrink-0">
                        {profile?.avatar_url ? (
                          <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                            <span className="text-[9px] font-bold text-primary">
                              {(profile?.username || "U").slice(0, 2).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <span className="truncate flex-1 text-left font-medium">{profile?.username || "Creator"}</span>
                    </button>
                  )}
                </PopoverTrigger>
                <PopoverContent side="right" align="end" sideOffset={8} className="w-72 p-0 bg-[#0F1115] border-border/50 rounded-2xl overflow-hidden shadow-2xl shadow-black/60">
                  {/* Back to dashboard link */}
                  <div className="px-4 py-3 border-b border-border/30">
                    <button
                      onClick={() => navigate("/")}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      <span>Go to Dashboard</span>
                    </button>
                  </div>

                  {/* User identity + tier badge */}
                  <div className="px-4 py-3 border-b border-border/30">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg overflow-hidden border border-border shrink-0 bg-primary/20 flex items-center justify-center">
                        {profile?.avatar_url ? (
                          <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs font-bold text-primary">
                            {(profile?.username || "U").slice(0, 1).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-semibold text-foreground truncate">{profile?.username || "Creator"}</span>
                      {(() => {
                        const tier = plan;
                        if (tier === 'agency') return <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">Agency</span>;
                        if (tier === 'creator') return <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-primary/20 text-primary border border-primary/30">Pro</span>;
                        if (tier === 'basic') return <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Basic</span>;
                        return <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">Free</span>;
                      })()}
                    </div>
                  </div>

                  {/* Credit wallet with progress bar */}
                  <div className="px-4 py-3 border-b border-border/30 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">Credits</span>
                      <button
                        onClick={() => navigate("/pricing")}
                        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <span className="font-bold text-foreground tabular-nums">
                          {isLoadingCredits ? "…" : creditBalance.toLocaleString()}
                        </span>
                        <span className="text-muted-foreground">left</span>
                        <ChevRight className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    </div>
                    {/* Progress bar */}
                    {!isLoadingCredits && (
                      <>
                        <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary transition-all duration-500"
                            style={{ width: `${Math.min(100, (creditBalance / Math.max(creditBalance, 100)) * 100)}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                          {plan && plan !== 'browser'
                            ? "Using subscription credits"
                            : "Using free credits"}
                        </p>
                      </>
                    )}
                  </div>

                  {/* Get free credits */}
                  <div className="px-4 py-2.5 border-b border-border/30">
                    <button
                      onClick={() => navigate("/pricing")}
                      className="flex items-center gap-2.5 text-sm text-primary hover:text-primary/80 transition-colors font-medium"
                    >
                      <Gift className="h-4 w-4" />
                      <span>Get free credits</span>
                    </button>
                  </div>

                  {/* Nav links */}
                  <div className="py-1.5">
                    {[
                      { icon: User, label: "My Profile", path: "/profile" },
                      { icon: Settings, label: "Settings", path: "/settings" },
                      { icon: CreditCard, label: "Billing", path: "/pricing" },
                    ].map(item => (
                      <button
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition-colors"
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Sign out */}
                  <div className="border-t border-border/30 py-1.5">
                    <button
                      onClick={() => signOut()}
                      className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>
      </motion.aside>
    </TooltipProvider>
  );
}
