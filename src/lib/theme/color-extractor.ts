import ColorThief from 'colorthief';
import { ThemeTokens } from './theme-tokens';

/**
 * Convert RGB [0-255] to HSL string "H S% L%"
 */
function rgbToHSL(r: number, g: number, b: number): string {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

type ParsedHSL = { raw: string; h: number; s: number; l: number };

function parseHSL(hsl: string): ParsedHSL {
  const parts = hsl.match(/[\d.]+/g);
  if (!parts || parts.length < 3) return { raw: hsl, h: 0, s: 0, l: 0 };
  return {
    raw: hsl,
    h: parseFloat(parts[0]),
    s: parseFloat(parts[1]),
    l: parseFloat(parts[2]),
  };
}

function hslString(h: number, s: number, l: number): string {
  return `${Math.round(((h % 360) + 360) % 360)} ${Math.round(Math.max(0, Math.min(100, s)))}% ${Math.round(Math.max(0, Math.min(100, l)))}%`;
}

/**
 * Classify a color by its perceptual role
 */
type ColorRole = 'vibrant' | 'neutral' | 'light' | 'dark' | 'balanced';

function classifyColor(s: number, l: number): ColorRole {
  if (s > 50 && l > 25 && l < 75) return 'vibrant';
  if (s < 15) return 'neutral';
  if (l > 75) return 'light';
  if (l < 25) return 'dark';
  return 'balanced';
}

/**
 * Ensure foreground has enough contrast against background.
 * Uses a simplified WCAG-ish luminance check.
 */
function ensureContrast(bgL: number, fgL: number): number {
  const ratio = (Math.max(bgL, fgL) + 5) / (Math.min(bgL, fgL) + 5);
  if (ratio >= 4.5) return fgL;
  // Push foreground away from background
  return bgL > 50 ? Math.max(0, bgL - 65) : Math.min(100, bgL + 65);
}

/**
 * Extract a 6-color palette from an image using ColorThief.
 */
export async function extractPaletteFromImage(
  img: HTMLImageElement
): Promise<number[][]> {
  return new Promise((resolve) => {
    try {
      const thief = new ColorThief();
      // ColorThief needs the image fully loaded
      if (img.complete) {
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
 * Deterministic pipeline: palette → classified HSL → semantic ThemeTokens.
 * Produces contrast-safe, harmony-balanced, dark-aware themes.
 */
export function generateThemeFromPalette(palette: number[][]): Partial<ThemeTokens> {
  if (!palette.length) return {};

  // Convert all to parsed HSL
  const colors: ParsedHSL[] = palette.map(([r, g, b]) => parseHSL(rgbToHSL(r, g, b)));

  // Classify each color
  const classified = colors.map((c) => ({
    ...c,
    role: classifyColor(c.s, c.l),
  }));

  // Find best candidates for each semantic role
  const vibrant = classified.find((c) => c.role === 'vibrant');
  const neutral = classified.find((c) => c.role === 'neutral');
  const darkColor = classified.find((c) => c.role === 'dark');
  const balanced = classified.find((c) => c.role === 'balanced');

  // Determine primary brand color — prefer vibrant, fallback to balanced, then first
  const brand = vibrant || balanced || colors[0];

  // Determine if the project is dark-oriented
  const avgLightness = colors.reduce((sum, c) => sum + c.l, 0) / colors.length;
  const isDark = avgLightness < 50 || !!darkColor;

  // --- Background strategy ---
  const bgL = isDark ? 6 : 98;
  const fgL = isDark ? 96 : 8;
  const background = hslString(0, 0, bgL);
  const foreground = hslString(0, 0, fgL);

  // --- Primary: cap saturation, normalize lightness for readability ---
  const primaryS = Math.min(85, brand.s);
  const primaryL = isDark
    ? Math.max(45, Math.min(65, brand.l))
    : Math.max(35, Math.min(55, brand.l));
  const primary = hslString(brand.h, primaryS, primaryL);

  // Primary foreground — ensure contrast
  const pfL = ensureContrast(primaryL, isDark ? 98 : 5);
  const primaryForeground = hslString(0, 0, pfL);

  // --- Accent: offset hue by 30° for harmony ---
  const accentHue = (brand.h + 30) % 360;
  const accent = hslString(accentHue, Math.min(80, primaryS), isDark ? 55 : 50);
  const accentFgL = ensureContrast(isDark ? 55 : 50, isDark ? 98 : 5);
  const accentForeground = hslString(0, 0, accentFgL);

  // --- Secondary: use neutral or desaturated brand ---
  const secSource = neutral || brand;
  const secondary = hslString(secSource.h, Math.min(15, secSource.s), isDark ? 16 : 92);
  const secondaryForeground = foreground;

  // --- Surface colors ---
  const card = hslString(brand.h, isDark ? 4 : 2, isDark ? 10 : 100);
  const popover = card;
  const muted = hslString(brand.h, isDark ? 5 : 3, isDark ? 16 : 96);
  const mutedForeground = hslString(0, 0, isDark ? 55 : 45);
  const borderColor = hslString(brand.h, isDark ? 5 : 3, isDark ? 18 : 88);

  // --- Chart colors: 5-step hue rotation for maximum distinction ---
  const chartColors = [0, 60, 120, 180, 240].map((offset) =>
    hslString((brand.h + offset) % 360, Math.min(80, primaryS), isDark ? 55 : 50)
  );

  return {
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
    chart1: chartColors[0],
    chart2: chartColors[1],
    chart3: chartColors[2],
    chart4: chartColors[3],
    chart5: chartColors[4],
  };
}

/**
 * Full pipeline: image URL → ThemeTokens.
 * Load image, extract palette via ColorThief, generate semantic theme.
 */
export async function extractThemeFromImageUrl(
  url: string
): Promise<Partial<ThemeTokens>> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = async () => {
      try {
        const palette = await extractPaletteFromImage(img);
        resolve(generateThemeFromPalette(palette));
      } catch {
        resolve({});
      }
    };
    img.onerror = () => resolve({});
    img.src = url;
  });
}

/**
 * Legacy compat: paletteToTheme wrapper for existing callers
 */
export function paletteToTheme(
  palette: string[],
  _isDark = true
): Partial<ThemeTokens> {
  // Convert HSL strings back to RGB for the pipeline
  // This is a fallback — prefer extractPaletteFromImage directly
  return generateThemeFromPalette(
    palette.map((hsl) => {
      const parts = hsl.match(/[\d.]+/g);
      if (!parts || parts.length < 3) return [128, 128, 128];
      // Approximate HSL→RGB for pipeline input
      const h = parseFloat(parts[0]) / 360;
      const s = parseFloat(parts[1]) / 100;
      const l = parseFloat(parts[2]) / 100;
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };
      let r: number, g: number, b: number;
      if (s === 0) {
        r = g = b = l;
      } else {
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
      }
      return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    })
  );
}
