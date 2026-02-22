import { useState, useEffect, useCallback } from "react";
import { Palette, Sparkles, ArrowLeft, MoreHorizontal } from "lucide-react";
import { motion } from "framer-motion";
import { STYLE_PRESETS, type StylePreset, type StyleColors } from "./stylePresets";
import { cn } from "@/lib/utils";
import { VisualEditPanel, type SelectedElement } from "./VisualEditOverlay";
import { ThemeEditorDialog } from "./ThemeEditorDialog";

type DesignView = 'home' | 'themes' | 'visual-edits';

interface DesignPanelProps {
  activeStyle?: StylePreset;
  onStyleChange?: (style: StylePreset) => void;
  onVisualEditModeChange?: (active: boolean) => void;
  selectedElement?: SelectedElement | null;
  onEditRequest?: (prompt: string) => void;
}

// Color dot row for a style preset
function StyleDots({ style }: { style: StylePreset }) {
  const colors = style.id === 'none'
    ? ['#333', '#555', '#000', '#1a1a1a', '#fff']
    : [style.colors.primary, style.colors.accent, style.colors.background, style.colors.card, style.colors.foreground];
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

export function DesignPanel({ activeStyle, onStyleChange, onVisualEditModeChange, selectedElement, onEditRequest }: DesignPanelProps) {
  const [view, setView] = useState<DesignView>('home');
  const [editingStyle, setEditingStyle] = useState<StylePreset | null>(null);
  const [originalColorsSnapshot, setOriginalColorsSnapshot] = useState<StyleColors | null>(null);
  const [extractedColors, setExtractedColors] = useState<StyleColors | null>(null);
  const currentStyle = activeStyle ?? STYLE_PRESETS[0];

  // Notify parent when visual edit mode changes
  useEffect(() => {
    onVisualEditModeChange?.(view === 'visual-edits');
  }, [view, onVisualEditModeChange]);

  // Listen for color extraction responses from the iframe
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const msg = event.data;
      if (!msg || msg.type !== 'VIBECODER_COLORS_EXTRACTED') return;
      setExtractedColors(msg.colors as StyleColors);
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  // Request color extraction from the iframe
  const requestColorExtraction = useCallback(() => {
    const iframe = document.querySelector('.sp-preview-iframe') as HTMLIFrameElement | null;
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage({ type: 'VIBECODER_EXTRACT_COLORS' }, '*');
    }
  }, []);

  // When editing a theme, use the CURRENTLY APPLIED colors (from activeStyle)
  // instead of the preset defaults, so user edits are preserved
  const handleEditStyle = useCallback((style: StylePreset) => {
    if (style.id === 'none') {
      // "Current Theme" — extract live colors from the iframe
      requestColorExtraction();
      const colorsToUse = extractedColors ?? currentStyle.colors;
      setOriginalColorsSnapshot({ ...colorsToUse });
      setEditingStyle({ ...style, colors: colorsToUse });
    } else {
      // For named presets: if this preset is the active one, use its APPLIED colors
      // (which may have been customized), not the original preset defaults
      const isCurrentlyActive = currentStyle.id === style.id;
      const colorsToUse = isCurrentlyActive ? currentStyle.colors : style.colors;
      setOriginalColorsSnapshot({ ...colorsToUse });
      setEditingStyle({ ...style, colors: colorsToUse });
    }
  }, [requestColorExtraction, extractedColors, currentStyle]);

  // Update editingStyle when extraction completes (if we're editing Current Theme)
  useEffect(() => {
    if (editingStyle?.id === 'none' && extractedColors) {
      setEditingStyle(prev => prev ? { ...prev, colors: extractedColors } : null);
    }
  }, [extractedColors, editingStyle?.id]);

  if (view === 'themes') {
    return (
      <div className="h-full flex flex-col bg-[#1a1a1a] overflow-y-auto custom-scrollbar">
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

          {/* Default themes label */}
          <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Default themes</p>

          {/* Theme list */}
          <div className="space-y-2">
            {STYLE_PRESETS.map((style) => {
              const isActive = currentStyle.id === style.id;
              return (
                <div
                  key={style.id}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors",
                    isActive
                      ? "bg-zinc-800 border border-zinc-600"
                      : "bg-zinc-900/60 border border-zinc-800/50"
                  )}
                >
                  <StyleDots style={style} />
                  <span className="text-sm font-medium text-zinc-200 flex-1 truncate">
                    {style.name}
                  </span>
                  {!isActive && (
                    <button
                      onClick={() => {
                        onStyleChange?.(style);
                        window.dispatchEvent(new CustomEvent('vibecoder-theme-apply', { detail: style.colors }));
                      }}
                      className="px-3 py-1 text-xs font-medium text-zinc-300 bg-zinc-700 hover:bg-zinc-600 rounded-md transition-colors shrink-0"
                    >
                      Apply
                    </button>
                  )}
                  <button
                    onClick={() => handleEditStyle(style)}
                    className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700 rounded-md transition-colors shrink-0"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Theme editor dialog */}
        {editingStyle && (
          <ThemeEditorDialog
            open={!!editingStyle}
            onClose={() => {
              // Revert to original snapshot (what was applied BEFORE opening editor)
              if (originalColorsSnapshot) {
                window.dispatchEvent(new CustomEvent('vibecoder-theme-apply', { detail: originalColorsSnapshot }));
              } else {
                window.dispatchEvent(new CustomEvent('vibecoder-theme-revert'));
              }
              setEditingStyle(null);
              setOriginalColorsSnapshot(null);
            }}
            style={editingStyle}
            onApply={(updated) => {
              onStyleChange?.(updated);
              window.dispatchEvent(new CustomEvent('vibecoder-theme-apply', { detail: updated.colors }));
              setEditingStyle(null);
              setOriginalColorsSnapshot(null);
            }}
            onLivePreview={(colors) => {
              // Dispatch custom DOM event — ThemeBridge (inside SandpackProvider) 
              // listens and updates files via useSandpack API
              window.dispatchEvent(new CustomEvent('vibecoder-theme-apply', { detail: colors }));
            }}
          />
        )}
      </div>
    );
  }

  if (view === 'visual-edits') {
    return (
      <VisualEditPanel
        selectedElement={selectedElement ?? null}
        onBack={() => setView('home')}
        onEditRequest={(prompt) => onEditRequest?.(prompt)}
        isActive
      />
    );
  }

  // Home view
  return (
    <div className="h-full flex flex-col bg-[#1a1a1a]">
      <div className="p-6 space-y-4">
        <h2 className="text-sm font-semibold text-zinc-200">Design</h2>

        <div className="grid grid-cols-2 gap-3">
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
