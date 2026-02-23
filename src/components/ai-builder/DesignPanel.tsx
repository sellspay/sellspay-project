import { useState, useEffect, useCallback } from "react";
import { Palette, Sparkles, ArrowLeft, MoreHorizontal, Lock, Unlock, Download, Upload, Copy } from "lucide-react";
import { motion } from "framer-motion";
import { STYLE_PRESETS, type StylePreset, type StyleColors } from "./stylePresets";
import { cn } from "@/lib/utils";
import { VisualEditPanel, type SelectedElement } from "./VisualEditOverlay";
import { ThemeEditorDialog } from "./ThemeEditorDialog";
import { useTheme, THEME_PRESETS as PRESETS, type ThemePreset, type ThemeTokens, ALL_VIBES, VIBE_LABELS, type ThemeVibe } from "@/lib/theme";
import { Switch } from "@/components/ui/switch";

type DesignView = 'home' | 'themes' | 'visual-edits';

interface DesignPanelProps {
  onVisualEditModeChange?: (active: boolean) => void;
  selectedElement?: SelectedElement | null;
  onEditRequest?: (prompt: string) => void;
}

// --- Converters between ThemeTokens (camelCase) and StyleColors (kebab-case) ---
function tokensToStyleColors(tokens: ThemeTokens): StyleColors {
  return {
    primary: tokens.primary,
    'primary-foreground': tokens.primaryForeground,
    secondary: tokens.secondary,
    'secondary-foreground': tokens.secondaryForeground,
    accent: tokens.accent,
    'accent-foreground': tokens.accentForeground,
    background: tokens.background,
    foreground: tokens.foreground,
    card: tokens.card,
    'card-foreground': tokens.cardForeground,
    popover: tokens.popover,
    'popover-foreground': tokens.popoverForeground,
    muted: tokens.muted,
    'muted-foreground': tokens.mutedForeground,
    destructive: tokens.destructive,
    'destructive-foreground': tokens.destructiveForeground,
    border: tokens.border,
    input: tokens.input,
    ring: tokens.ring,
    'chart-1': tokens.chart1,
    'chart-2': tokens.chart2,
    'chart-3': tokens.chart3,
    'chart-4': tokens.chart4,
    'chart-5': tokens.chart5,
  };
}

function styleColorsToTokens(colors: StyleColors): ThemeTokens {
  return {
    background: colors.background,
    foreground: colors.foreground,
    primary: colors.primary,
    primaryForeground: colors['primary-foreground'],
    secondary: colors.secondary,
    secondaryForeground: colors['secondary-foreground'],
    accent: colors.accent,
    accentForeground: colors['accent-foreground'],
    card: colors.card,
    cardForeground: colors['card-foreground'],
    popover: colors.popover,
    popoverForeground: colors['popover-foreground'],
    muted: colors.muted,
    mutedForeground: colors['muted-foreground'],
    destructive: colors.destructive,
    destructiveForeground: colors['destructive-foreground'],
    border: colors.border,
    input: colors.input,
    ring: colors.ring,
    chart1: colors['chart-1'],
    chart2: colors['chart-2'],
    chart3: colors['chart-3'],
    chart4: colors['chart-4'],
    chart5: colors['chart-5'],
    gradientFrom: '217 60% 10%',
    gradientTo: '257 70% 18%',
    glassOpacity: '0.18',
    glassBlur: '12px',
    glassBorderOpacity: '0.2',
    shadowElevation: '0 10px 30px -10px',
    fontHeading: "'Inter', sans-serif",
    fontBody: "'Inter', sans-serif",
    fontWeightHeading: '600',
    letterSpacingHeading: '0.01em',
    radiusScale: '0.75rem',
    transitionSpeed: '200ms',
    sectionPadding: '80px',
    textureOverlay: 'noise',
    ctaStyle: 'default',
  };
}

// Color dot row for a preset
function StyleDots({ tokens }: { tokens: ThemeTokens }) {
  const colors = [tokens.primary, tokens.accent, tokens.background, tokens.card, tokens.foreground]
    .map(c => c || '0 0% 50%');
  return (
    <div className="flex items-center gap-1">
      {colors.map((c, i) => (
        <div
          key={i}
          className="w-4 h-4 rounded-full border border-white/10"
          style={{ backgroundColor: `hsl(${c})` }}
        />
      ))}
    </div>
  );
}

export function DesignPanel({ onVisualEditModeChange, selectedElement, onEditRequest }: DesignPanelProps) {
  const { theme, presetId, themeSource, isAutoThemeLocked, detectedVibe, setTheme, previewTheme, revertPreview, applyPreset, setAutoThemeLocked, extractThemeFromPreview, exportCurrentTheme, copyCurrentTheme, importThemeFromJSON } = useTheme();
  const [view, setView] = useState<DesignView>('home');
  const [editingStylePreset, setEditingStylePreset] = useState<StylePreset | null>(null);
  const [activeVibe, setActiveVibe] = useState<ThemeVibe | null>(null);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const importFileRef = useCallback((input: HTMLInputElement | null) => {
    if (input) {
      input.addEventListener('change', (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          const json = reader.result as string;
          importThemeFromJSON(json);
        };
        reader.readAsText(file);
      });
    }
  }, [importThemeFromJSON]);

  // Notify parent when visual edit mode changes
  useEffect(() => {
    onVisualEditModeChange?.(view === 'visual-edits');
  }, [view, onVisualEditModeChange]);

  const handleEditPreset = useCallback((preset: ThemePreset) => {
    const matching = STYLE_PRESETS.find(s => s.id === preset.id);
    if (!matching) return;

    // If this preset is currently active, use the live theme (preserves user edits)
    if (preset.id === presetId || preset.id === 'none') {
      setEditingStylePreset({
        ...matching,
        colors: tokensToStyleColors(theme),
      });
    } else {
      setEditingStylePreset({ ...matching });
    }
  }, [presetId, theme]);

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

          {/* Auto-theme toggle */}
          <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-zinc-900/80 border border-zinc-800/50">
            <div className="flex items-center gap-2">
              {isAutoThemeLocked ? (
                <Lock className="w-3.5 h-3.5 text-zinc-500" />
              ) : (
                <Unlock className="w-3.5 h-3.5 text-zinc-400" />
              )}
              <div>
                <p className="text-xs font-medium text-zinc-300">Auto Theme</p>
                <p className="text-[10px] text-zinc-600">
                  {isAutoThemeLocked ? 'Manual override active' : 'Extracts from preview'}
                </p>
              </div>
            </div>
            <Switch
              checked={!isAutoThemeLocked}
              onCheckedChange={(checked) => setAutoThemeLocked(!checked)}
            />
          </div>

          {themeSource === 'auto' && (
            <p className="text-[10px] text-emerald-500/70 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Theme auto-extracted from preview
            </p>
          )}

          {/* Vibe selector */}
          <div className="space-y-2">
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Vibe style</p>
            <div className="grid grid-cols-2 gap-1.5">
              {ALL_VIBES.map((vibe) => {
                const info = VIBE_LABELS[vibe];
                const isActive = activeVibe === vibe;
                return (
                  <button
                    key={vibe}
                    onClick={() => {
                      setActiveVibe(vibe);
                      // Re-run extraction with this vibe personality
                      extractThemeFromPreview('', vibe as any);
                    }}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all text-xs",
                      isActive
                        ? "bg-zinc-700 border border-zinc-500 text-zinc-100"
                        : "bg-zinc-900/60 border border-zinc-800/50 text-zinc-400 hover:text-zinc-300 hover:border-zinc-700/60"
                    )}
                  >
                    <span className="text-sm">{info.emoji}</span>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{info.label}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Default themes</p>

          {/* Theme list */}
          <div className="space-y-2">
            {PRESETS.map((preset) => {
              const isActive = presetId === preset.id;
              return (
                <div
                  key={preset.id}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors",
                    isActive
                      ? "bg-zinc-800 border border-zinc-600"
                      : "bg-zinc-900/60 border border-zinc-800/50"
                  )}
                >
                  <StyleDots tokens={isActive ? theme : preset.tokens} />
                  <span className="text-sm font-medium text-zinc-200 flex-1 truncate">
                    {preset.name}
                  </span>
                  {!isActive && (
                    <button
                      onClick={() => applyPreset(preset)}
                      className="px-3 py-1 text-xs font-medium text-zinc-300 bg-zinc-700 hover:bg-zinc-600 rounded-md transition-colors shrink-0"
                    >
                      Apply
                    </button>
                  )}
                  <button
                    onClick={() => handleEditPreset(preset)}
                    className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700 rounded-md transition-colors shrink-0"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
          {/* Export / Import */}
          <div className="space-y-2">
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Theme actions</p>
            <div className="flex gap-2">
              <button
                onClick={() => exportCurrentTheme()}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-zinc-900/60 border border-zinc-800/50 text-zinc-400 hover:text-zinc-300 hover:border-zinc-700/60 transition-colors flex-1"
              >
                <Download className="w-3.5 h-3.5" /> Export
              </button>
              <button
                onClick={async () => {
                  const ok = await copyCurrentTheme();
                  if (ok) {
                    setCopyFeedback(true);
                    setTimeout(() => setCopyFeedback(false), 1500);
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-zinc-900/60 border border-zinc-800/50 text-zinc-400 hover:text-zinc-300 hover:border-zinc-700/60 transition-colors flex-1"
              >
                <Copy className="w-3.5 h-3.5" /> {copyFeedback ? 'Copied!' : 'Copy'}
              </button>
              <label className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-zinc-900/60 border border-zinc-800/50 text-zinc-400 hover:text-zinc-300 hover:border-zinc-700/60 transition-colors cursor-pointer flex-1">
                <Upload className="w-3.5 h-3.5" /> Import
                <input type="file" accept=".json" className="hidden" ref={importFileRef} />
              </label>
            </div>
          </div>

        </div>

        {/* Theme editor dialog */}
        {editingStylePreset && (
          <ThemeEditorDialog
            open={!!editingStylePreset}
            onClose={() => {
              revertPreview();
              setEditingStylePreset(null);
            }}
            style={editingStylePreset}
            onApply={(updated) => {
              const tokens = styleColorsToTokens(updated.colors);
              setTheme(tokens, updated.id);
              setEditingStylePreset(null);
            }}
            onLivePreview={(colors) => {
              const tokens = styleColorsToTokens(colors);
              previewTheme(tokens);
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
