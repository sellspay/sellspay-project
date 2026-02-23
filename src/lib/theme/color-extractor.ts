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

/**
 * Get luminance of an HSL string to determine if it's light or dark
 */
function getLuminance(hsl: string): number {
  const parts = hsl.match(/[\d.]+/g);
  if (!parts || parts.length < 3) return 0;
  return parseFloat(parts[2]);
}

/**
 * Get saturation of an HSL string
 */
function getSaturation(hsl: string): number {
  const parts = hsl.match(/[\d.]+/g);
  if (!parts || parts.length < 3) return 0;
  return parseFloat(parts[1]);
}

/**
 * Generate a foreground color for a given background
 */
function autoForeground(bgHSL: string): string {
  return getLuminance(bgHSL) > 55 ? '0 0% 9%' : '0 0% 98%';
}

/**
 * Shift lightness of an HSL string
 */
function shiftLightness(hsl: string, delta: number): string {
  const parts = hsl.match(/[\d.]+/g);
  if (!parts || parts.length < 3) return hsl;
  const h = parseFloat(parts[0]);
  const s = parseFloat(parts[1]);
  const l = Math.max(0, Math.min(100, parseFloat(parts[2]) + delta));
  return `${Math.round(h)} ${Math.round(s)}% ${Math.round(l)}%`;
}

/**
 * Extract a palette from an image element using canvas sampling.
 * Returns an array of HSL strings sorted by frequency.
 */
export function extractPaletteFromImage(img: HTMLImageElement, sampleCount = 5): string[] {
  const canvas = document.createElement('canvas');
  const size = 100; // downsample for speed
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return [];

  ctx.drawImage(img, 0, 0, size, size);
  const data = ctx.getImageData(0, 0, size, size).data;

  // Simple k-means-ish color bucketing
  const buckets = new Map<string, number>();

  for (let i = 0; i < data.length; i += 16) { // sample every 4th pixel
    const r = Math.round(data[i] / 32) * 32;
    const g = Math.round(data[i + 1] / 32) * 32;
    const b = Math.round(data[i + 2] / 32) * 32;
    const key = `${r},${g},${b}`;
    buckets.set(key, (buckets.get(key) || 0) + 1);
  }

  // Sort by frequency, take top N
  const sorted = [...buckets.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, sampleCount * 2);

  // Convert to HSL, filter out near-black and near-white
  const hslColors = sorted
    .map(([key]) => {
      const [r, g, b] = key.split(',').map(Number);
      return rgbToHSL(r, g, b);
    })
    .filter(hsl => {
      const lum = getLuminance(hsl);
      return lum > 5 && lum < 95; // skip extremes
    });

  return hslColors.slice(0, sampleCount);
}

/**
 * Intelligently map an extracted palette to ThemeTokens.
 * Uses the most saturated color as primary, second as accent.
 */
export function paletteToTheme(
  palette: string[],
  isDark = true
): Partial<ThemeTokens> {
  if (palette.length === 0) return {};

  // Sort by saturation to find the "brand" colors
  const bySaturation = [...palette].sort(
    (a, b) => getSaturation(b) - getSaturation(a)
  );

  const primary = bySaturation[0] || palette[0];
  const accent = bySaturation[1] || shiftLightness(primary, 15);

  const bg = isDark ? '0 0% 4%' : '0 0% 100%';
  const fg = isDark ? '0 0% 98%' : '0 0% 9%';
  const cardBg = isDark ? '0 0% 7%' : '0 0% 100%';
  const mutedBg = isDark ? '0 0% 12%' : '0 0% 96%';
  const borderColor = isDark ? '0 0% 15%' : '0 0% 90%';

  return {
    primary,
    primaryForeground: autoForeground(primary),
    accent,
    accentForeground: autoForeground(accent),
    background: bg,
    foreground: fg,
    card: cardBg,
    cardForeground: fg,
    popover: cardBg,
    popoverForeground: fg,
    muted: mutedBg,
    mutedForeground: isDark ? '0 0% 55%' : '0 0% 45%',
    border: borderColor,
    input: borderColor,
    ring: primary,
    chart1: primary,
    chart2: accent,
    chart3: palette[2] || shiftLightness(primary, 20),
    chart4: palette[3] || shiftLightness(accent, -10),
    chart5: palette[4] || shiftLightness(primary, -15),
  };
}

/**
 * Extract theme from an image URL.
 * Returns a partial ThemeTokens that can be spread onto a base theme.
 */
export async function extractThemeFromImageUrl(
  url: string,
  isDark = true
): Promise<Partial<ThemeTokens>> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const palette = extractPaletteFromImage(img);
      resolve(paletteToTheme(palette, isDark));
    };
    img.onerror = () => resolve({});
    img.src = url;
  });
}
