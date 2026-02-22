import { useState } from "react";
import { Palette, Sparkles, ArrowLeft, Check } from "lucide-react";
import { motion } from "framer-motion";
import { STYLE_PRESETS, type StylePreset } from "./stylePresets";
import { cn } from "@/lib/utils";

type DesignView = 'home' | 'themes' | 'visual-edits';

interface DesignPanelProps {
  activeStyle?: StylePreset;
  onStyleChange?: (style: StylePreset) => void;
}

// Color dot row for a style preset
function StyleDots({ style }: { style: StylePreset }) {
  if (style.id === 'none') return null;
  const colors = [
    style.colors.primary,
    style.colors.accent,
    style.colors.background,
    style.colors.surface,
    style.colors.text,
  ];
  return (
    <div className="flex items-center gap-1">
      {colors.map((c, i) => (
        <div
          key={i}
          className="w-4 h-4 rounded-full border border-white/10"
          style={{ backgroundColor: c }}
        />
      ))}
    </div>
  );
}

export function DesignPanel({ activeStyle, onStyleChange }: DesignPanelProps) {
  const [view, setView] = useState<DesignView>('home');
  const currentStyle = activeStyle ?? STYLE_PRESETS[0];

  if (view === 'themes') {
    return (
      <div className="h-full flex flex-col bg-[#0f0f0f] overflow-y-auto custom-scrollbar">
        <div className="p-6 space-y-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView('home')}
              className="text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-zinc-500">Design /</span>
            <span className="text-sm font-semibold text-zinc-200">Themes</span>
          </div>

          {/* Current theme */}
          <div className="space-y-2">
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Current theme</p>
            <div className="px-4 py-3 rounded-xl border-2 border-blue-500/40 bg-blue-500/5">
              <div className="flex items-center gap-3">
                <StyleDots style={currentStyle} />
                <span className="text-sm font-medium text-zinc-200">
                  {currentStyle.name}
                </span>
              </div>
            </div>
          </div>

          {/* All themes */}
          <div className="space-y-2">
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Available themes</p>
            <div className="space-y-2">
              {STYLE_PRESETS.map((style) => {
                const isActive = currentStyle.id === style.id;
                return (
                  <motion.button
                    key={style.id}
                    onClick={() => onStyleChange?.(style)}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className={cn(
                      "w-full px-4 py-3 rounded-xl text-left transition-colors flex items-center justify-between",
                      isActive
                        ? "bg-zinc-800 border border-zinc-600"
                        : "bg-zinc-900/60 border border-zinc-800/50 hover:bg-zinc-800/60 hover:border-zinc-700/50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <StyleDots style={style} />
                      <div>
                        <p className="text-sm font-medium text-zinc-200">{style.name}</p>
                        <p className="text-[11px] text-zinc-500">{style.description}</p>
                      </div>
                    </div>
                    {isActive && <Check className="w-4 h-4 text-blue-400 shrink-0" />}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'visual-edits') {
    return (
      <div className="h-full flex flex-col bg-[#0f0f0f] items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center px-6">
          <button
            onClick={() => setView('home')}
            className="absolute top-6 left-6 text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="text-zinc-500 mb-2">
            <Sparkles className="w-10 h-10" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-200">Visual edits</h3>
          <p className="text-sm text-zinc-500 max-w-xs">
            Select an element to edit it
          </p>
          <p className="text-xs text-zinc-600 font-mono">
            Hold <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-400">Ctrl</kbd> to select multiple elements
          </p>
        </div>
      </div>
    );
  }

  // Home view
  return (
    <div className="h-full flex flex-col bg-[#0f0f0f]">
      <div className="p-6 space-y-4">
        <h2 className="text-sm font-semibold text-zinc-200">Design</h2>

        <div className="grid grid-cols-2 gap-3">
          {/* Themes card */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setView('themes')}
            className="flex flex-col items-start gap-3 p-4 rounded-xl bg-zinc-900/80 border border-zinc-800/50 hover:border-zinc-700/60 transition-colors text-left"
          >
            <Palette className="w-5 h-5 text-zinc-400" />
            <div>
              <p className="text-sm font-semibold text-zinc-200">Themes</p>
              <p className="text-[11px] text-zinc-500 leading-relaxed mt-0.5">
                Browse and apply themes to your project
              </p>
            </div>
            <span className="text-zinc-600 text-xs">›</span>
          </motion.button>

          {/* Visual Edits card */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setView('visual-edits')}
            className="flex flex-col items-start gap-3 p-4 rounded-xl bg-zinc-900/80 border border-zinc-800/50 hover:border-zinc-700/60 transition-colors text-left"
          >
            <Sparkles className="w-5 h-5 text-zinc-400" />
            <div>
              <p className="text-sm font-semibold text-zinc-200">Visual edits</p>
              <p className="text-[11px] text-zinc-500 leading-relaxed mt-0.5">
                Select elements to edit and style visually
              </p>
            </div>
            <span className="text-zinc-600 text-xs">›</span>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
