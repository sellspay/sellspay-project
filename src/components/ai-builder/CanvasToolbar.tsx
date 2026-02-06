import { 
  Code2, Eye, Monitor, Smartphone, 
  Undo2, Redo2, ChevronDown
} from 'lucide-react';
import sellspayLogo from '@/assets/sellspay-s-logo-new.png';

interface CanvasToolbarProps {
  viewMode: 'preview' | 'code';
  setViewMode: (mode: 'preview' | 'code') => void;
  projectName?: string;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  deviceMode?: 'desktop' | 'mobile';
  setDeviceMode?: (mode: 'desktop' | 'mobile') => void;
}

export function CanvasToolbar({ 
  viewMode, 
  setViewMode, 
  projectName = "New Storefront",
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  deviceMode = 'desktop',
  setDeviceMode,
}: CanvasToolbarProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-zinc-900/95 border-b border-zinc-800/50 backdrop-blur-sm">
      
      {/* LEFT: Project Identity & History */}
      <div className="flex items-center gap-3">
        {/* Project Name Dropdown */}
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 transition-colors">
          <div className="w-5 h-5 rounded bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center">
            <img src={sellspayLogo} alt="" className="w-3.5 h-3.5 object-contain" />
          </div>
          <span className="text-sm font-medium text-zinc-200 max-w-[120px] truncate">
            {projectName}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
        </button>

        {/* Divider */}
        <div className="w-px h-5 bg-zinc-700/50" />

        {/* History Controls */}
        <div className="flex items-center gap-1">
          <button 
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button 
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* CENTER: The View Switcher (The "Lovable" Pill) */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-zinc-800/50 border border-zinc-700/30">
        {/* PREVIEW BUTTON (Primary) */}
        <button
          onClick={() => setViewMode('preview')}
          className={`
            flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-semibold transition-all
            ${viewMode === 'preview' 
              ? "bg-blue-600 text-white shadow-lg shadow-blue-900/30" 
              : "text-zinc-400 hover:text-white hover:bg-zinc-700/50"
            }
          `}
        >
          <Eye className="w-3.5 h-3.5" />
          Preview
        </button>

        {/* CODE BUTTON */}
        <button
          onClick={() => setViewMode('code')}
          className={`
            flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-semibold transition-all
            ${viewMode === 'code' 
              ? "bg-zinc-700 text-white" 
              : "text-zinc-400 hover:text-white hover:bg-zinc-700/50"
            }
          `}
        >
          <Code2 className="w-3.5 h-3.5" />
          Code
        </button>

        {/* Divider */}
        <div className="w-px h-5 bg-zinc-600/50 mx-1" />

        {/* Device Toggles */}
        <button 
          onClick={() => setDeviceMode?.('desktop')}
          className={`p-1.5 rounded-md transition-colors ${
            deviceMode === 'desktop' 
              ? 'text-zinc-200 bg-zinc-700/50' 
              : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700/30'
          }`}
          title="Desktop view"
        >
          <Monitor className="w-4 h-4" />
        </button>
        <button 
          onClick={() => setDeviceMode?.('mobile')}
          className={`p-1.5 rounded-md transition-colors ${
            deviceMode === 'mobile' 
              ? 'text-zinc-200 bg-zinc-700/50' 
              : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700/30'
          }`}
          title="Mobile view"
        >
          <Smartphone className="w-4 h-4" />
        </button>
      </div>

      {/* RIGHT: Browser Address Bar Simulation */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800/30 border border-zinc-700/30">
          <div className="w-3 h-3 rounded-full bg-green-500/80" />
          <span className="text-xs text-zinc-500 font-mono">/ai-builder</span>
        </div>
      </div>
    </div>
  );
}
