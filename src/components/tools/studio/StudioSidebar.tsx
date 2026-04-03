import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  ArrowLeft, Home, Sparkles, ChevronDown, ChevronRight, FolderOpen,
  User, Settings, CreditCard, LogOut, Zap, Gift, ChevronRight as ChevRight,
  PanelLeftClose, PanelLeft,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { ReferralDialog } from "@/components/studio/ReferralDialog";
import { CreditSegmentBar } from "@/components/ui/CreditSegmentBar";
import { useAuth } from "@/lib/auth";
import { useSubscription } from "@/hooks/useSubscription";
import { toolsRegistry, SUBCATEGORY_LABELS, type ToolSubcategory } from "@/components/tools/toolsRegistry";
import { toolThumbnails } from "./toolThumbnails";
import sellspayLogo from "@/assets/sellspay-s-logo-new.png";

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
  const [referralOpen, setReferralOpen] = useState(false);

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const quickTools = toolsRegistry.filter(t => t.category === "quick_tool" && t.isActive);

  return (
    <>
    <TooltipProvider delayDuration={0}>
      <motion.aside
        className="h-full flex flex-col bg-background border-r border-border/60 overflow-hidden"
        animate={{ width: collapsed ? 56 : 220 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
      >
        {/* Logo + Brand */}
        <div className="shrink-0 px-3 pt-4 pb-2 flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => navigate("/")}
                className={cn(
                  "flex items-center gap-2.5 flex-1 rounded-lg px-2.5 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors",
                  collapsed && "justify-center"
                )}
              >
                <img src={sellspayLogo} alt="SellsPay" className="h-6 w-6 shrink-0" />
                {!collapsed && <span className="font-bold text-foreground tracking-tight">SellsPay</span>}
              </button>
            </TooltipTrigger>
            {collapsed && <TooltipContent side="right">Back to Home</TooltipContent>}
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onToggleCollapse}
                className="shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">{collapsed ? "Expand sidebar" : "Collapse sidebar"}</TooltipContent>
          </Tooltip>
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
                    ? "bg-primary text-primary-foreground font-medium shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                  collapsed && "justify-center"
                )}
              >
                <Home className="h-4 w-4 shrink-0" />
                {!collapsed && <span>All Tools</span>}
              </button>
            </TooltipTrigger>
            {collapsed && <TooltipContent side="right">All Tools</TooltipContent>}
          </Tooltip>
        </div>

        <div className="h-px bg-border/50 mx-3" />

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
                    className={cn(
                      "flex items-center gap-2 w-full rounded-lg px-2.5 py-2 text-[11px] font-bold uppercase tracking-widest transition-all duration-150",
                      isExpanded
                        ? "text-primary bg-primary/8"
                        : "text-foreground/70 hover:text-foreground hover:bg-muted/60"
                    )}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                    )}
                    {SUBCATEGORY_LABELS[subcat]}
                  </button>
                ) : (
                  <div className="h-px bg-border/30 mx-1 my-1.5" />
                )}

                {(isExpanded || collapsed) && (
                  <div className="space-y-0.5">
                    {tools.map(tool => {
                      const Icon = tool.icon;
                      const isActive = activeTool === tool.id || activeTool === tool.legacyRoute;
                      const thumb = toolThumbnails[tool.id];

                      const btn = (
                        <button
                          key={tool.id}
                          onClick={() => onToolSelect(tool.id)}
                          className={cn(
                            "flex items-center gap-2.5 w-full rounded-lg px-2 py-1.5 text-[13px] transition-all duration-150",
                            isActive
                              ? "bg-primary text-primary-foreground font-medium shadow-sm"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                            collapsed && "justify-center"
                          )}
                        >
                          {/* Colorful thumbnail circle */}
                          <div className={cn(
                            "h-7 w-7 rounded-full overflow-hidden shrink-0 border",
                            isActive ? "border-primary-foreground/30" : "border-border/60"
                          )}>
                            {thumb ? (
                              <img src={thumb} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className={cn(
                                "w-full h-full flex items-center justify-center",
                                isActive ? "bg-primary-foreground/20" : "bg-primary/10"
                              )}>
                                <Icon className={cn("h-3.5 w-3.5", isActive ? "text-primary-foreground" : "text-primary/60")} />
                              </div>
                            )}
                          </div>
                          {!collapsed && (
                            <span className="truncate flex-1 text-left">{tool.name}</span>
                          )}
                          {!collapsed && tool.isPro && (
                            <Sparkles className="h-3 w-3 text-primary shrink-0" />
                          )}
                          {!collapsed && tool.comingSoon && (
                            <span className="text-[8px] text-muted-foreground/50 uppercase font-bold shrink-0">Soon</span>
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

        {/* Bottom section */}
        <div className="shrink-0 border-t border-border/50">
          <div className="px-3 py-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onSectionChange("assets")}
                  className={cn(
                    "flex items-center gap-2.5 w-full rounded-lg px-2.5 py-2 text-sm transition-colors",
                    "text-muted-foreground hover:text-foreground hover:bg-muted/50",
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
            "px-3 py-3 border-t border-border/50",
            collapsed && "flex justify-center px-2"
          )}>
            {!user ? (
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
              <Popover>
                <PopoverTrigger asChild>
                  {collapsed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="w-8 h-8 rounded-full overflow-hidden border border-border hover:ring-2 hover:ring-primary/40 transition-all mx-auto block">
                          {profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-primary/10 flex items-center justify-center">
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
                    <button className="flex items-center gap-2.5 w-full rounded-lg px-2.5 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                      <div className="w-7 h-7 rounded-full overflow-hidden border border-border shrink-0">
                        {profile?.avatar_url ? (
                          <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                            <span className="text-[9px] font-bold text-primary">
                              {(profile?.username || "U").slice(0, 2).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <span className="truncate flex-1 text-left font-medium text-foreground">{profile?.username || "Creator"}</span>
                    </button>
                  )}
                </PopoverTrigger>
                <PopoverContent side="right" align="end" sideOffset={8} className="w-72 p-0 bg-background border-border rounded-2xl overflow-hidden shadow-xl">
                  {/* Back to dashboard */}
                  <div className="px-4 py-3 border-b border-border/50">
                    <button
                      onClick={() => navigate("/")}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      <span>Go to Dashboard</span>
                    </button>
                  </div>

                  {/* User identity */}
                  <div className="px-4 py-3 border-b border-border/50">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg overflow-hidden border border-border shrink-0 bg-primary/10 flex items-center justify-center">
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
                        if (tier === 'agency') return <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20">Agency</span>;
                        if (tier === 'creator') return <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">Pro</span>;
                        if (tier === 'basic') return <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">Basic</span>;
                        return <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">Free</span>;
                      })()}
                    </div>
                  </div>

                  {/* Credits */}
                  <div className="px-4 py-3 border-b border-border/50 space-y-2.5">
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
                    {!isLoadingCredits && (
                      <>
                        {(() => {
                          const maxCredits = plan === 'agency' ? 1500 : plan === 'creator' ? 500 : plan === 'basic' ? 100 : 5;
                          return (
                            <CreditSegmentBar
                              rollover={0}
                              monthly={creditBalance}
                              bonus={0}
                              total={creditBalance}
                              maxCredits={maxCredits}
                              showLegend
                            />
                          );
                        })()}
                      </>
                    )}
                  </div>

                  {/* Get free credits */}
                  <div className="px-4 py-2.5 border-b border-border/50">
                    <button
                      onClick={() => setReferralOpen(true)}
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
                      { icon: CreditCard, label: "Billing", path: "/billing" },
                    ].map(item => (
                      <button
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Sign out */}
                  <div className="border-t border-border/50 py-1.5">
                    <button
                      onClick={() => signOut()}
                      className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-destructive hover:bg-destructive/5 transition-colors"
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

    <ReferralDialog open={referralOpen} onOpenChange={setReferralOpen} />
    </>
  );
}
