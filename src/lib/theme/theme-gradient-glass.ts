/**
 * Theme gradient & glass generation.
 * Derives gradient backgrounds and glassmorphism tokens from theme vibes.
 */

import { type ThemeVibe } from './theme-vibes';

// ─── Gradient Generation ────────────────────────────────────────────

export function generateGradient(primaryHue: number, vibe: ThemeVibe, isDark: boolean): string {
  const h2 = (primaryHue + 40) % 360;

  switch (vibe) {
    case 'cyberpunk':
      return `linear-gradient(135deg, hsl(${primaryHue} 60% ${isDark ? 8 : 95}%), hsl(${h2} 80% ${isDark ? 15 : 90}%))`;
    case 'luxury':
      return `linear-gradient(160deg, hsl(${primaryHue} 15% ${isDark ? 5 : 97}%), hsl(${h2} 20% ${isDark ? 10 : 94}%))`;
    case 'playful':
      return `linear-gradient(135deg, hsl(${primaryHue} 50% ${isDark ? 10 : 95}%), hsl(${(primaryHue + 60) % 360} 60% ${isDark ? 18 : 88}%))`;
    case 'editorial':
      return `linear-gradient(180deg, hsl(${primaryHue} 8% ${isDark ? 6 : 99}%), hsl(${primaryHue} 5% ${isDark ? 10 : 96}%))`;
    case 'minimal':
      return `linear-gradient(180deg, hsl(0 0% ${isDark ? 6 : 99}%), hsl(0 0% ${isDark ? 8 : 97}%))`;
    case 'corporate':
      return `linear-gradient(160deg, hsl(${primaryHue} 25% ${isDark ? 6 : 98}%), hsl(${h2} 30% ${isDark ? 12 : 94}%))`;
    default: // modern
      return `linear-gradient(135deg, hsl(${primaryHue} 30% ${isDark ? 7 : 97}%), hsl(${h2} 40% ${isDark ? 14 : 93}%))`;
  }
}

// ─── Glass Tokens ───────────────────────────────────────────────────

export interface GlassTokens {
  glassOpacity: number;  // 0-1
  glassBlur: number;     // px
  glassBorder: number;   // border opacity 0-1
}

export function getGlassTokens(vibe: ThemeVibe): GlassTokens {
  switch (vibe) {
    case 'luxury':
      return { glassOpacity: 0.12, glassBlur: 24, glassBorder: 0.08 };
    case 'cyberpunk':
      return { glassOpacity: 0.2, glassBlur: 10, glassBorder: 0.15 };
    case 'playful':
      return { glassOpacity: 0.15, glassBlur: 16, glassBorder: 0.1 };
    case 'editorial':
      return { glassOpacity: 0.05, glassBlur: 30, glassBorder: 0.05 };
    case 'minimal':
      return { glassOpacity: 1, glassBlur: 0, glassBorder: 0.08 };
    case 'corporate':
      return { glassOpacity: 0.08, glassBlur: 20, glassBorder: 0.06 };
    default: // modern
      return { glassOpacity: 0.1, glassBlur: 16, glassBorder: 0.1 };
  }
}

// ─── CSS Variable Generation ────────────────────────────────────────

export function gradientAndGlassToCSSString(
  primaryHue: number,
  vibe: ThemeVibe,
  isDark: boolean
): string {
  const gradient = generateGradient(primaryHue, vibe, isDark);
  const glass = getGlassTokens(vibe);

  return [
    `  --vibe-gradient: ${gradient};`,
    `  --glass-opacity: ${glass.glassOpacity};`,
    `  --glass-blur: ${glass.glassBlur}px;`,
    `  --glass-border: ${glass.glassBorder};`,
  ].join('\n');
}
