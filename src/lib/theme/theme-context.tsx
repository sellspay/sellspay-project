import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { ThemeTokens } from "./theme-tokens";
import { applyTheme, clearTheme, themeToCSSString } from "./theme-engine";
import { THEME_PRESETS, DEFAULT_THEME, type ThemePreset } from "./theme-presets";

type ThemeContextType = {
  /** The committed (saved) theme */
  theme: ThemeTokens;
  /** The active preset ID (if any) */
  presetId: string;
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
};

const ThemeContext = createContext<ThemeContextType | null>(null);

function getStorageKey(projectId: string) {
  return `vibe-theme-v2-${projectId}`;
}

interface StoredTheme {
  tokens: ThemeTokens;
  presetId: string;
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
  const [isPreviewing, setIsPreviewing] = useState(false);
  const savedThemeRef = useRef<ThemeTokens>(DEFAULT_THEME.tokens);

  // Hydrate from localStorage on mount / project switch
  useEffect(() => {
    if (!projectId) return;

    let tokens = DEFAULT_THEME.tokens;
    let pid = "none";

    try {
      const raw = localStorage.getItem(getStorageKey(projectId));
      if (raw) {
        const stored: StoredTheme = JSON.parse(raw);
        tokens = stored.tokens;
        pid = stored.presetId || "none";
      }
    } catch {
      // corrupt data — use defaults
    }

    setThemeState(tokens);
    setPresetId(pid);
    savedThemeRef.current = tokens;

    // Dispatch to ThemeBridge after Sandpack initializes (slight delay for iframe readiness)
    const timer = setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent("vibecoder-theme-apply", { detail: tokens })
      );
    }, 1500);
    return () => clearTimeout(timer);
  }, [projectId]);

  // Commit (save) a theme
  const setTheme = useCallback(
    (newTheme: ThemeTokens, newPresetId?: string) => {
      const pid = newPresetId ?? presetId;
      setThemeState(newTheme);
      setPresetId(pid);
      savedThemeRef.current = newTheme;
      setIsPreviewing(false);

      if (projectId) {
        try {
          const stored: StoredTheme = { tokens: newTheme, presetId: pid };
          localStorage.setItem(getStorageKey(projectId), JSON.stringify(stored));
        } catch {
          // quota exceeded — ignore
        }
      }

      // Dispatch to ThemeBridge for iframe injection
      window.dispatchEvent(
        new CustomEvent("vibecoder-theme-apply", { detail: newTheme })
      );
    },
    [projectId, presetId]
  );

  // Preview without saving
  const previewTheme = useCallback((tempTheme: ThemeTokens) => {
    setIsPreviewing(true);
    // Dispatch to ThemeBridge for iframe injection (preview only)
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
      setTheme(preset.tokens, preset.id);
    },
    [setTheme]
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
        setTheme,
        previewTheme,
        revertPreview,
        isPreviewing,
        applyPreset,
        getThemeCSS,
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
