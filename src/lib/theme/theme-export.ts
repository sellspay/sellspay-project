/**
 * Theme export / import system.
 * Makes themes portable — users can share, save, and load theme JSON.
 */

import { ThemeTokens } from './theme-tokens';
import { type ThemeVibe } from './theme-vibes';

export interface ExportedTheme {
  version: 1;
  name: string;
  vibe: ThemeVibe | null;
  tokens: ThemeTokens;
  exportedAt: string;
}

/**
 * Export a theme to a portable JSON string.
 */
export function exportTheme(
  theme: ThemeTokens,
  name: string = 'Custom Theme',
  vibe: ThemeVibe | null = null
): string {
  const exported: ExportedTheme = {
    version: 1,
    name,
    vibe,
    tokens: theme,
    exportedAt: new Date().toISOString(),
  };
  return JSON.stringify(exported, null, 2);
}

/**
 * Import a theme from a JSON string.
 * Returns null if the JSON is invalid or incompatible.
 */
export function importTheme(json: string): ExportedTheme | null {
  try {
    const parsed = JSON.parse(json);

    // Validate structure
    if (!parsed || typeof parsed !== 'object') return null;
    if (parsed.version !== 1) return null;
    if (!parsed.tokens || typeof parsed.tokens !== 'object') return null;

    // Validate required token keys exist
    const requiredKeys: (keyof ThemeTokens)[] = [
      'primary', 'background', 'foreground', 'accent',
    ];
    for (const key of requiredKeys) {
      if (typeof parsed.tokens[key] !== 'string') return null;
    }

    return parsed as ExportedTheme;
  } catch {
    return null;
  }
}

/**
 * Download a theme as a .json file.
 */
export function downloadThemeFile(
  theme: ThemeTokens,
  name: string = 'theme',
  vibe: ThemeVibe | null = null
): void {
  const json = exportTheme(theme, name, vibe);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${name.toLowerCase().replace(/\s+/g, '-')}.theme.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Copy theme JSON to clipboard.
 */
export async function copyThemeToClipboard(
  theme: ThemeTokens,
  name: string = 'Custom Theme',
  vibe: ThemeVibe | null = null
): Promise<boolean> {
  try {
    const json = exportTheme(theme, name, vibe);
    await navigator.clipboard.writeText(json);
    return true;
  } catch {
    return false;
  }
}
