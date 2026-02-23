// Bridge file: re-exports from the new theme engine for backward compatibility
// All theme logic lives in src/lib/theme/

import { type ThemeTokens, type ThemePreset, THEME_PRESETS, NO_THEME_PRESET, DEFAULT_THEME } from '@/lib/theme';

/**
 * Legacy StyleColors type — maps CSS variable names to HSL strings.
 * New code should use ThemeTokens from @/lib/theme instead.
 */
export type StyleColors = {
  primary: string;
  'primary-foreground': string;
  secondary: string;
  'secondary-foreground': string;
  accent: string;
  'accent-foreground': string;
  background: string;
  foreground: string;
  card: string;
  'card-foreground': string;
  popover: string;
  'popover-foreground': string;
  muted: string;
  'muted-foreground': string;
  destructive: string;
  'destructive-foreground': string;
  border: string;
  input: string;
  ring: string;
  'chart-1': string;
  'chart-2': string;
  'chart-3': string;
  'chart-4': string;
  'chart-5': string;
};

/** Convert ThemeTokens (camelCase) to StyleColors (kebab-case) */
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

/** Convert StyleColors (kebab-case) to ThemeTokens (camelCase) */
export function styleColorsToTokens(colors: StyleColors): ThemeTokens {
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
  };
}

export interface StylePreset {
  id: string;
  name: string;
  description: string;
  colors: StyleColors;
  backgroundStyle: string;
  cardStyle: string;
  typography: string;
  icon: 'moon' | 'zap' | 'sun' | 'leaf' | 'waves' | 'sparkles' | 'palette';
}

/** Convert ThemePreset to legacy StylePreset */
function themeToStylePreset(tp: ThemePreset): StylePreset {
  return {
    id: tp.id,
    name: tp.name,
    description: tp.description,
    colors: tokensToStyleColors(tp.tokens),
    backgroundStyle: tp.backgroundStyle,
    cardStyle: tp.cardStyle,
    typography: tp.typography,
    icon: tp.icon,
  };
}

export const NO_STYLE_PRESET: StylePreset = themeToStylePreset(NO_THEME_PRESET);

export const STYLE_PRESETS: StylePreset[] = THEME_PRESETS.map(themeToStylePreset);

/**
 * Generate a style context string to inject into the AI prompt
 */
export function generateStylePrompt(style: StylePreset): string | null {
  if (style.id === 'none') return null;
  
  return `
[STYLE_CONTEXT]
Apply this visual design system consistently:

🎨 COLOR PALETTE (use semantic Tailwind classes, NOT hardcoded colors):
- Primary button/CTA: bg-primary text-primary-foreground
- Secondary elements: bg-secondary text-secondary-foreground  
- Accent highlights: bg-accent text-accent-foreground or text-accent
- Page background: bg-background
- Card containers: bg-card text-card-foreground
- Body text: text-foreground
- Muted/subtle text: text-muted-foreground
- Muted backgrounds: bg-muted
- Borders: border-border
- Inputs: border-input
- Focus rings: ring-ring
- Destructive: bg-destructive text-destructive-foreground

📐 BACKGROUND STYLE:
${style.backgroundStyle}

🃏 CARD STYLE:
${style.cardStyle}

✏️ TYPOGRAPHY:
${style.typography}

CRITICAL: Always use semantic Tailwind color classes (bg-primary, text-foreground, bg-card, border-border, etc.) instead of hardcoded color values like bg-gray-900, text-white, bg-black, text-zinc-400. This ensures the theme system works correctly. The CSS custom properties are already configured with HSL values.
`;
}

export function getStyleById(id: string): StylePreset | undefined {
  return STYLE_PRESETS.find(s => s.id === id);
}

export const DEFAULT_STYLE = STYLE_PRESETS[0];
