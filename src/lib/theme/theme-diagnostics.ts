/**
 * Theme Diagnostic Utilities
 * Debug helpers for inspecting the live theme state.
 */

import { ThemeTokens, TOKEN_TO_CSS_VAR } from './theme-tokens';

/**
 * Log current theme tokens as a table to the console.
 */
export function logTheme(theme: ThemeTokens): void {
  const table: Record<string, { cssVar: string; value: string }> = {};
  for (const [key, cssVar] of Object.entries(TOKEN_TO_CSS_VAR)) {
    table[key] = {
      cssVar,
      value: theme[key as keyof ThemeTokens] || '(empty)',
    };
  }
  console.table(table);
}

/**
 * Validate a theme object — returns array of issues found.
 */
export function validateTheme(theme: Partial<ThemeTokens>): string[] {
  const issues: string[] = [];
  const required: (keyof ThemeTokens)[] = [
    'background', 'foreground', 'primary', 'primaryForeground',
    'card', 'cardForeground', 'border',
  ];

  for (const key of required) {
    if (!theme[key]) {
      issues.push(`Missing required token: ${key}`);
    }
  }

  // Check HSL format for color tokens (should be "H S% L%")
  const hslPattern = /^\d{1,3}\s+\d{1,3}%\s+\d{1,3}%$/;
  const colorKeys: (keyof ThemeTokens)[] = [
    'background', 'foreground', 'primary', 'primaryForeground',
    'secondary', 'secondaryForeground', 'accent', 'accentForeground',
    'card', 'cardForeground', 'muted', 'mutedForeground',
    'destructive', 'destructiveForeground', 'border', 'input', 'ring',
  ];

  for (const key of colorKeys) {
    const val = theme[key];
    if (val && !hslPattern.test(val)) {
      issues.push(`Invalid HSL format for ${key}: "${val}"`);
    }
  }

  return issues;
}

/**
 * Read live CSS variable values from the DOM and compare against expected theme.
 */
export function auditLiveTheme(theme: ThemeTokens): { mismatches: string[]; missing: string[] } {
  const computed = getComputedStyle(document.documentElement);
  const mismatches: string[] = [];
  const missing: string[] = [];

  for (const [key, cssVar] of Object.entries(TOKEN_TO_CSS_VAR)) {
    const expected = theme[key as keyof ThemeTokens];
    const actual = computed.getPropertyValue(cssVar).trim();

    if (!actual) {
      missing.push(`${cssVar} not set in DOM`);
    } else if (expected && actual !== expected) {
      mismatches.push(`${cssVar}: expected "${expected}", got "${actual}"`);
    }
  }

  return { mismatches, missing };
}
