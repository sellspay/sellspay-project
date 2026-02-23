import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { ThemeTokens } from "./theme-tokens";
import { applyTheme, clearTheme, themeToCSSString } from "./theme-engine";
import { THEME_PRESETS, DEFAULT_THEME, type ThemePreset } from "./theme-presets";
import { extractPaletteFromImage, generateThemeFromPalette, type ThemePersonality } from "./color-extractor";

export type ThemeSource = "auto" | "manual" | "preset";

type ThemeContextType = {
  /** The committed (saved) theme */
  theme: ThemeTokens;
  /** The active preset ID (if any) */
  presetId: string;
  /** How the current theme was set */
  themeSource: ThemeSource;
  /** Whether auto-theme is locked (manual override) */
  isAutoThemeLocked: boolean;
  /** Commit a new theme as the saved state */
  setTheme: (theme: ThemeTokens, presetId?: string) => void;
  /** Apply a theme temporarily for live preview (does NOT save) */
  previewTheme: (theme: ThemeTokens) => void;
  /** Revert to the last saved theme (discard preview) */
  revertPreview: () => void;
  /** Whether we're currently previewing (unsaved state) */
  isPreviewing: boolean;
  /** Apply a preset by reference */
  applyPreset: (preset: ThemePreset) => void;
  /** Get CSS string for iframe injection */
  getThemeCSS: () => string;
  /** Toggle auto-theme lock on/off */
  setAutoThemeLocked: (locked: boolean) => void;
  /** Extract theme from a preview image URL */
  extractThemeFromPreview: (imageUrl: string, personality?: ThemePersonality) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

function getStorageKey(projectId: string) {
  return `vibe-theme-v2-${projectId}`;
}

interface StoredTheme {
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
        const stored: StoredTheme = JSON.parse(raw);
        tokens = stored.tokens;
        pid = stored.presetId || "none";
        source = stored.source || "preset";
        locked = stored.locked || false;
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
          const stored: StoredTheme = { tokens, presetId: pid, source, locked };
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

  // Preview without saving
  const previewTheme = useCallback((tempTheme: ThemeTokens) => {
    setIsPreviewing(true);
    window.dispatchEvent(
      new CustomEvent("vibecoder-theme-apply", { detail: tempTheme })
    );
  }, []);

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

  return (
    <ThemeContext.Provider
      value={{
        theme,
        presetId,
        themeSource,
        isAutoThemeLocked,
        setTheme,
        previewTheme,
        revertPreview,
        isPreviewing,
        applyPreset,
        getThemeCSS,
        setAutoThemeLocked,
        extractThemeFromPreview,
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
