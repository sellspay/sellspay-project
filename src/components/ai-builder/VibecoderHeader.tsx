import { useState } from "react";
import { 
  ArrowLeft, Eye, Code2, 
  Monitor, Smartphone, ExternalLink, Loader2,
  Image as ImageIcon, Film, Package, Crown
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import type { ViewMode } from "./types/generation";
import { ProfileMenu } from "./ProfileMenu";
import { PageNavigator, type SitePage } from "./PageNavigator";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface VibecoderHeaderProps {
  projectName?: string;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  deviceMode: 'desktop' | 'mobile';
  setDeviceMode: (mode: 'desktop' | 'mobile') => void;
  onRefresh: () => void;
  onPublish: () => void;
  isPublished: boolean;
  isPublishing: boolean;
  hasUnpublishedChanges?: boolean;
  isEmpty: boolean;
  username?: string | null;
  // Page navigation props
  currentPath?: string;
  onNavigate?: (path: string) => void;
  pages?: SitePage[];
  // Profile menu props
  avatarUrl?: string | null;
  userCredits?: number;
  subscriptionTier?: string | null;
  onSignOut?: () => void;
}

// Tab config for the icon pill switcher
const TAB_CONFIG: { mode: ViewMode; icon: React.ElementType; label: string; activeColor: string }[] = [
  { mode: 'preview', icon: Eye, label: 'Preview', activeColor: 'bg-blue-600 text-white shadow-lg shadow-blue-900/30' },
  { mode: 'code', icon: Code2, label: 'Code', activeColor: 'bg-zinc-700 text-white' },
  { mode: 'image', icon: ImageIcon, label: 'Image', activeColor: 'bg-amber-600 text-white shadow-lg shadow-amber-900/30' },
  { mode: 'video', icon: Film, label: 'Video', activeColor: 'bg-pink-600 text-white shadow-lg shadow-pink-900/30' },
  { mode: 'products', icon: Package, label: 'Products', activeColor: 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30' },
  { mode: 'subscriptions', icon: Crown, label: 'Subs', activeColor: 'bg-violet-600 text-white shadow-lg shadow-violet-900/30' },
];

export function VibecoderHeader({ 
  projectName = "New Storefront",
  viewMode,
  setViewMode,
  deviceMode,
  setDeviceMode,
  onRefresh,
  onPublish,
  isPublished,
  isPublishing,
  hasUnpublishedChanges = false,
  isEmpty,
  username,
  currentPath = "/",
  onNavigate,
  pages = [{ id: 'home', path: '/', label: 'Home' }],
  avatarUrl,
  userCredits = 0,
  subscriptionTier,
  onSignOut,
}: VibecoderHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="h-12 bg-black/40 backdrop-blur-xl border-b border-white/[0.06] flex items-center justify-between px-4 shrink-0 relative">

      {/* LEFT: Exit Button */}
      <div className="flex items-center">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/profile')}
          className="gap-2 text-zinc-400 hover:text-white hover:bg-zinc-800"
        >
          <ArrowLeft className="w-4 h-4" />
          Exit
        </Button>
      </div>

      {/* CENTER: Icon Pill Switcher */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3">
        <div className="flex items-center gap-0.5 p-1 rounded-xl bg-white/[0.04] border border-white/[0.06]">
          {TAB_CONFIG.map((tab, idx) => {
            const isActive = viewMode === tab.mode;
            const Icon = tab.icon;
            // Add dividers between groups: after Code (idx 1) and after Video (idx 3)
            const showDivider = idx === 2 || idx === 4;

            return (
              <div key={tab.mode} className="flex items-center">
                {showDivider && <div className="w-px h-4 bg-zinc-700 mx-0.5" />}
                <motion.button
                  onClick={() => setViewMode(tab.mode)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg transition-colors",
                    isActive
                      ? cn(tab.activeColor, "px-3 py-1.5")
                      : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 p-1.5"
                  )}
                  layout
                  transition={{ type: 'spring', stiffness: 500, damping: 35, mass: 0.8 }}
                  title={tab.label}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  {isActive && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="text-xs font-bold whitespace-nowrap overflow-hidden"
                    >
                      {tab.label}
                    </motion.span>
                  )}
                </motion.button>
              </div>
            );
          })}
        </div>

        {/* Device Toggles (only show for preview mode) */}
        {viewMode === 'preview' && (
          <div className="flex items-center gap-0.5 p-1 rounded-lg bg-white/[0.04] border border-white/[0.06]">
            <button 
              onClick={() => setDeviceMode('desktop')}
              className={`p-1.5 rounded-md transition-colors ${
                deviceMode === 'desktop' 
                  ? 'text-zinc-200 bg-zinc-700' 
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
              }`}
              title="Desktop view"
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setDeviceMode('mobile')}
              className={`p-1.5 rounded-md transition-colors ${
                deviceMode === 'mobile' 
                  ? 'text-zinc-200 bg-zinc-700' 
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
              }`}
              title="Mobile view"
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* RIGHT: Page Navigator & Actions */}
      <div className="flex items-center gap-3">
        {/* Page Navigator */}
        <div className="hidden lg:block">
          <PageNavigator 
            activePage={currentPath} 
            pages={pages}
            onNavigate={onNavigate || (() => {})} 
            onRefresh={onRefresh} 
          />
        </div>

        {/* View Live Button */}
        {isPublished && username && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(`/@${username}`, '_blank')}
            className="gap-1.5 border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-300"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            View Live
          </Button>
        )}

        {/* Publish Button */}
        <Button
          size="sm"
          onClick={onPublish}
          disabled={isEmpty || isPublishing || (isPublished && !hasUnpublishedChanges)}
          className={`gap-2 text-white ${
            isPublished && !hasUnpublishedChanges
              ? 'bg-emerald-600 hover:bg-emerald-600 cursor-default opacity-90'
              : 'bg-blue-600 hover:bg-blue-500'
          }`}
        >
          {isPublishing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isPublished && !hasUnpublishedChanges ? (
            <>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              Published
            </>
          ) : (
            <Eye className="w-4 h-4" />
          )}
          {(!isPublished || hasUnpublishedChanges) && !isPublishing && 'Publish'}
        </Button>

        {/* Visual Divider */}
        <div className="w-px h-5 bg-white/[0.08]" />

        {/* Profile Menu */}
        {onSignOut && (
          <ProfileMenu
            avatarUrl={avatarUrl}
            username={username}
            userCredits={userCredits}
            subscriptionTier={subscriptionTier}
            onSignOut={onSignOut}
          />
        )}
      </div>
    </header>
  );
}