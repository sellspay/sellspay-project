import { ThemeTokens, TOKEN_TO_CSS_VAR } from './theme-tokens';

/**
 * Apply a theme to a document's root element.
 * Uses batched cssText update inside rAF for performance.
 */
export function applyTheme(theme: ThemeTokens, root?: HTMLElement) {
  const el = root ?? document.documentElement;

  // Batch all property changes in a single rAF for minimal reflows
  requestAnimationFrame(() => {
    const updates: string[] = [];
    for (const [key, cssVar] of Object.entries(TOKEN_TO_CSS_VAR)) {
      const value = theme[key as keyof ThemeTokens];
      if (value) {
        updates.push(`${cssVar}: ${value}`);
      }
    }
    // Append to existing inline styles without clobbering
    const existing = el.getAttribute('style') || '';
    const filtered = existing
      .split(';')
      .filter(s => s.trim() && !s.trim().startsWith('--'))
      .join(';');
    el.setAttribute('style', `${filtered}; ${updates.join('; ')}`);
  });
}

/**
 * Clear all theme overrides from a document's root element.
 */
export function clearTheme(root?: HTMLElement) {
  const el = root ?? document.documentElement;

  for (const cssVar of Object.values(TOKEN_TO_CSS_VAR)) {
    el.style.removeProperty(cssVar);
  }
}

/**
 * Read current theme from a document's computed styles.
 */
export function readTheme(root?: HTMLElement): Partial<ThemeTokens> {
  const el = root ?? document.documentElement;
  const computed = getComputedStyle(el);
  const result: Partial<ThemeTokens> = {};

  for (const [key, cssVar] of Object.entries(TOKEN_TO_CSS_VAR)) {
    const value = computed.getPropertyValue(cssVar).trim();
    if (value) {
      result[key as keyof ThemeTokens] = value;
    }
  }

  return result;
}

/**
 * Convert hex color to HSL string: "H S% L%"
 */
export function hexToHSL(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '0 0% 0%';

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/**
 * Convert ThemeTokens to a CSS string for injection into iframes.
 * Includes gradient + glass variables.
 */
export function themeToCSSString(theme: ThemeTokens): string {
  const lines: string[] = [];
  for (const [key, cssVar] of Object.entries(TOKEN_TO_CSS_VAR)) {
    const value = theme[key as keyof ThemeTokens];
    if (value) {
      lines.push(`  ${cssVar}: ${value} !important;`);
    }
  }
  return `:root {\n${lines.join('\n')}\n}`;
}

/**
 * Create a debounced version of a function.
 */
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  ms: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}
