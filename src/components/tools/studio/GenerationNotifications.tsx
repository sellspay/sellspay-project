import { useState, useEffect, useCallback } from "react";
import { Bell, Image, Music, Video, X, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TOOL_GEN_END, type ToolGenDetail } from "@/utils/toolGenerationEvent";

interface Notification {
  id: string;
  toolId: string;
  toolName: string;
  success: boolean;
  timestamp: number;
  read: boolean;
  assetUrl?: string;
  assetType?: string;
}

interface GenerationNotificationsProps {
  collapsed: boolean;
  onNavigateToTool: (toolId: string, assetUrl?: string) => void;
}

const TYPE_ICON: Record<string, typeof Image> = {
  "image-generator": Image,
  "video-generator": Video,
  "sfx-generator": Music,
};

export function GenerationNotifications({ collapsed, onNavigateToTool }: GenerationNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<ToolGenDetail & { success: boolean; assetUrl?: string; assetType?: string }>).detail;
      const n: Notification = {
        id: `${Date.now()}-${Math.random()}`,
        toolId: detail.toolId,
        toolName: detail.toolName,
        success: detail.success,
        timestamp: Date.now(),
        read: false,
        assetUrl: detail.assetUrl,
        assetType: detail.assetType,
      };
      setNotifications(prev => [n, ...prev].slice(0, 50));
    };
    window.addEventListener(TOOL_GEN_END, handler);
    return () => window.removeEventListener(TOOL_GEN_END, handler);
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => setNotifications([]), []);

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) markAllRead();
  };

  const formatTime = (ts: number) => {
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const bell = (
    <button
      className={cn(
        "relative flex items-center gap-2.5 w-full rounded-lg px-2.5 py-2 text-sm transition-colors",
        "text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06]",
        collapsed && "justify-center"
      )}
    >
      <div className="relative">
        <Bell className="h-4 w-4 shrink-0" />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1.5 -right-1.5 h-4 min-w-[16px] flex items-center justify-center rounded-full bg-cyan-500 text-[9px] font-bold text-black px-1"
            >
              {unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      {!collapsed && <span>Notifications</span>}
    </button>
  );

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      {collapsed ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>{bell}</PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent side="right">Notifications</TooltipContent>
        </Tooltip>
      ) : (
        <PopoverTrigger asChild>{bell}</PopoverTrigger>
      )}

      <PopoverContent
        side="right"
        align="end"
        sideOffset={8}
        className="w-80 p-0 bg-[#0e0e10] border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl shadow-black/60"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08]">
          <span className="text-sm font-bold text-white">Notifications</span>
          <div className="flex gap-1">
            {notifications.length > 0 && (
              <button onClick={clearAll} className="text-[10px] text-zinc-500 hover:text-zinc-300 px-2 py-1 rounded-md hover:bg-white/[0.06] transition-colors">
                Clear all
              </button>
            )}
            <button onClick={() => setOpen(false)} className="text-zinc-500 hover:text-white transition-colors p-1">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="py-10 text-center">
              <Bell className="h-6 w-6 mx-auto text-zinc-700 mb-2" />
              <p className="text-sm text-zinc-600">No notifications yet</p>
              <p className="text-[11px] text-zinc-700 mt-1">Completed generations will appear here</p>
            </div>
          ) : (
            notifications.map(n => {
              const Icon = TYPE_ICON[n.toolId] || Image;
              return (
                <button
                  key={n.id}
                  onClick={() => {
                    if (n.assetUrl) {
                      navigate(`/studio/${n.toolId}`, { state: { viewAssetUrl: n.assetUrl, viewAssetType: n.assetType } });
                    } else {
                      onNavigateToTool(n.toolId);
                    }
                    setOpen(false);
                  }}
                  className="flex items-start gap-3 w-full px-4 py-3 hover:bg-white/[0.04] transition-colors text-left group"
                >
                  <div className={cn(
                    "mt-0.5 h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                    n.success
                      ? "bg-cyan-500/10 text-cyan-400"
                      : "bg-red-500/10 text-red-400"
                  )}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-zinc-200 font-medium truncate">
                      {n.toolName} {n.success ? "completed" : "failed"}
                    </p>
                    <p className="text-[11px] text-zinc-600 mt-0.5">{formatTime(n.timestamp)}</p>
                  </div>
                  <ExternalLink className="h-3 w-3 text-zinc-700 group-hover:text-zinc-400 mt-1.5 shrink-0 transition-colors" />
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}