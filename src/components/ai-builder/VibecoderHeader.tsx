import { 
  ArrowLeft, Eye, Code2, 
  Monitor, Smartphone, ExternalLink, Loader2,
  Image as ImageIcon, Film
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import type { ViewMode } from "./types/generation";
import { ProfileMenu } from "./ProfileMenu";
import { PageNavigator } from "./PageNavigator";

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
  isEmpty: boolean;
  username?: string | null;
  // Page navigation props
  currentPath?: string;
  onNavigate?: (path: string) => void;
  // Profile menu props
  avatarUrl?: string | null;
  userCredits?: number;
  subscriptionTier?: string | null;
  onSignOut?: () => void;
}

// Tab button component for the view switcher
function TabButton({ 
  mode, 
  icon: Icon, 
  label, 
  isActive, 
  onClick,
  activeClass = "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
}: { 
  mode: ViewMode; 
  icon: React.ElementType; 
  label: string; 
  isActive: boolean; 
  onClick: () => void;
  activeClass?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
        isActive 
          ? activeClass 
          : "text-zinc-400 hover:text-white hover:bg-zinc-800"
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}

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
  isEmpty,
  username,
  currentPath = "/",
  onNavigate,
  avatarUrl,
  userCredits = 0,
  subscriptionTier,
  onSignOut,
}: VibecoderHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="h-14 w-full bg-zinc-950 border-b border-zinc-800 flex items-center justify-between px-4 shrink-0">
      
      {/* LEFT: Exit Button Only */}
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

      {/* CENTER: 4-Mode View Switcher */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-4">
        {/* Preview/Code/Image/Video Pill */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-900 border border-zinc-800">
          {/* Builder Group */}
          <TabButton
            mode="preview"
            icon={Eye}
            label="Preview"
            isActive={viewMode === 'preview'}
            onClick={() => setViewMode('preview')}
            activeClass="bg-blue-600 text-white shadow-lg shadow-blue-900/20"
          />

          <TabButton
            mode="code"
            icon={Code2}
            label="Code"
            isActive={viewMode === 'code'}
            onClick={() => setViewMode('code')}
            activeClass="bg-zinc-700 text-white"
          />

          {/* Divider */}
          <div className="w-px h-4 bg-zinc-700 mx-1" />

          {/* Creative Studio Group */}
          <TabButton
            mode="image"
            icon={ImageIcon}
            label="Image"
            isActive={viewMode === 'image'}
            onClick={() => setViewMode('image')}
            activeClass="bg-amber-600 text-white shadow-lg shadow-amber-900/20"
          />

          <TabButton
            mode="video"
            icon={Film}
            label="Video"
            isActive={viewMode === 'video'}
            onClick={() => setViewMode('video')}
            activeClass="bg-pink-600 text-white shadow-lg shadow-pink-900/20"
          />
        </div>

        {/* Device Toggles (only show for preview mode) */}
        {viewMode === 'preview' && (
          <div className="flex items-center gap-0.5 p-1 rounded-lg bg-zinc-900 border border-zinc-800">
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
            onNavigate={onNavigate} 
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
          disabled={isEmpty || isPublishing}
          className="gap-2 bg-blue-600 hover:bg-blue-500 text-white"
        >
          {isPublishing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
          {isPublished ? 'Update' : 'Publish'}
        </Button>

        {/* Visual Divider */}
        <div className="w-px h-6 bg-zinc-800" />

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