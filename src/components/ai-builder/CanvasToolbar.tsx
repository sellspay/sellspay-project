import { 
  Code2, Eye, Monitor, Smartphone, Tablet,
  RefreshCw, Image, Video, Settings, ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import sellspayLogo from '@/assets/sellspay-s-logo-new.png';
import { cn } from '@/lib/utils';

export type ViewMode = 'preview' | 'code' | 'image' | 'video';
export type DeviceMode = 'desktop' | 'tablet' | 'mobile';

interface CanvasToolbarProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  deviceMode: DeviceMode;
  setDeviceMode: (mode: DeviceMode) => void;
  onRefresh: () => void;
  onExit?: () => void;
  onTweak?: () => void;
  onPublish?: () => void;
  isPublishing?: boolean;
}

export function CanvasToolbar({ 
  viewMode, 
  setViewMode, 
  deviceMode,
  setDeviceMode,
  onRefresh,
  onExit,
  onTweak,
  onPublish,
  isPublishing = false,
}: CanvasToolbarProps) {
  
  const tabs = [
    { id: 'preview' as ViewMode, label: 'Preview', icon: Eye },
    { id: 'code' as ViewMode, label: 'Code', icon: Code2 },
    { id: 'image' as ViewMode, label: 'Image', icon: Image },
    { id: 'video' as ViewMode, label: 'Video', icon: Video },
  ];
  
  return (
    <div className="flex items-center justify-between h-14 px-4 bg-zinc-900/95 border-b border-zinc-800/50 backdrop-blur-sm">
      
      {/* LEFT: Exit button */}
      <div className="flex items-center gap-3 min-w-[140px]">
        {onExit && (
          <button
            onClick={onExit}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Exit</span>
          </button>
        )}
      </div>

      {/* CENTER: Tab Switcher + Device Toggles */}
      <div className="flex items-center gap-2">
        {/* Tab Pills */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-800/60 border border-zinc-700/40">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setViewMode(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all",
                viewMode === tab.id
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-900/30"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-700/50"
              )}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-zinc-700/50" />

        {/* Device Toggles */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-zinc-800/40 border border-zinc-700/30">
          <button 
            onClick={() => setDeviceMode('desktop')}
            className={cn(
              "p-1.5 rounded-md transition-colors",
              deviceMode === 'desktop' 
                ? 'text-zinc-200 bg-zinc-700/60' 
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700/30'
            )}
            title="Desktop view"
          >
            <Monitor size={16} />
          </button>
          <button 
            onClick={() => setDeviceMode('tablet')}
            className={cn(
              "p-1.5 rounded-md transition-colors",
              deviceMode === 'tablet' 
                ? 'text-zinc-200 bg-zinc-700/60' 
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700/30'
            )}
            title="Tablet view"
          >
            <Tablet size={16} />
          </button>
          <button 
            onClick={() => setDeviceMode('mobile')}
            className={cn(
              "p-1.5 rounded-md transition-colors",
              deviceMode === 'mobile' 
                ? 'text-zinc-200 bg-zinc-700/60' 
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700/30'
            )}
            title="Mobile view"
          >
            <Smartphone size={16} />
          </button>
        </div>
      </div>

      {/* RIGHT: Home indicator + Tweak + Publish */}
      <div className="flex items-center gap-3 min-w-[140px] justify-end">
        {/* Home indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800/30 border border-zinc-700/30">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-zinc-500">Home</span>
        </div>

        {/* Refresh */}
        <button 
          onClick={onRefresh}
          className="p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all active:rotate-180"
          title="Refresh Preview"
        >
          <RefreshCw size={16} />
        </button>

        {/* Tweak button */}
        {onTweak && (
          <Button
            variant="outline"
            size="sm"
            onClick={onTweak}
            className="gap-2 text-xs border-zinc-700 hover:bg-zinc-800"
          >
            <Settings size={14} />
            Tweak
          </Button>
        )}

        {/* Publish button */}
        {onPublish && (
          <Button
            size="sm"
            onClick={onPublish}
            disabled={isPublishing}
            className="gap-2 text-xs bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 border-0"
          >
            {isPublishing ? 'Publishing...' : 'Publish'}
          </Button>
        )}
      </div>
    </div>
  );
}
