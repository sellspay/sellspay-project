import React, { useState } from "react";
import { X, Sparkles, RefreshCw } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface RegenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (tweak: string) => void;
  isGenerating?: boolean;
}

export function RegenerateModal({ isOpen, onClose, onConfirm, isGenerating }: RegenerateModalProps) {
  const [tweak, setTweak] = useState("");

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (tweak.trim()) {
      onConfirm(tweak);
      setTweak("");
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative animate-in zoom-in-95">
        
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
          disabled={isGenerating}
        >
          <X size={20} />
        </button>

        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-violet-500/10 rounded-lg text-violet-400">
              <RefreshCw size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Tweak Design</h3>
              <p className="text-xs text-zinc-400">Refine the current output with new instructions.</p>
            </div>
          </div>

          <Textarea
            value={tweak}
            onChange={(e) => setTweak(e.target.value)}
            placeholder="e.g. Make the background darker, add a pricing section, change the font to Inter..."
            className="w-full h-32 bg-zinc-950 border-zinc-800 rounded-xl text-sm text-white placeholder:text-zinc-500 focus:border-violet-500/50 resize-none mb-4"
            autoFocus
            disabled={isGenerating}
          />

          <div className="flex justify-end gap-2">
            <button 
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white transition-colors"
              disabled={isGenerating}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!tweak.trim() || isGenerating}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg shadow-violet-900/20 transition-all"
            >
              {isGenerating ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Sparkles size={14} />
              )}
              <span>{isGenerating ? "Regenerating..." : "Regenerate Site"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
