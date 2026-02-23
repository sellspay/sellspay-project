import ColorThief from 'colorthief';
import { ThemeTokens } from './theme-tokens';
import { detectVibe, applyVibeToTheme } from './theme-vibes';

// ─── Color Math Utilities ───────────────────────────────────────────

function rgbToHSL(r: number, g: number, b: number): string {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
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

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100; l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [Math.round(255 * f(0)), Math.round(255 * f(8)), Math.round(255 * f(4))];
}

function hsl(h: number, s: number, l: number): string {
  return `${Math.round(((h % 360) + 360) % 360)} ${Math.round(clamp(s, 0, 100))}% ${Math.round(clamp(l, 0, 100))}%`;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

// ─── WCAG Contrast Engine ───────────────────────────────────────────

function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(rgb1: [number, number, number], rgb2: [number, number, number]): number {
  const l1 = relativeLuminance(...rgb1);
  const l2 = relativeLuminance(...rgb2);
  const bright = Math.max(l1, l2);
  const dark = Math.min(l1, l2);
  return (bright + 0.05) / (dark + 0.05);
}

/** Pick white or black foreground for WCAG AA (4.5:1) compliance */
function getAccessibleForeground(h: number, s: number, l: number): string {
  const bgRgb = hslToRgb(h, s, l);
  const white: [number, number, number] = [255, 255, 255];
  const black: [number, number, number] = [0, 0, 0];
  return contrastRatio(bgRgb, white) > contrastRatio(bgRgb, black)
    ? '0 0% 100%' : '0 0% 5%';
}

// ─── Color Classification ───────────────────────────────────────────

type ParsedHSL = { h: number; s: number; l: number };

function parseHSL(raw: string): ParsedHSL {
  const p = raw.match(/[\d.]+/g);
  if (!p || p.length < 3) return { h: 0, s: 0, l: 0 };
  return { h: parseFloat(p[0]), s: parseFloat(p[1]), l: parseFloat(p[2]) };
}

type ColorRole = 'vibrant' | 'neutral' | 'light' | 'dark' | 'balanced';

function classifyColor(s: number, l: number): ColorRole {
  if (s > 50 && l > 25 && l < 75) return 'vibrant';
  if (s < 15) return 'neutral';
  if (l > 75) return 'light';
  if (l < 25) return 'dark';
  return 'balanced';
}

/** Normalize a color for use as a brand color — cap saturation, center lightness */
function normalizeBrand(h: number, s: number, l: number, isDark: boolean): ParsedHSL {
  return {
    h,
    s: clamp(s, 50, 85),
    l: isDark ? clamp(l, 45, 65) : clamp(l, 35, 55),
  };
}

// ─── Style Personalities ────────────────────────────────────────────

export type ThemePersonality = 'modern' | 'luxury' | 'cyberpunk' | 'minimal' | 'playful' | 'corporate' | 'editorial' | 'auto';

type PersonalityModifiers = {
  satBoost: number;
  lightShift: number;
  bgSaturation: number;
  accentStrategy: 'complementary' | 'triadic' | 'analogous';
  chartSpacing: number;
};

const PERSONALITIES: Record<Exclude<ThemePersonality, 'auto'>, PersonalityModifiers> = {
  modern: {
    satBoost: 5,
    lightShift: 0,
    bgSaturation: 15,
    accentStrategy: 'triadic',
    chartSpacing: 30,
  },
  luxury: {
    satBoost: -10,
    lightShift: -5,
    bgSaturation: 8,
    accentStrategy: 'analogous',
    chartSpacing: 25,
  },
  cyberpunk: {
    satBoost: 15,
    lightShift: 5,
    bgSaturation: 12,
    accentStrategy: 'complementary',
    chartSpacing: 45,
  },
  minimal: {
    satBoost: -20,
    lightShift: 0,
    bgSaturation: 5,
    accentStrategy: 'analogous',
    chartSpacing: 20,
  },
  playful: {
    satBoost: 10,
    lightShift: 5,
    bgSaturation: 12,
    accentStrategy: 'triadic',
    chartSpacing: 35,
  },
  corporate: {
    satBoost: 0,
    lightShift: -3,
    bgSaturation: 10,
    accentStrategy: 'analogous',
    chartSpacing: 25,
  },
  editorial: {
    satBoost: -5,
    lightShift: 8,
    bgSaturation: 5,
    accentStrategy: 'analogous',
    chartSpacing: 25,
  },
};

function getAccentHue(brandHue: number, strategy: PersonalityModifiers['accentStrategy'], palette: ParsedHSL[]): number {
  const target = strategy === 'complementary'
    ? (brandHue + 180) % 360
    : strategy === 'triadic'
      ? (brandHue + 120) % 360
      : (brandHue + 30) % 360;

  // Check if palette already contains a color near the target hue (±20°)
  const existing = palette.find(c => {
    const diff = Math.abs(c.h - target);
    return (diff < 20 || diff > 340) && c.s > 30;
  });

  return existing ? existing.h : target;
}

function generateChartColors(baseHue: number, spacing: number, isDark: boolean): string[] {
  return [0, 1, 2, 3, 4].map(i =>
    hsl((baseHue + i * spacing) % 360, 75, isDark ? 55 : 50)
  );
}

// ─── Main Pipeline ──────────────────────────────────────────────────

/**
 * Extract a 6-color palette from an image using ColorThief.
 */
export async function extractPaletteFromImage(
  img: HTMLImageElement
): Promise<number[][]> {
  return new Promise((resolve) => {
    try {
      const thief = new ColorThief();
      if (img.complete && img.naturalWidth > 0) {
        resolve(thief.getPalette(img, 6) || []);
      } else {
        img.addEventListener('load', () => {
          resolve(thief.getPalette(img, 6) || []);
        });
      }
    } catch {
      resolve([]);
    }
  });
}

/**
 * Deterministic, production-grade pipeline:
 * palette → classify → normalize → WCAG contrast → personality → ThemeTokens
 */
export function generateThemeFromPalette(
  palette: number[][],
  personality: ThemePersonality = 'auto'
): Partial<ThemeTokens> {
  if (!palette.length) return {};

  // 1. Convert & classify
  const colors: (ParsedHSL & { role: ColorRole })[] = palette
    .map(([r, g, b]) => parseHSL(rgbToHSL(r, g, b)))
    .map(c => ({ ...c, role: classifyColor(c.s, c.l) }));

  // 2. Deterministic sort: saturation descending → pick brand & neutral
  const sorted = [...colors].sort((a, b) => b.s - a.s);
  const brandRaw = sorted[0];
  const neutralRaw = sorted[sorted.length - 1];

  // 3. Detect dark/light project
  const avgLightness = colors.reduce((sum, c) => sum + c.l, 0) / colors.length;
  const isDark = avgLightness < 50;

  // 3b. Detect vibe from palette (deterministic heuristic)
  const detectedVibe = detectVibe(colors);

  // 4. Auto-detect personality if not specified — use vibe detection
  const effectivePersonality: Exclude<ThemePersonality, 'auto'> =
    personality !== 'auto' ? personality : detectedVibe;

  const mods = PERSONALITIES[effectivePersonality];

  // 5. Normalize brand color
  const brand = normalizeBrand(
    brandRaw.h,
    brandRaw.s + mods.satBoost,
    brandRaw.l + mods.lightShift,
    isDark
  );

  // 6. Background — subtly tinted with brand hue
  const bgS = mods.bgSaturation;
  const bgL = isDark ? 6 : 97;
  const background = hsl(brand.h, bgS, bgL);
  const foreground = hsl(0, 0, isDark ? 96 : 8);

  // 7. Primary with WCAG-safe foreground
  const primary = hsl(brand.h, brand.s, brand.l);
  const primaryForeground = getAccessibleForeground(brand.h, brand.s, brand.l);

  // 8. Accent — intelligent hue selection
  const accentHue = getAccentHue(brand.h, mods.accentStrategy, colors);
  const accentS = clamp(brand.s - 5, 50, 80);
  const accentL = isDark ? 55 : 50;
  const accent = hsl(accentHue, accentS, accentL);
  const accentForeground = getAccessibleForeground(accentHue, accentS, accentL);

  // 9. Secondary from neutral
  const secS = clamp(neutralRaw.s, 5, 15);
  const secondary = hsl(neutralRaw.h, secS, isDark ? 16 : 92);
  const secondaryForeground = foreground;

  // 10. Surfaces — tinted with brand hue for cohesion
  const card = hsl(brand.h, isDark ? 4 : 2, isDark ? 10 : 100);
  const popover = card;
  const muted = hsl(brand.h, isDark ? 5 : 3, isDark ? 16 : 96);
  const mutedForeground = hsl(brand.h, 5, isDark ? 55 : 45);
  const borderColor = hsl(brand.h, isDark ? 5 : 3, isDark ? 18 : 88);

  // 11. Chart colors — evenly spaced, cohesive
  const charts = generateChartColors(brand.h, mods.chartSpacing, isDark);

  // 12. Build base tokens
  const baseTokens: Partial<ThemeTokens> = {
    background,
    foreground,
    primary,
    primaryForeground,
    secondary,
    secondaryForeground,
    accent,
    accentForeground,
    card,
    cardForeground: foreground,
    popover,
    popoverForeground: foreground,
    muted,
    mutedForeground,
    destructive: '0 84% 60%',
    destructiveForeground: '0 0% 100%',
    border: borderColor,
    input: borderColor,
    ring: primary,
    chart1: charts[0],
    chart2: charts[1],
    chart3: charts[2],
    chart4: charts[3],
    chart5: charts[4],
    // Placeholders — overridden by applyVibeToTheme
    gradientFrom: hsl(brand.h, 60, isDark ? 10 : 92),
    gradientTo: hsl((brand.h + 40) % 360, 70, isDark ? 18 : 85),
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
    textureOverlay: 'none',
    ctaStyle: 'default',
  };

  // 13. Apply vibe modifiers as post-processing
  const vibeAdjusted = applyVibeToTheme(
    baseTokens as Record<string, string>,
    effectivePersonality,
    isDark
  );

  return vibeAdjusted as Partial<ThemeTokens>;
}

/**
 * Full pipeline: image URL → ThemeTokens
 */
export async function extractThemeFromImageUrl(
  url: string,
  personality: ThemePersonality = 'auto'
): Promise<Partial<ThemeTokens>> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = async () => {
      try {
        const palette = await extractPaletteFromImage(img);
        resolve(generateThemeFromPalette(palette, personality));
      } catch {
        resolve({});
      }
    };
    img.onerror = () => resolve({});
    img.src = url;
  });
}

/** Legacy compat wrapper */
export function paletteToTheme(
  palette: string[],
  _isDark = true
): Partial<ThemeTokens> {
  return generateThemeFromPalette(
    palette.map((raw) => {
      const { h, s, l } = parseHSL(raw);
      const [r, g, b] = hslToRgb(h, s, l);
      return [r, g, b];
    })
  );
}
