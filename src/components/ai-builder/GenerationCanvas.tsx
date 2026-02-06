import React from "react";
import { 
  Loader2, RotateCcw, ThumbsUp, ThumbsDown, 
  ArrowRightCircle, Sparkles, Image as ImageIcon, Film 
} from "lucide-react";
import { motion } from "framer-motion";
import type { GeneratedAsset } from "./types/generation";

interface GenerationCanvasProps {
  mode?: 'image' | 'video';
  asset: GeneratedAsset | null;
  isLoading: boolean;
  onRetry: () => void;
  onUseInCanvas: () => void;
  onFeedback?: (rating: 'positive' | 'negative') => void;
}

export function GenerationCanvas({ 
  mode = 'image',
  asset, 
  isLoading, 
  onRetry, 
  onUseInCanvas,
  onFeedback 
}: GenerationCanvasProps) {
  
  // Mode-specific content
  const isVideoMode = mode === 'video';
  const emptyTitle = isVideoMode ? "Video Studio" : "Image Studio";
  const emptyDesc = isVideoMode 
    ? "Generate cinematic video clips with Kling AI, Luma Ray 2, or other video models."
    : "Create logos, hero images, and assets with Flux 1.1 Pro or Nano Banana.";
  const modelBadges = isVideoMode 
    ? [
        { name: 'Kling AI', color: 'pink' },
        { name: 'Luma Ray 2', color: 'cyan' },
        { name: 'MiniMax', color: 'violet' },
      ]
    : [
        { name: 'Flux 1.1 Pro', color: 'amber' },
        { name: 'Nano Banana', color: 'violet' },
        { name: 'Recraft v3', color: 'blue' },
      ];
  
  // 1. EMPTY STATE (No generation started yet)
  if (!asset && !isLoading) {
    return (
      <div className="h-full w-full bg-zinc-950/50 flex flex-col items-center justify-center text-zinc-500 select-none">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="p-8 bg-zinc-900 rounded-3xl border border-zinc-800 flex flex-col items-center gap-5 shadow-2xl"
        >
          <div className="flex gap-4 opacity-50">
            <div className={`p-3 rounded-2xl ${isVideoMode ? 'bg-pink-500/10' : 'bg-amber-500/10'}`}>
              {isVideoMode ? (
                <Film size={28} className="text-pink-400" />
              ) : (
                <ImageIcon size={28} className="text-amber-400" />
              )}
            </div>
          </div>
          <div className="text-center">
            <h3 className="text-xl font-semibold text-zinc-200 mb-2">{emptyTitle}</h3>
            <p className="text-sm text-zinc-500 max-w-[300px] leading-relaxed">
              {emptyDesc}
            </p>
          </div>
          <div className="flex gap-2 mt-2 flex-wrap justify-center">
            {modelBadges.map((badge) => (
              <span 
                key={badge.name}
                className={`text-[10px] px-2 py-1 bg-${badge.color}-500/10 text-${badge.color}-400 rounded-full border border-${badge.color}-500/20`}
              >
                {badge.name}
              </span>
            ))}
          </div>
          <p className="text-xs text-zinc-600 mt-4">
            Select a model below and describe what you want
          </p>
        </motion.div>
      </div>
    );
  }

  // 2. LOADING STATE
  if (isLoading) {
    return (
      <div className="h-full w-full bg-zinc-950 flex flex-col items-center justify-center gap-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative"
        >
          {/* Pulsing glow background */}
          <div className={`absolute inset-0 blur-3xl rounded-full scale-150 animate-pulse ${
            isVideoMode ? 'bg-pink-500/20' : 'bg-amber-500/20'
          }`} />
          
          {/* Spinner */}
          <div className="relative p-6 bg-zinc-900 rounded-3xl border border-zinc-800 shadow-2xl">
            <Loader2 size={48} className={isVideoMode ? "text-pink-400 animate-spin" : "text-amber-400 animate-spin"} />
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          <p className="text-lg font-medium text-zinc-300 animate-pulse">
            {isVideoMode ? 'Rendering video...' : 'Creating image...'}
          </p>
          <p className="text-sm text-zinc-500 mt-1">
            {isVideoMode ? 'This may take up to 60 seconds' : 'This may take a few seconds'}
          </p>
        </motion.div>
      </div>
    );
  }

  // 3. RESULT STATE (Asset displayed)
  return (
    <div className="h-full w-full bg-zinc-950 flex flex-col relative group p-8">
      
      {/* THE ASSET DISPLAY */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="flex-1 flex items-center justify-center overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50 relative shadow-2xl"
      >
        {asset?.type === 'image' ? (
          <img 
            src={asset.url} 
            alt="Generated" 
            className="max-h-full max-w-full object-contain shadow-lg rounded-lg" 
          />
        ) : (
          <video 
            src={asset?.url} 
            controls 
            autoPlay
            loop
            className="max-h-full max-w-full rounded-lg shadow-lg" 
          />
        )}
        
        {/* Type Badge */}
        <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-full border border-zinc-700/50">
          {asset?.type === 'image' ? (
            <ImageIcon size={14} className="text-amber-400" />
          ) : (
            <Film size={14} className="text-pink-400" />
          )}
          <span className="text-xs font-medium text-zinc-300 capitalize">{asset?.type}</span>
        </div>
      </motion.div>

      {/* THE ACTION TOOLBAR (Floating at bottom) */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 bg-zinc-900/95 backdrop-blur-md border border-zinc-700/50 rounded-2xl shadow-2xl shadow-black/40"
      >
        {/* Feedback Buttons */}
        <div className="flex gap-1 mr-2 border-r border-zinc-700/50 pr-3">
          <button 
            onClick={() => onFeedback?.('positive')}
            className="p-2.5 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-green-400 transition-all active:scale-95"
            title="Good result"
          >
            <ThumbsUp size={18} />
          </button>
          <button 
            onClick={() => onFeedback?.('negative')}
            className="p-2.5 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-red-400 transition-all active:scale-95"
            title="Bad result"
          >
            <ThumbsDown size={18} />
          </button>
        </div>

        {/* Retry Button */}
        <button 
          onClick={onRetry} 
          className="p-2.5 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-all flex items-center gap-2 active:scale-95"
        >
          <RotateCcw size={18} />
          <span className="text-sm font-medium">Retry</span>
        </button>

        {/* USE IN CANVAS BUTTON (The Hero) */}
        <button 
          onClick={onUseInCanvas}
          className="ml-2 py-2.5 px-5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold text-sm flex items-center gap-2.5 shadow-lg shadow-violet-900/30 transition-all hover:scale-105 active:scale-95"
        >
          <Sparkles size={16} />
          <span>Use in Canvas</span>
          <ArrowRightCircle size={16} />
        </button>
      </motion.div>
      
      {/* Prompt preview */}
      {asset?.prompt && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="absolute top-6 right-6 max-w-xs"
        >
          <div className="px-4 py-2.5 bg-black/60 backdrop-blur-sm rounded-xl border border-zinc-700/50">
            <p className="text-xs text-zinc-400 line-clamp-2">"{asset.prompt}"</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}