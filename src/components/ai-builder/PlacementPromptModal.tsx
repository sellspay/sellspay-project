import React, { useState, forwardRef } from "react";
import { X, ArrowRight, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { GeneratedAsset } from "./types/generation";

interface PlacementPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (instructions: string) => void;
  asset: GeneratedAsset | null;
}

const QUICK_PLACEMENTS = [
  "Replace the main hero image",
  "Add as background for the header",
  "Use as a featured product image",
  "Place in the testimonials section",
];

export const PlacementPromptModal = forwardRef<HTMLDivElement, PlacementPromptModalProps>(
  function PlacementPromptModal(
    { isOpen, onClose, onSubmit, asset }: PlacementPromptModalProps,
    ref
  ) {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSubmit(input);
    setInput("");
  };

  const handleQuickPlacement = (placement: string) => {
    onSubmit(placement);
    setInput("");
  };

    return (
      <div ref={ref}>
        <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          {/* Modal Container */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button 
              onClick={onClose} 
              className="absolute top-4 right-4 p-1.5 text-zinc-500 hover:text-white bg-zinc-800/50 hover:bg-zinc-700 rounded-full transition-colors"
            >
              <X size={16} />
            </button>
            
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
              
              {/* Header with Thumbnail */}
              <div className="flex items-start gap-4">
                {asset?.url && (
                  <div className="shrink-0 w-20 h-20 rounded-xl border border-zinc-700 overflow-hidden bg-zinc-950 shadow-lg">
                    {asset.type === 'image' ? (
                      <img 
                        src={asset.url} 
                        alt="Asset preview" 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <video 
                        src={asset.url} 
                        className="w-full h-full object-cover"
                        muted
                      />
                    )}
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Sparkles size={18} className="text-violet-400" />
                    Where should this go?
                  </h3>
                  <p className="text-sm text-zinc-400 mt-1">
                    Describe the exact location on your canvas.
                  </p>
                </div>
              </div>

              {/* Quick Placements */}
              <div className="flex flex-wrap gap-2">
                {QUICK_PLACEMENTS.map((placement) => (
                  <button
                    key={placement}
                    type="button"
                    onClick={() => handleQuickPlacement(placement)}
                    className="px-3 py-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg border border-zinc-700 transition-colors"
                  >
                    {placement}
                  </button>
                ))}
              </div>

              {/* Input Field */}
              <textarea 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="e.g., Replace the main hero logo with this image..."
                className="w-full h-28 bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 resize-none transition-all"
                autoFocus
              />

              {/* Submit Button */}
              <button 
                type="submit"
                disabled={!input.trim()}
                className="w-full py-3.5 bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:cursor-not-allowed"
              >
                <span>Apply to Canvas</span>
                <ArrowRight size={16} />
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
        </AnimatePresence>
      </div>
    );
  }
);
PlacementPromptModal.displayName = 'PlacementPromptModal';
