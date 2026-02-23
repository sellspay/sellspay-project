/**
 * AI Vibe Classification Layer
 * Sits between palette extraction and theme generation.
 * Deterministic heuristics — no LLM needed.
 */

export type ThemeVibe =
  | "modern"
  | "luxury"
  | "playful"
  | "cyberpunk"
  | "minimal"
  | "corporate"
  | "editorial";

export const VIBE_LABELS: Record<ThemeVibe, { label: string; description: string; emoji: string }> = {
  modern:    { label: "Modern",     description: "Clean lines, balanced contrast",     emoji: "⚡" },
  luxury:    { label: "Luxury",     description: "Deep tones, low saturation",         emoji: "✦" },
  playful:   { label: "Playful",    description: "Vibrant, energetic palette",         emoji: "🎨" },
  cyberpunk: { label: "Cyberpunk",  description: "Neon accents, dark base",            emoji: "🔮" },
  minimal:   { label: "Minimal",    description: "Muted, spacious, understated",       emoji: "○" },
  corporate: { label: "Corporate",  description: "Professional, trustworthy blues",    emoji: "🏢" },
  editorial: { label: "Editorial",  description: "Light, airy, high contrast type",    emoji: "📰" },
};

export const ALL_VIBES: ThemeVibe[] = [
  "modern", "luxury", "playful", "cyberpunk", "minimal", "corporate", "editorial",
];

type ParsedHSL = { h: number; s: number; l: number };

/**
 * Deterministic vibe detection from extracted HSL palette.
 * Uses saturation, lightness, and hue distribution heuristics.
 */
export function detectVibe(hslPalette: ParsedHSL[]): ThemeVibe {
  if (!hslPalette.length) return "modern";

  const avgSat = hslPalette.reduce((a, c) => a + c.s, 0) / hslPalette.length;
  const avgLight = hslPalette.reduce((a, c) => a + c.l, 0) / hslPalette.length;

  // Check for blue dominance (corporate)
  const blueCount = hslPalette.filter(c => c.h >= 200 && c.h <= 260 && c.s > 30).length;
  const isBlueDominant = blueCount >= hslPalette.length * 0.4;

  if (isBlueDominant && avgSat > 35 && avgSat < 70) return "corporate";
  if (avgSat > 75 && avgLight < 50) return "cyberpunk";
  if (avgSat > 65) return "playful";
  if (avgSat < 25 && avgLight < 40) return "luxury";
  if (avgSat < 25) return "minimal";
  if (avgLight > 70) return "editorial";

  return "modern";
}

/**
 * Vibe modifiers — adjusts raw theme tokens based on detected or selected vibe.
 * All operations are on HSL strings: "H S% L%"
 */
export interface VibeModifiers {
  satBoost: number;
  lightShift: number;
  bgSaturation: number;
  bgLightness: { dark: number; light: number };
  cardLightness: { dark: number; light: number };
  accentSatBoost: number;
  borderSoftness: number; // higher = softer border
}

export const VIBE_MODIFIERS: Record<ThemeVibe, VibeModifiers> = {
  modern: {
    satBoost: 5,
    lightShift: 0,
    bgSaturation: 15,
    bgLightness: { dark: 6, light: 97 },
    cardLightness: { dark: 10, light: 100 },
    accentSatBoost: 0,
    borderSoftness: 0,
  },
  luxury: {
    satBoost: -10,
    lightShift: -5,
    bgSaturation: 8,
    bgLightness: { dark: 4, light: 98 },
    cardLightness: { dark: 8, light: 100 },
    accentSatBoost: -5,
    borderSoftness: 5,
  },
  playful: {
    satBoost: 10,
    lightShift: 5,
    bgSaturation: 12,
    bgLightness: { dark: 8, light: 96 },
    cardLightness: { dark: 12, light: 100 },
    accentSatBoost: 10,
    borderSoftness: -3,
  },
  cyberpunk: {
    satBoost: 15,
    lightShift: 5,
    bgSaturation: 12,
    bgLightness: { dark: 5, light: 96 },
    cardLightness: { dark: 9, light: 99 },
    accentSatBoost: 15,
    borderSoftness: -5,
  },
  minimal: {
    satBoost: -20,
    lightShift: 0,
    bgSaturation: 3,
    bgLightness: { dark: 7, light: 98 },
    cardLightness: { dark: 11, light: 100 },
    accentSatBoost: -10,
    borderSoftness: 10,
  },
  corporate: {
    satBoost: 0,
    lightShift: -3,
    bgSaturation: 10,
    bgLightness: { dark: 7, light: 97 },
    cardLightness: { dark: 11, light: 100 },
    accentSatBoost: 5,
    borderSoftness: 3,
  },
  editorial: {
    satBoost: -5,
    lightShift: 8,
    bgSaturation: 5,
    bgLightness: { dark: 8, light: 98 },
    cardLightness: { dark: 12, light: 100 },
    accentSatBoost: 0,
    borderSoftness: 8,
  },
};

// ─── HSL string helpers ─────────────────────────────────────────────

function parseHSLStr(hslStr: string): { h: number; s: number; l: number } {
  const p = hslStr.match(/[\d.]+/g);
  if (!p || p.length < 3) return { h: 0, s: 0, l: 0 };
  return { h: parseFloat(p[0]), s: parseFloat(p[1]), l: parseFloat(p[2]) };
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function hslStr(h: number, s: number, l: number): string {
  return `${Math.round(((h % 360) + 360) % 360)} ${Math.round(clamp(s, 0, 100))}% ${Math.round(clamp(l, 0, 100))}%`;
}

function boostSat(hsl: string, amount: number): string {
  const { h, s, l } = parseHSLStr(hsl);
  return hslStr(h, s + amount, l);
}

function shiftLight(hsl: string, amount: number): string {
  const { h, s, l } = parseHSLStr(hsl);
  return hslStr(h, s, l + amount);
}

/**
 * Apply vibe modifiers to a base set of ThemeTokens.
 * This is a post-processing step that runs AFTER generateThemeFromPalette.
 */
export function applyVibeToTheme(
  theme: Record<string, string>,
  vibe: ThemeVibe,
  isDark: boolean
): Record<string, string> {
  const mods = VIBE_MODIFIERS[vibe];
  const clone = { ...theme };

  if (clone.primary) {
    clone.primary = boostSat(clone.primary, mods.satBoost);
    clone.primary = shiftLight(clone.primary, mods.lightShift);
  }

  if (clone.accent) {
    clone.accent = boostSat(clone.accent, mods.accentSatBoost);
  }

  if (clone.background) {
    const bg = parseHSLStr(clone.background);
    const bgL = isDark ? mods.bgLightness.dark : mods.bgLightness.light;
    clone.background = hslStr(bg.h, mods.bgSaturation, bgL);
  }

  if (clone.card) {
    const card = parseHSLStr(clone.card);
    const cardL = isDark ? mods.cardLightness.dark : mods.cardLightness.light;
    clone.card = hslStr(card.h, card.s, cardL);
  }

  if (clone.border && mods.borderSoftness !== 0) {
    const border = parseHSLStr(clone.border);
    const shift = isDark ? mods.borderSoftness * -0.5 : mods.borderSoftness * 0.5;
    clone.border = hslStr(border.h, Math.max(0, border.s - Math.abs(mods.borderSoftness)), border.l + shift);
  }

  // ─── Gradient tokens ──────────────────────────────────────────
  const primaryParsed = clone.primary ? parseHSLStr(clone.primary) : { h: 217, s: 70, l: 50 };
  const fromHue = primaryParsed.h;
  const toHue = (fromHue + 40) % 360;

  clone.gradientFrom = isDark
    ? hslStr(fromHue, 60, 10)
    : hslStr(fromHue, 60, 92);
  clone.gradientTo = isDark
    ? hslStr(toHue, 70, 18)
    : hslStr(toHue, 60, 85);

  // ─── Glass tokens (vibe-aware) ────────────────────────────────
  const glassMap: Record<ThemeVibe, { opacity: string; blur: string; borderOp: string; shadow: string }> = {
    luxury:    { opacity: '0.12', blur: '24px', borderOp: '0.2',  shadow: `0 12px 40px -12px` },
    cyberpunk: { opacity: '0.25', blur: '10px', borderOp: '0.5',  shadow: `0 8px 30px -8px` },
    playful:   { opacity: '0.18', blur: '14px', borderOp: '0.25', shadow: `0 10px 30px -10px` },
    editorial: { opacity: '0.08', blur: '20px', borderOp: '0.1',  shadow: `0 6px 20px -8px` },
    minimal:   { opacity: '1',    blur: '0px',  borderOp: '0.05', shadow: `0 4px 12px -4px` },
    corporate: { opacity: '0.14', blur: '16px', borderOp: '0.15', shadow: `0 8px 24px -8px` },
    modern:    { opacity: '0.18', blur: '12px', borderOp: '0.2',  shadow: `0 10px 30px -10px` },
  };

  const glass = glassMap[vibe] ?? glassMap.modern;
  clone.glassOpacity = glass.opacity;
  clone.glassBlur = glass.blur;
  clone.glassBorderOpacity = glass.borderOp;
  clone.shadowElevation = glass.shadow;

  // ─── Typography tokens (vibe-aware) ───────────────────────────
  const typoMap: Record<ThemeVibe, { heading: string; body: string; weight: string; spacing: string }> = {
    luxury:    { heading: "'Playfair Display', serif", body: "'Inter', sans-serif",    weight: '600', spacing: '0.02em' },
    cyberpunk: { heading: "'Orbitron', sans-serif",    body: "'Inter', sans-serif",    weight: '700', spacing: '0.08em' },
    playful:   { heading: "'Poppins', sans-serif",     body: "'Poppins', sans-serif",  weight: '600', spacing: '0.03em' },
    editorial: { heading: "'Playfair Display', serif", body: "'Inter', sans-serif",    weight: '500', spacing: '0.01em' },
    minimal:   { heading: "'Inter', sans-serif",       body: "'Inter', sans-serif",    weight: '500', spacing: '0em' },
    corporate: { heading: "'Inter', sans-serif",       body: "'Inter', sans-serif",    weight: '600', spacing: '0.01em' },
    modern:    { heading: "'Inter', sans-serif",       body: "'Inter', sans-serif",    weight: '600', spacing: '0.01em' },
  };

  const typo = typoMap[vibe] ?? typoMap.modern;
  clone.fontHeading = typo.heading;
  clone.fontBody = typo.body;
  clone.fontWeightHeading = typo.weight;
  clone.letterSpacingHeading = typo.spacing;

  // ─── Radius (geometry personality) ────────────────────────────
  const radiusMap: Record<ThemeVibe, string> = {
    luxury: '0.375rem',
    cyberpunk: '0.125rem',
    playful: '1.25rem',
    editorial: '0.25rem',
    minimal: '0rem',
    corporate: '0.5rem',
    modern: '0.75rem',
  };
  clone.radiusScale = radiusMap[vibe] ?? '0.75rem';

  // ─── Motion personality ───────────────────────────────────────
  const motionMap: Record<ThemeVibe, string> = {
    luxury: '300ms',
    cyberpunk: '120ms',
    playful: '250ms',
    editorial: '350ms',
    minimal: '100ms',
    corporate: '200ms',
    modern: '200ms',
  };
  clone.transitionSpeed = motionMap[vibe] ?? '200ms';

  // ─── Density / section padding ────────────────────────────────
  const densityMap: Record<ThemeVibe, string> = {
    luxury: '120px',
    cyberpunk: '60px',
    playful: '80px',
    editorial: '100px',
    minimal: '80px',
    corporate: '80px',
    modern: '80px',
  };
  clone.sectionPadding = densityMap[vibe] ?? '80px';

  // ─── Texture overlay ─────────────────────────────────────────
  const textureMap: Record<ThemeVibe, string> = {
    luxury: 'noise',
    cyberpunk: 'glow',
    playful: 'none',
    editorial: 'none',
    minimal: 'none',
    corporate: 'none',
    modern: 'noise',
  };
  clone.textureOverlay = textureMap[vibe] ?? 'none';

  // ─── CTA style per vibe ──────────────────────────────────────
  const ctaMap: Record<ThemeVibe, string> = {
    luxury: 'outline-gold',
    cyberpunk: 'glow',
    playful: 'rounded-gradient',
    editorial: 'underline',
    minimal: 'flat',
    corporate: 'solid',
    modern: 'default',
  };
  clone.ctaStyle = ctaMap[vibe] ?? 'default';

  return clone;
}
