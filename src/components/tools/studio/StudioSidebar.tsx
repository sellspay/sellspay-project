import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  ArrowLeft, Home, Sparkles, FolderOpen,
  User, Settings, CreditCard, LogOut, Zap, Gift, ChevronRight as ChevRight,
  PanelLeftClose, PanelLeft, GripVertical, Plus, X, Pin, PinOff,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { ReferralDialog } from "@/components/studio/ReferralDialog";
import { SignUpPromoDialog } from "@/components/tools/SignUpPromoDialog";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CreditSegmentBar } from "@/components/ui/CreditSegmentBar";
import { useAuth } from "@/lib/auth";
import { useSubscription } from "@/hooks/useSubscription";
import { toolsRegistry, SUBCATEGORY_LABELS, type ToolSubcategory } from "@/components/tools/toolsRegistry";
import { toolThumbnails } from "./toolThumbnails";
import sellspayLogo from "@/assets/sellspay-s-logo-new.png";


/* ── Sortable Tool Item ── */
interface SortableToolItemProps {
  tool: typeof toolsRegistry[number];
  isActive: boolean;
  collapsed: boolean;
  onToolSelect: (id: string) => void;
  thumbnail?: string;
}

function SortableToolItem({ tool, isActive, collapsed, onToolSelect, thumbnail }: SortableToolItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tool.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  const Icon = tool.icon;

  const content = (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group/tool flex items-center gap-2 w-full rounded-full px-2 py-1.5 text-[13px] transition-colors duration-150 relative",
        isActive
          ? "bg-[#1e3a8a]/30 text-[#f9fafb] font-medium shadow-[0_0_0_1px_#3b82f6,0_0_12px_rgba(59,130,246,0.2)] border border-[#3b82f6]"
          : "text-[#9ca3af] hover:text-[#f9fafb] hover:bg-[#1f2937]",
        collapsed && "justify-center rounded-xl"
      )}
    >
      {/* Drag handle - only this element is draggable */}
      {!collapsed && (
        <div
          {...attributes}
          {...listeners}
          className="shrink-0 cursor-grab active:cursor-grabbing p-0.5 rounded hover:bg-[#374151] transition-colors touch-none"
        >
          <GripVertical className="h-3.5 w-3.5 opacity-30 group-hover/tool:opacity-70 transition-opacity text-[#9ca3af]" />
        </div>
      )}

      {/* Click area for selecting */}
      <button
        onClick={(e) => { e.stopPropagation(); onToolSelect(tool.id); }}
        className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
      >
        <div className={cn(
          "h-7 w-7 rounded-full overflow-hidden shrink-0 border pointer-events-none",
          isActive ? "border-[#3b82f6]/50 ring-2 ring-[#3b82f6]/20" : "border-[#374151]"
        )}>
          {thumbnail ? (
            <img src={thumbnail} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className={cn(
              "w-full h-full flex items-center justify-center",
              isActive ? "bg-[#3b82f6]/20" : "bg-[#1f2937]"
            )}>
              <Icon className={cn("h-3.5 w-3.5", isActive ? "text-[#3b82f6]" : "text-[#6b7280]")} />
            </div>
            </div>
          )}
        </div>
        {!collapsed && (
          <span className="truncate flex-1 text-left">{tool.name}</span>
        )}
        {!collapsed && tool.comingSoon && (
          <span className="text-[8px] text-[#6b7280] uppercase font-bold shrink-0">Soon</span>
        )}
      </button>
    </div>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right">{tool.name}</TooltipContent>
      </Tooltip>
    );
  }

  return content;
}

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

// Default 10 most popular/useful tools shown pinned
const DEFAULT_PINNED = [
  "sfx-generator", "voice-isolator", "music-splitter", "sfx-isolator",
  "thumbnail-generator", "social-posts-pack", "short-form-script",
  "background-remover", "image-upscaler", "audio-cutter",
];

export function StudioSidebar({
  collapsed, onToggleCollapse, activeSection, onSectionChange,
  creditBalance, isLoadingCredits, activeTool, onToolSelect, onGoHome,
}: StudioSidebarProps) {
  const { user, profile, signOut } = useAuth();
  const { plan } = useSubscription();
  const navigate = useNavigate();
  const [referralOpen, setReferralOpen] = useState(false);
  const [addToolsOpen, setAddToolsOpen] = useState(false);
  const [showAuthPromo, setShowAuthPromo] = useState(false);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setPinnedToolIds(prev => {
        const oldIndex = prev.indexOf(active.id as string);
        const newIndex = prev.indexOf(over.id as string);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  }, []);
  
  // Pinned tools state with localStorage persistence
  const [pinnedToolIds, setPinnedToolIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("studio-pinned-tools");
      return saved ? JSON.parse(saved) : DEFAULT_PINNED;
    } catch { return DEFAULT_PINNED; }
  });

  useEffect(() => {
    try { localStorage.setItem("studio-pinned-tools", JSON.stringify(pinnedToolIds)); } catch {}
  }, [pinnedToolIds]);

  const allQuickTools = toolsRegistry.filter(t => t.category === "quick_tool" && t.isActive);
  const pinnedTools = pinnedToolIds
    .map(id => allQuickTools.find(t => t.id === id))
    .filter(Boolean) as typeof allQuickTools;
  const unpinnedTools = allQuickTools.filter(t => !pinnedToolIds.includes(t.id));

  const togglePin = (toolId: string) => {
    if (!user) {
      setShowAuthPromo(true);
      return;
    }
    setPinnedToolIds(prev =>
      prev.includes(toolId)
        ? prev.filter(id => id !== toolId)
        : [...prev, toolId]
    );
  };

  // Group tools by subcategory for the Add Tools popover
  const toolsByCategory = allQuickTools.reduce((acc, tool) => {
    const sub = tool.subcategory || "utility";
    if (!acc[sub]) acc[sub] = [];
    acc[sub].push(tool);
    return acc;
  }, {} as Record<string, typeof allQuickTools>);

  const categoryOrder: ToolSubcategory[] = ["media_creation", "social_content", "store_growth", "utility"];

  return (
    <>
      <TooltipProvider delayDuration={0}>
        <aside className="h-full w-full bg-[#0f172a] overflow-hidden flex flex-col border-r border-[#1f2937]">
              {/* All Tools button */}
              <div className="shrink-0 px-2 pb-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={onGoHome}
                      className={cn(
                        "flex items-center gap-2.5 w-full rounded-full px-3 py-2.5 text-sm transition-all duration-200",
                        !activeTool && activeSection === "home"
                          ? "bg-primary text-primary-foreground font-semibold shadow-md shadow-primary/25"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-transparent hover:border-border/50",
                        collapsed && "justify-center rounded-xl px-2"
                      )}
                    >
                      <div className={cn(
                        "h-6 w-6 rounded-md flex items-center justify-center shrink-0",
                        !activeTool && activeSection === "home"
                          ? "bg-primary-foreground/20"
                          : "bg-primary/10"
                      )}>
                        <Home className={cn(
                          "h-3.5 w-3.5",
                          !activeTool && activeSection === "home" ? "text-primary-foreground" : "text-primary"
                        )} />
                      </div>
                      {!collapsed && <span>All Tools</span>}
                    </button>
                  </TooltipTrigger>
                  {collapsed && <TooltipContent side="right">All Tools</TooltipContent>}
                </Tooltip>
              </div>

              {!collapsed && (
                <div className="shrink-0 px-4 pt-3 pb-1 flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-widest">Pinned</span>
                </div>
              )}
              {collapsed && <div className="h-px bg-border/40 mx-2 my-1" />}

              {/* Add Tools button */}
              <div className="shrink-0 px-2 pb-1">
                <Popover open={addToolsOpen} onOpenChange={setAddToolsOpen}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <PopoverTrigger asChild>
                        <button
                          className={cn(
                            "flex items-center gap-2.5 w-full rounded-full px-3 py-2 text-sm transition-all duration-150",
                            "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                            collapsed && "justify-center px-2"
                          )}
                        >
                          <div className="h-6 w-6 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center shrink-0">
                            <Plus className="h-3 w-3" />
                          </div>
                          {!collapsed && <span>Add Tools</span>}
                        </button>
                      </PopoverTrigger>
                    </TooltipTrigger>
                    {collapsed && <TooltipContent side="right">Add Tools</TooltipContent>}
                  </Tooltip>
                  <PopoverContent side="right" align="start" sideOffset={8} className="w-[540px] p-0 bg-background border-border rounded-2xl overflow-hidden shadow-xl">
                    <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
                      <span className="text-sm font-bold text-foreground">Add Tools</span>
                      <button onClick={() => setAddToolsOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-0 divide-x divide-border/30 max-h-[460px] overflow-y-auto custom-scrollbar">
                      {categoryOrder.map(cat => {
                        const tools = toolsByCategory[cat];
                        if (!tools || tools.length === 0) return null;
                        return (
                          <div key={cat} className="p-3">
                            <div className="flex items-center gap-2 px-1 mb-2">
                              <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                                {SUBCATEGORY_LABELS[cat]}
                              </span>
                            </div>
                            <div className="space-y-0.5">
                              {tools.map(tool => {
                                const Icon = tool.icon;
                                const isPinned = pinnedToolIds.includes(tool.id);
                                return (
                                  <div
                                    key={tool.id}
                                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted/50 group"
                                  >
                                    <button
                                      type="button"
                                      onClick={() => {
                                        onToolSelect(tool.id);
                                        setAddToolsOpen(false);
                                      }}
                                      className="flex items-center gap-2 flex-1 min-w-0 text-left cursor-pointer"
                                    >
                                      <Icon className="h-3.5 w-3.5 text-primary shrink-0" />
                                      <span className="text-sm text-foreground flex-1 truncate">{tool.name}</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        togglePin(tool.id);
                                      }}
                                      className={cn(
                                        "shrink-0 p-1 rounded-md transition-all",
                                        isPinned
                                          ? "text-primary opacity-100"
                                          : "text-muted-foreground/40 opacity-0 group-hover:opacity-100 hover:text-primary"
                                      )}
                                      title={isPinned ? "Unpin from sidebar" : "Pin to sidebar"}
                                    >
                                      {isPinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <nav className="flex-1 overflow-y-auto custom-scrollbar px-2 py-1 space-y-0.5">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext items={pinnedToolIds} strategy={verticalListSortingStrategy}>
                    {pinnedTools.map(tool => (
                      <SortableToolItem
                        key={tool.id}
                        tool={tool}
                        isActive={activeTool === tool.id || activeTool === tool.legacyRoute}
                        collapsed={collapsed}
                        onToolSelect={onToolSelect}
                        thumbnail={toolThumbnails[tool.id]}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              </nav>

              <div className="shrink-0 border-t border-border/50">
                <div className="px-2 py-2">
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
                        <div className="px-4 py-3 border-b border-border/50">
                          <button
                            onClick={() => navigate("/")}
                            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <ArrowLeft className="h-3.5 w-3.5" />
                            <span>Go to Dashboard</span>
                          </button>
                        </div>

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

                        <div className="px-4 py-2.5 border-b border-border/50">
                          <button
                            onClick={() => setReferralOpen(true)}
                            className="flex items-center gap-2.5 text-sm text-primary hover:text-primary/80 transition-colors font-medium"
                          >
                            <Gift className="h-4 w-4" />
                            <span>Get free credits</span>
                          </button>
                        </div>

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
        </aside>
      </TooltipProvider>

      <ReferralDialog open={referralOpen} onOpenChange={setReferralOpen} />
      <SignUpPromoDialog open={showAuthPromo} onOpenChange={setShowAuthPromo} />
    </>
  );
}
