/**
 * Vibe Refinement System
 * Deterministic adjustments: "more dramatic", "softer", "premium", "bolder"
 */

import { type ThemeTokens } from './theme-tokens';

export type VibeRefinement = 'dramatic' | 'softer' | 'premium' | 'bolder';

export const REFINEMENT_LABELS: Record<VibeRefinement, { label: string; emoji: string; description: string }> = {
  dramatic:  { label: 'More Dramatic', emoji: '🔥', description: 'Deeper contrast, stronger gradients' },
  softer:    { label: 'Softer',        emoji: '☁️', description: 'Lower contrast, lighter feel' },
  premium:   { label: 'Premium',       emoji: '✦',  description: 'Desaturated, elegant, luxurious' },
  bolder:    { label: 'Bolder',        emoji: '⚡', description: 'Saturated, punchy, energetic' },
};

function parseHSL(hsl: string): { h: number; s: number; l: number } {
  const p = hsl.match(/[\d.]+/g);
  if (!p || p.length < 3) return { h: 0, s: 0, l: 0 };
  return { h: parseFloat(p[0]), s: parseFloat(p[1]), l: parseFloat(p[2]) };
}

function toHSL(h: number, s: number, l: number): string {
  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
  return `${Math.round(((h % 360) + 360) % 360)} ${Math.round(clamp(s, 0, 100))}% ${Math.round(clamp(l, 0, 100))}%`;
}

function adjustHSL(hsl: string, ds: number, dl: number): string {
  const { h, s, l } = parseHSL(hsl);
  return toHSL(h, s + ds, l + dl);
}

/**
 * Apply a refinement to theme tokens. Returns a new tokens object.
 */
export function refineTheme(theme: ThemeTokens, refinement: VibeRefinement): ThemeTokens {
  const clone = { ...theme };

  switch (refinement) {
    case 'dramatic':
      clone.primary = adjustHSL(clone.primary, 10, -5);
      clone.accent = adjustHSL(clone.accent, 10, -5);
      clone.background = adjustHSL(clone.background, 2, -3);
      clone.foreground = adjustHSL(clone.foreground, 0, 5);
      clone.gradientFrom = adjustHSL(clone.gradientFrom, 5, -4);
      clone.gradientTo = adjustHSL(clone.gradientTo, 8, -2);
      clone.glassBlur = bumpPx(clone.glassBlur, 4);
      clone.shadowElevation = '0 14px 50px -14px';
      break;

    case 'softer':
      clone.primary = adjustHSL(clone.primary, -8, 5);
      clone.accent = adjustHSL(clone.accent, -8, 5);
      clone.background = adjustHSL(clone.background, -2, 3);
      clone.foreground = adjustHSL(clone.foreground, 0, -5);
      clone.gradientFrom = adjustHSL(clone.gradientFrom, -5, 4);
      clone.gradientTo = adjustHSL(clone.gradientTo, -5, 4);
      clone.glassBlur = bumpPx(clone.glassBlur, -2);
      clone.shadowElevation = '0 6px 16px -6px';
      break;

    case 'premium':
      clone.primary = adjustHSL(clone.primary, -15, -3);
      clone.accent = adjustHSL(clone.accent, -12, -2);
      clone.background = adjustHSL(clone.background, -5, -2);
      clone.card = adjustHSL(clone.card, -5, -1);
      clone.glassBlur = bumpPx(clone.glassBlur, 6);
      clone.glassOpacity = '0.10';
      clone.transitionSpeed = '350ms';
      clone.fontWeightHeading = '500';
      clone.letterSpacingHeading = '0.04em';
      break;

    case 'bolder':
      clone.primary = adjustHSL(clone.primary, 15, 0);
      clone.accent = adjustHSL(clone.accent, 15, 0);
      clone.foreground = adjustHSL(clone.foreground, 0, 8);
      clone.gradientFrom = adjustHSL(clone.gradientFrom, 8, -2);
      clone.gradientTo = adjustHSL(clone.gradientTo, 10, -2);
      clone.fontWeightHeading = '800';
      clone.letterSpacingHeading = '0em';
      clone.shadowElevation = '0 12px 40px -10px';
      break;
  }

  return clone;
}

function bumpPx(val: string, delta: number): string {
  const n = parseInt(val, 10) || 0;
  return `${Math.max(0, n + delta)}px`;
}
