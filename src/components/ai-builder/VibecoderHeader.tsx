import { 
  ArrowLeft, ChevronDown, Eye, Code2, 
  Monitor, Smartphone, RefreshCw, ExternalLink, Loader2, Palette
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import sellspayLogo from "@/assets/sellspay-s-logo-new.png";
import type { ViewMode } from "./types/generation";

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
}: VibecoderHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="h-14 w-full bg-zinc-950 border-b border-zinc-800 flex items-center justify-between px-4 shrink-0">
      
      {/* LEFT: Exit & Project Identity */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/profile')}
          className="gap-2 text-zinc-400 hover:text-white hover:bg-zinc-800"
        >
          <ArrowLeft className="w-4 h-4" />
          Exit
        </Button>
        
        <div className="w-px h-5 bg-zinc-800" />
        
        {/* Project Selector */}
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors">
          <div className="w-5 h-5 rounded bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center">
            <img src={sellspayLogo} alt="" className="w-3.5 h-3.5 object-contain" />
          </div>
          <span className="text-sm font-medium text-zinc-200 max-w-[140px] truncate">
            {projectName}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
        </button>

        {isPublished && (
          <span className="text-xs px-2 py-0.5 bg-green-500/10 text-green-400 rounded-full border border-green-500/20">
            Live
          </span>
        )}
      </div>

      {/* CENTER: View Switcher + Device Toggles */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-4">
        {/* Preview/Code/Studio Pill */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-900 border border-zinc-800">
          <button
            onClick={() => setViewMode('preview')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'preview' 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" 
                : "text-zinc-400 hover:text-white hover:bg-zinc-800"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Preview
          </button>

          <button
            onClick={() => setViewMode('code')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'code' 
                ? "bg-zinc-700 text-white" 
                : "text-zinc-400 hover:text-white hover:bg-zinc-800"
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            Code
          </button>

          <button
            onClick={() => setViewMode('generation')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'generation' 
                ? "bg-amber-600 text-white shadow-lg shadow-amber-900/20" 
                : "text-zinc-400 hover:text-white hover:bg-zinc-800"
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            Studio
          </button>
        </div>

        {/* Device Toggles */}
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
      </div>

      {/* RIGHT: Address Bar & Actions */}
      <div className="flex items-center gap-3">
        {/* Address Bar with Refresh */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 w-48">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-xs text-zinc-500 font-mono">/ai-builder</span>
          <button 
            onClick={onRefresh}
            className="ml-auto p-1 rounded-md text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all active:rotate-180"
            title="Force Refresh Preview"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
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
      </div>
    </header>
  );
}
