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
        "group/tool flex items-center w-full transition-colors duration-150 relative",
        collapsed
          ? cn(
              "justify-center rounded-xl p-1",
              isActive
                ? "bg-[#1e3a8a]/30 shadow-[0_0_0_1px_#3b82f6,0_0_12px_rgba(59,130,246,0.2)]"
                : "hover:bg-white/[0.06]"
            )
          : cn(
              "gap-2 rounded-full px-2 py-1.5 text-[13px]",
              isActive
                ? "bg-[#1e3a8a]/30 text-[#f4f4f5] font-medium shadow-[0_0_0_1px_#3b82f6,0_0_12px_rgba(59,130,246,0.2)] border border-[#3b82f6]"
                : "text-[#a1a1aa] hover:text-[#f4f4f5] hover:bg-white/[0.06] border border-transparent"
            )
      )}
    >
      {/* Drag handle - only this element is draggable */}
      {!collapsed && (
        <div
          {...attributes}
          {...listeners}
          className="shrink-0 cursor-grab active:cursor-grabbing p-0.5 rounded hover:bg-white/[0.06] transition-colors touch-none"
        >
          <GripVertical className="h-3.5 w-3.5 opacity-30 group-hover/tool:opacity-70 transition-opacity text-[#71717a]" />
        </div>
      )}

      {/* Click area for selecting */}
      <button
        onClick={(e) => { e.stopPropagation(); onToolSelect(tool.id); }}
        className={cn(
          "flex items-center gap-2 min-w-0 cursor-pointer",
          collapsed ? "justify-center" : "flex-1"
        )}
      >
        <div className={cn(
          "rounded-full overflow-hidden shrink-0 border pointer-events-none",
          collapsed ? "h-9 w-9" : "h-11 w-11",
          isActive ? "border-[#3b82f6]/50 ring-2 ring-[#3b82f6]/20" : "border-white/[0.08]"
        )}>
          {thumbnail ? (
            <img src={thumbnail} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className={cn(
              "w-full h-full flex items-center justify-center",
              isActive ? "bg-[#3b82f6]/20" : "bg-white/[0.06]"
            )}>
              <Icon className={cn("h-5 w-5", isActive ? "text-[#3b82f6]" : "text-[#9ca3af]")} />
            </div>
          )}
        </div>
        {!collapsed && (
          <span className="truncate flex-1 text-left">{tool.name}</span>
        )}
        {!collapsed && tool.comingSoon && (
          <span className="text-[8px] text-[#9ca3af] uppercase font-bold shrink-0">Soon</span>
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
  onOpenPricing?: () => void;
}

// Default 10 most popular/useful tools shown pinned
const DEFAULT_PINNED = [
  "image-generator",
  "sfx-generator",
  "voice-isolator",
  "music-splitter",
  "audio-cutter",
  "audio-joiner",
  "audio-recorder",
  "audio-converter",
  "video-to-audio",
  "waveform-generator",
];

const PINNED_TOOLS_STORAGE_KEY = "studio-pinned-tools-v2";
const PINNED_TOOLS_VERSION_KEY = "studio-pinned-tools-version";
const PINNED_TOOLS_VERSION = "popular-10-v1";

export function StudioSidebar({
  collapsed, onToggleCollapse, activeSection, onSectionChange,
  creditBalance, isLoadingCredits, activeTool, onToolSelect, onGoHome, onOpenPricing,
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
      const savedVersion = localStorage.getItem(PINNED_TOOLS_VERSION_KEY);
      const saved = localStorage.getItem(PINNED_TOOLS_STORAGE_KEY);
      if (savedVersion === PINNED_TOOLS_VERSION && saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_PINNED;
      }
    } catch {}
    return DEFAULT_PINNED;
  });

  useEffect(() => {
    try {
      const savedVersion = localStorage.getItem(PINNED_TOOLS_VERSION_KEY);
      if (savedVersion !== PINNED_TOOLS_VERSION) {
        setPinnedToolIds(DEFAULT_PINNED);
        localStorage.removeItem("studio-pinned-tools");
        localStorage.setItem(PINNED_TOOLS_STORAGE_KEY, JSON.stringify(DEFAULT_PINNED));
        localStorage.setItem(PINNED_TOOLS_VERSION_KEY, PINNED_TOOLS_VERSION);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(PINNED_TOOLS_STORAGE_KEY, JSON.stringify(pinnedToolIds));
      localStorage.setItem(PINNED_TOOLS_VERSION_KEY, PINNED_TOOLS_VERSION);
    } catch {}
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
        <aside className="h-full w-full bg-[hsl(var(--studio-surface))] overflow-hidden flex flex-col">
              {/* All Tools button */}
              <div className="shrink-0 px-2 pb-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={onGoHome}
                      className={cn(
                        "flex items-center gap-2.5 w-full rounded-full px-3 py-2.5 text-sm font-semibold btn-premium text-white",
                        collapsed && "justify-center rounded-xl px-2"
                      )}
                    >
                      <Home className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>All Tools</span>}
                    </button>
                  </TooltipTrigger>
                  {collapsed && <TooltipContent side="right">All Tools</TooltipContent>}
                </Tooltip>
              </div>

              {!collapsed && (
                <div className="shrink-0 px-4 pt-3 pb-1 flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-[#9ca3af] uppercase tracking-widest">Pinned</span>
                </div>
              )}
              {collapsed && <div className="h-px bg-white/[0.06] mx-2 my-1" />}

              {/* Add Tools button */}
              <div className="shrink-0 px-2 pb-1">
                <Popover open={addToolsOpen} onOpenChange={setAddToolsOpen}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <PopoverTrigger asChild>
                        <button
                          className={cn(
                            "flex items-center gap-2.5 w-full rounded-full px-3 py-2 text-sm transition-all duration-150",
                            "text-[#a1a1aa] hover:text-[#f4f4f5] hover:bg-white/[0.06]",
                            collapsed && "justify-center px-2"
                          )}
                        >
                          <div className="h-6 w-6 rounded-full border-2 border-dashed border-white/[0.12] flex items-center justify-center shrink-0">
                            <Plus className="h-3 w-3 text-[#9ca3af]" />
                          </div>
                          {!collapsed && <span>Add Tools</span>}
                        </button>
                      </PopoverTrigger>
                    </TooltipTrigger>
                    {collapsed && <TooltipContent side="right">Add Tools</TooltipContent>}
                  </Tooltip>
                  <PopoverContent side="right" align="start" sideOffset={8} className="w-[540px] p-0 bg-[#0e0e10] border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl shadow-black/60">
                    <div className="px-4 py-3 border-b border-white/[0.08] flex items-center justify-between bg-[#0e0e10]">
                      <span className="text-sm font-bold text-white">Add Tools</span>
                      <button onClick={() => setAddToolsOpen(false)} className="text-[#71717a] hover:text-white transition-colors">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-0 divide-x divide-white/[0.08] max-h-[460px] overflow-y-auto custom-scrollbar">
                      {categoryOrder.map(cat => {
                        const tools = toolsByCategory[cat];
                        if (!tools || tools.length === 0) return null;
                        return (
                          <div key={cat} className="p-3">
                             <div className="flex items-center gap-2 px-1 mb-2">
                              <span className="text-[10px] font-bold text-[#71717a] uppercase tracking-widest">
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
                                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/[0.06] group transition-colors"
                                  >
                                    <button
                                      type="button"
                                      onClick={() => {
                                        onToolSelect(tool.id);
                                        setAddToolsOpen(false);
                                      }}
                                      className="flex items-center gap-2 flex-1 min-w-0 text-left cursor-pointer"
                                    >
                                      <Icon className="h-3.5 w-3.5 text-[#3b82f6] shrink-0" />
                                      <span className="text-sm text-[#e4e4e7] flex-1 truncate">{tool.name}</span>
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
                                          ? "text-[#3b82f6] opacity-100"
                                          : "text-[#9ca3af] opacity-0 group-hover:opacity-100 hover:text-[#3b82f6]"
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

              <div className="shrink-0 border-t border-white/[0.06]">
                <div className="px-2 py-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => onSectionChange("assets")}
                         className={cn(
                          "flex items-center gap-2.5 w-full rounded-lg px-2.5 py-2 text-sm transition-colors",
                          "text-[#a1a1aa] hover:text-[#f4f4f5] hover:bg-white/[0.06]",
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
                    collapsed ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => navigate("/signup")}
                            className="flex items-center justify-center w-full px-2 py-1.5 rounded-lg btn-premium"
                          >
                            <Zap className="h-4 w-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="right">Start Now for Free</TooltipContent>
                      </Tooltip>
                    ) : (
                      <button
                        onClick={() => navigate("/signup")}
                        className="flex items-center justify-center gap-2 w-full px-3 py-2.5 rounded-lg btn-premium text-sm font-semibold"
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
                               <button className="w-8 h-8 rounded-full overflow-hidden border border-white/[0.08] hover:ring-2 hover:ring-[#3b82f6]/40 transition-all mx-auto block">
                                {profile?.avatar_url ? (
                                  <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                   <div className="w-full h-full bg-white/[0.06] flex items-center justify-center">
                                    <span className="text-[10px] font-bold text-[#3b82f6]">
                                      {(profile?.username || "U").slice(0, 2).toUpperCase()}
                                    </span>
                                  </div>
                                )}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="right">Profile</TooltipContent>
                          </Tooltip>
                        ) : (
                          <button className="flex items-center gap-2.5 w-full rounded-lg px-2.5 py-2 text-sm text-[#a1a1aa] hover:text-[#f4f4f5] hover:bg-white/[0.06] transition-colors">
                            <div className="w-7 h-7 rounded-full overflow-hidden border border-white/[0.08] shrink-0">
                              {profile?.avatar_url ? (
                                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-white/[0.06] flex items-center justify-center">
                                  <span className="text-[9px] font-bold text-[#3b82f6]">
                                    {(profile?.username || "U").slice(0, 2).toUpperCase()}
                                  </span>
                                </div>
                              )}
                            </div>
                            <span className="truncate flex-1 text-left font-medium text-[#f4f4f5]">{profile?.username || "Creator"}</span>
                          </button>
                        )}
                      </PopoverTrigger>
                      <PopoverContent side="right" align="end" sideOffset={8} className="w-72 p-0 bg-[#18181b] border-white/[0.06] rounded-2xl overflow-hidden shadow-xl">
                        <div className="px-4 py-3 border-b border-white/[0.06]">
                          <button
                            onClick={() => navigate("/")}
                            className="flex items-center gap-2 text-sm text-[#a1a1aa] hover:text-[#f4f4f5] transition-colors"
                          >
                            <ArrowLeft className="h-3.5 w-3.5" />
                            <span>Go to Dashboard</span>
                          </button>
                        </div>

                        <div className="px-4 py-3 border-b border-white/[0.06]">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/[0.08] shrink-0 bg-[#3b82f6]/10 flex items-center justify-center">
                              {profile?.avatar_url ? (
                                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-xs font-bold text-[#3b82f6]">
                                  {(profile?.username || "U").slice(0, 1).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <span className="text-sm font-semibold text-[#f4f4f5] truncate">{profile?.username || "Creator"}</span>
                            {(() => {
                              const tier = plan;
                              if (tier === 'agency') return <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">Agency</span>;
                              if (tier === 'creator') return <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-[#3b82f6]/10 text-[#3b82f6] border border-[#3b82f6]/20">Pro</span>;
                              if (tier === 'basic') return <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Basic</span>;
                              return <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-white/[0.06] text-[#71717a] border border-white/[0.06]">Free</span>;
                            })()}
                          </div>
                        </div>

                        <div className="px-4 py-3 border-b border-white/[0.06] space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-[#f4f4f5]">Credits</span>
                            <button
                              onClick={() => onOpenPricing?.()}
                              className="flex items-center gap-1 text-sm text-[#a1a1aa] hover:text-[#f4f4f5] transition-colors"
                            >
                              <span className="font-bold text-[#f4f4f5] tabular-nums">
                                {isLoadingCredits ? "…" : creditBalance.toLocaleString()}
                              </span>
                              <span className="text-[#71717a]">left</span>
                              <ChevRight className="h-3.5 w-3.5 text-[#71717a]" />
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

                        <div className="px-4 py-2.5 border-b border-white/[0.06]">
                          <button
                            onClick={() => setReferralOpen(true)}
                            className="flex items-center gap-2.5 text-sm text-[#3b82f6] hover:text-[#3b82f6]/80 transition-colors font-medium"
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
                              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-[#a1a1aa] hover:text-[#f4f4f5] hover:bg-white/[0.06] transition-colors"
                            >
                              <item.icon className="h-4 w-4" />
                              <span>{item.label}</span>
                            </button>
                          ))}
                        </div>

                        <div className="border-t border-white/[0.06] py-1.5">
                          <button
                            onClick={() => signOut()}
                            className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/5 transition-colors"
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
