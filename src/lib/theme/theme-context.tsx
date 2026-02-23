import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { ThemeTokens } from "./theme-tokens";
import { applyTheme, clearTheme, themeToCSSString, debounce } from "./theme-engine";
import { THEME_PRESETS, DEFAULT_THEME, type ThemePreset } from "./theme-presets";
import { extractPaletteFromImage, generateThemeFromPalette, type ThemePersonality } from "./color-extractor";
import { detectVibeFromPrompt, mergeVibeSignals } from "./vibe-from-text";
import { type ThemeVibe } from "./theme-vibes";
import { downloadThemeFile, copyThemeToClipboard, importTheme as parseImportedTheme } from "./theme-export";
import { type VibeRefinement, refineTheme } from "./vibe-refine";
import { loadDesignProfile, learnFromEdit, type DesignProfile } from "./design-memory";
import { THEME_SCHEMA_VERSION, migrateTheme, needsMigration } from "./theme-version";

export type ThemeSource = "auto" | "manual" | "preset";

type ThemeContextType = {
  theme: ThemeTokens;
  presetId: string;
  themeSource: ThemeSource;
  isAutoThemeLocked: boolean;
  detectedVibe: ThemeVibe | null;
  setTheme: (theme: ThemeTokens, presetId?: string) => void;
  previewTheme: (theme: ThemeTokens) => void;
  revertPreview: () => void;
  isPreviewing: boolean;
  applyPreset: (preset: ThemePreset) => void;
  getThemeCSS: () => string;
  setAutoThemeLocked: (locked: boolean) => void;
  extractThemeFromPreview: (imageUrl: string, personality?: ThemePersonality) => Promise<void>;
  /** Detect vibe from prompt text and apply if auto-theme is unlocked */
  applyVibeFromPrompt: (prompt: string) => void;
  /** Export current theme as JSON download */
  exportCurrentTheme: (name?: string) => void;
  /** Copy current theme JSON to clipboard */
  copyCurrentTheme: (name?: string) => Promise<boolean>;
  /** Import theme from JSON string */
  importThemeFromJSON: (json: string) => boolean;
  /** Apply a vibe refinement (dramatic/softer/premium/bolder) */
  applyRefinement: (refinement: VibeRefinement) => void;
  /** Current design memory profile */
  designProfile: DesignProfile;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

function getStorageKey(projectId: string) {
  return `vibe-theme-v2-${projectId}`;
}

interface StoredTheme {
  version: number;
  tokens: ThemeTokens;
  presetId: string;
  source: ThemeSource;
  locked: boolean;
}

export function ThemeProvider({
  children,
  projectId,
}: {
  children: React.ReactNode;
  projectId: string | null;
}) {
  const [theme, setThemeState] = useState<ThemeTokens>(DEFAULT_THEME.tokens);
  const [presetId, setPresetId] = useState<string>("none");
  const [themeSource, setThemeSource] = useState<ThemeSource>("preset");
  const [isAutoThemeLocked, setAutoThemeLockedState] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [detectedVibe, setDetectedVibe] = useState<ThemeVibe | null>(null);
  const [designProfile, setDesignProfile] = useState<DesignProfile>(loadDesignProfile);
  const savedThemeRef = useRef<ThemeTokens>(DEFAULT_THEME.tokens);

  // Hydrate from localStorage on mount / project switch
  useEffect(() => {
    if (!projectId) return;

    let tokens = DEFAULT_THEME.tokens;
    let pid = "none";
    let source: ThemeSource = "preset";
    let locked = false;

    try {
      const raw = localStorage.getItem(getStorageKey(projectId));
      if (raw) {
        const parsed = JSON.parse(raw);
        // Auto-migrate old schema versions
        if (needsMigration(parsed)) {
          const migrated = migrateTheme(parsed);
          tokens = migrated.tokens;
          pid = migrated.presetId;
          source = migrated.source as ThemeSource;
          locked = migrated.locked;
          // Re-persist with new version
          localStorage.setItem(getStorageKey(projectId), JSON.stringify(migrated));
        } else {
          tokens = parsed.tokens;
          pid = parsed.presetId || "none";
          source = parsed.source || "preset";
          locked = parsed.locked || false;
        }
      }
    } catch {
      // corrupt data — use defaults
    }

    setThemeState(tokens);
    setPresetId(pid);
    setThemeSource(source);
    setAutoThemeLockedState(locked);
    savedThemeRef.current = tokens;

    // Dispatch to ThemeBridge after Sandpack initializes (slight delay for iframe readiness)
    const timer = setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent("vibecoder-theme-apply", { detail: tokens })
      );
    }, 1500);
    return () => clearTimeout(timer);
  }, [projectId]);

  // Persist helper
  const persistTheme = useCallback(
    (tokens: ThemeTokens, pid: string, source: ThemeSource, locked: boolean) => {
      if (projectId) {
        try {
          const stored: StoredTheme = { version: THEME_SCHEMA_VERSION, tokens, presetId: pid, source, locked };
          localStorage.setItem(getStorageKey(projectId), JSON.stringify(stored));
        } catch {
          // quota exceeded — ignore
        }
      }
    },
    [projectId]
  );

  // Commit (save) a theme
  const setTheme = useCallback(
    (newTheme: ThemeTokens, newPresetId?: string) => {
      const pid = newPresetId ?? presetId;
      const source: ThemeSource = "manual";
      setThemeState(newTheme);
      setPresetId(pid);
      setThemeSource(source);
      savedThemeRef.current = newTheme;
      setIsPreviewing(false);

      // Manual edit → lock auto-theme
      setAutoThemeLockedState(true);
      persistTheme(newTheme, pid, source, true);

      // Dispatch to ThemeBridge for iframe injection
      window.dispatchEvent(
        new CustomEvent("vibecoder-theme-apply", { detail: newTheme })
      );
    },
    [projectId, presetId, persistTheme]
  );

  // Debounced preview — prevents janky slider updates
  const debouncedDispatch = useCallback(
    debounce((t: ThemeTokens) => {
      window.dispatchEvent(new CustomEvent("vibecoder-theme-apply", { detail: t }));
    }, 50) as (t: ThemeTokens) => void,
    []
  );

  // Preview without saving
  const previewTheme = useCallback((tempTheme: ThemeTokens) => {
    setIsPreviewing(true);
    debouncedDispatch(tempTheme);
  }, [debouncedDispatch]);

  // Revert to saved
  const revertPreview = useCallback(() => {
    setIsPreviewing(false);
    window.dispatchEvent(
      new CustomEvent("vibecoder-theme-apply", { detail: savedThemeRef.current })
    );
  }, []);

  // Apply preset
  const applyPreset = useCallback(
    (preset: ThemePreset) => {
      const source: ThemeSource = "preset";
      setThemeState(preset.tokens);
      setPresetId(preset.id);
      setThemeSource(source);
      savedThemeRef.current = preset.tokens;
      setIsPreviewing(false);

      persistTheme(preset.tokens, preset.id, source, isAutoThemeLocked);

      window.dispatchEvent(
        new CustomEvent("vibecoder-theme-apply", { detail: preset.tokens })
      );
    },
    [persistTheme, isAutoThemeLocked]
  );

  // Toggle auto-theme lock
  const setAutoThemeLocked = useCallback(
    (locked: boolean) => {
      setAutoThemeLockedState(locked);
      persistTheme(theme, presetId, themeSource, locked);
    },
    [theme, presetId, themeSource, persistTheme]
  );

  // Extract theme from preview image
  const extractThemeFromPreview = useCallback(
    async (imageUrl: string, personality: ThemePersonality = "auto") => {
      // Don't override if locked
      if (isAutoThemeLocked) return;

      try {
        const img = new Image();
        img.crossOrigin = "anonymous";

        const palette = await new Promise<number[][]>((resolve) => {
          img.onload = async () => {
            try {
              const p = await extractPaletteFromImage(img);
              resolve(p);
            } catch {
              resolve([]);
            }
          };
          img.onerror = () => resolve([]);
          img.src = imageUrl;
        });

        if (!palette.length) return;

        const autoTheme = generateThemeFromPalette(palette, personality);
        if (!autoTheme.primary) return; // extraction failed

        // Merge with defaults for any missing tokens
        const fullTheme: ThemeTokens = { ...DEFAULT_THEME.tokens, ...autoTheme };
        const source: ThemeSource = "auto";

        setThemeState(fullTheme);
        setPresetId("auto-extracted");
        setThemeSource(source);
        savedThemeRef.current = fullTheme;
        setIsPreviewing(false);

        persistTheme(fullTheme, "auto-extracted", source, false);

        window.dispatchEvent(
          new CustomEvent("vibecoder-theme-apply", { detail: fullTheme })
        );
      } catch {
        // Extraction failed silently — keep current theme
      }
    },
    [isAutoThemeLocked, persistTheme]
  );

  // Get CSS string for injection
  const getThemeCSS = useCallback(() => {
    return themeToCSSString(theme);
  }, [theme]);

  // Detect vibe from prompt text
  const applyVibeFromPrompt = useCallback(
    (prompt: string) => {
      const vibe = detectVibeFromPrompt(prompt);
      setDetectedVibe(vibe);
    },
    []
  );

  // Export current theme as file download
  const exportCurrentTheme = useCallback(
    (name: string = 'My Theme') => {
      downloadThemeFile(theme, name, detectedVibe);
    },
    [theme, detectedVibe]
  );

  // Copy theme to clipboard
  const copyCurrentTheme = useCallback(
    async (name: string = 'My Theme') => {
      return copyThemeToClipboard(theme, name, detectedVibe);
    },
    [theme, detectedVibe]
  );

  // Import theme from JSON string
  const importThemeFromJSON = useCallback(
    (json: string): boolean => {
      const imported = parseImportedTheme(json);
      if (!imported) return false;

      const source: ThemeSource = "manual";
      setThemeState(imported.tokens);
      setPresetId("imported");
      setThemeSource(source);
      savedThemeRef.current = imported.tokens;
      setIsPreviewing(false);
      setAutoThemeLockedState(true);

      persistTheme(imported.tokens, "imported", source, true);

      window.dispatchEvent(
        new CustomEvent("vibecoder-theme-apply", { detail: imported.tokens })
      );
      return true;
    },
    [persistTheme]
  );

  // Apply vibe refinement
  const applyRefinement = useCallback(
    (refinement: VibeRefinement) => {
      const refined = refineTheme(theme, refinement);
      setTheme(refined);
      // Learn from refinement
      const updated = learnFromEdit(designProfile, {
        saturation: parseInt(refined.primary.split(' ')[1]) || 50,
      });
      setDesignProfile(updated);
    },
    [theme, setTheme, designProfile]
  );

  return (
    <ThemeContext.Provider
      value={{
        theme,
        presetId,
        themeSource,
        isAutoThemeLocked,
        detectedVibe,
        setTheme,
        previewTheme,
        revertPreview,
        isPreviewing,
        applyPreset,
        getThemeCSS,
        setAutoThemeLocked,
        extractThemeFromPreview,
        applyVibeFromPrompt,
        exportCurrentTheme,
        copyCurrentTheme,
        importThemeFromJSON,
        applyRefinement,
        designProfile,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
