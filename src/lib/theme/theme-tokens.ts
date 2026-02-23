/**
 * Semantic Theme Token Contract
 * All values are HSL strings: "H S% L%"
 * Example: "217 91% 60%"
 * 
 * Gradient/glass/elevation tokens use raw CSS values (not HSL).
 */
export type ThemeTokens = {
  background: string;
  foreground: string;

  primary: string;
  primaryForeground: string;

  secondary: string;
  secondaryForeground: string;

  accent: string;
  accentForeground: string;

  card: string;
  cardForeground: string;

  popover: string;
  popoverForeground: string;

  muted: string;
  mutedForeground: string;

  destructive: string;
  destructiveForeground: string;

  border: string;
  input: string;
  ring: string;

  chart1: string;
  chart2: string;
  chart3: string;
  chart4: string;
  chart5: string;

  // Gradient tokens (HSL strings)
  gradientFrom: string;
  gradientTo: string;

  // Glass tokens (raw CSS values)
  glassOpacity: string;
  glassBlur: string;
  glassBorderOpacity: string;

  // Elevation (CSS shadow offset string)
  shadowElevation: string;
};

/** CSS variable name mapping */
export const TOKEN_TO_CSS_VAR: Record<keyof ThemeTokens, string> = {
  background: '--background',
  foreground: '--foreground',
  primary: '--primary',
  primaryForeground: '--primary-foreground',
  secondary: '--secondary',
  secondaryForeground: '--secondary-foreground',
  accent: '--accent',
  accentForeground: '--accent-foreground',
  card: '--card',
  cardForeground: '--card-foreground',
  popover: '--popover',
  popoverForeground: '--popover-foreground',
  muted: '--muted',
  mutedForeground: '--muted-foreground',
  destructive: '--destructive',
  destructiveForeground: '--destructive-foreground',
  border: '--border',
  input: '--input',
  ring: '--ring',
  chart1: '--chart-1',
  chart2: '--chart-2',
  chart3: '--chart-3',
  chart4: '--chart-4',
  chart5: '--chart-5',
  gradientFrom: '--gradient-from',
  gradientTo: '--gradient-to',
  glassOpacity: '--glass-opacity',
  glassBlur: '--glass-blur',
  glassBorderOpacity: '--glass-border-opacity',
  shadowElevation: '--shadow-elevation',
};
