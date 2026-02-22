// Style Design Presets for AI Builder
// These presets inject visual design instructions into the AI prompt

export interface StyleColors {
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

function makeColors(partial: Partial<StyleColors>): StyleColors {
  return {
    primary: '#8b5cf6',
    'primary-foreground': '#ffffff',
    secondary: '#27272a',
    'secondary-foreground': '#fafafa',
    accent: '#a78bfa',
    'accent-foreground': '#ffffff',
    background: '#09090b',
    foreground: '#fafafa',
    card: '#18181b',
    'card-foreground': '#fafafa',
    popover: '#18181b',
    'popover-foreground': '#fafafa',
    muted: '#27272a',
    'muted-foreground': '#a1a1aa',
    destructive: '#ef4444',
    'destructive-foreground': '#ffffff',
    border: '#27272a',
    input: '#27272a',
    ring: '#8b5cf6',
    'chart-1': '#8b5cf6',
    'chart-2': '#3b82f6',
    'chart-3': '#06b6d4',
    'chart-4': '#10b981',
    'chart-5': '#f59e0b',
    ...partial,
  };
}

// Special "None" preset that represents no style override
export const NO_STYLE_PRESET: StylePreset = {
  id: 'none',
  name: 'Current Theme',
  description: 'Your existing design',
  colors: makeColors({}),
  backgroundStyle: '',
  cardStyle: '',
  typography: '',
  icon: 'palette',
};

export const STYLE_PRESETS: StylePreset[] = [
  NO_STYLE_PRESET,
  {
    id: 'midnight-luxury',
    name: 'Midnight Luxury',
    description: 'Dark mode with violet accents',
    colors: makeColors({
      primary: '#8b5cf6',
      'primary-foreground': '#ffffff',
      accent: '#a78bfa',
      'accent-foreground': '#ffffff',
      background: '#0a0a0f',
      foreground: '#ffffff',
      card: '#1a1a2e',
      'card-foreground': '#ffffff',
      muted: '#27273a',
      'muted-foreground': '#a1a1bb',
      border: '#2a2a4a',
      ring: '#8b5cf6',
    }),
    backgroundStyle: 'Glassmorphism overlays with backdrop-blur-xl, subtle gradient meshes, border border-white/10',
    cardStyle: 'bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-violet-500/10',
    typography: 'Clean sans-serif (Inter/Geist), high contrast white on dark, elegant letter-spacing',
    icon: 'moon',
  },
  {
    id: 'neon-cyberpunk',
    name: 'Neon Cyberpunk',
    description: 'Bold neon on dark',
    colors: makeColors({
      primary: '#00ff88',
      'primary-foreground': '#0f0f0f',
      accent: '#ff00ff',
      'accent-foreground': '#ffffff',
      background: '#0f0f0f',
      foreground: '#ffffff',
      card: '#1a1a1a',
      'card-foreground': '#ffffff',
      muted: '#2a2a2a',
      'muted-foreground': '#888888',
      border: '#333333',
      ring: '#00ff88',
      'chart-1': '#00ff88',
      'chart-2': '#ff00ff',
      'chart-3': '#00ffff',
      'chart-4': '#ffff00',
      'chart-5': '#ff6600',
    }),
    backgroundStyle: 'Gradient meshes with neon glow effects, animated gradients, grid patterns',
    cardStyle: 'bg-black/80 border border-[#00ff88]/30 rounded-lg shadow-[0_0_30px_rgba(0,255,136,0.2)]',
    typography: 'Bold condensed fonts (Orbitron/Rajdhani), glowing text effects, uppercase headers',
    icon: 'zap',
  },
  {
    id: 'clean-minimal',
    name: 'Clean Minimal',
    description: 'Light, spacious, professional',
    colors: makeColors({
      primary: '#1a1a1a',
      'primary-foreground': '#ffffff',
      secondary: '#f5f5f5',
      'secondary-foreground': '#171717',
      accent: '#3b82f6',
      'accent-foreground': '#ffffff',
      background: '#ffffff',
      foreground: '#171717',
      card: '#ffffff',
      'card-foreground': '#171717',
      popover: '#ffffff',
      'popover-foreground': '#171717',
      muted: '#f5f5f5',
      'muted-foreground': '#737373',
      border: '#e5e5e5',
      input: '#e5e5e5',
      ring: '#3b82f6',
    }),
    backgroundStyle: 'Pure white with subtle shadows, lots of whitespace, no gradients',
    cardStyle: 'bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow',
    typography: 'System fonts (Inter/SF Pro), generous line-height, minimal weight contrast',
    icon: 'sun',
  },
  {
    id: 'warm-earth',
    name: 'Warm Earth',
    description: 'Natural, organic tones',
    colors: makeColors({
      primary: '#8b6f47',
      'primary-foreground': '#ffffff',
      accent: '#c9a66b',
      'accent-foreground': '#3d2914',
      background: '#faf7f2',
      foreground: '#3d2914',
      card: '#f5efe6',
      'card-foreground': '#3d2914',
      muted: '#ede5d8',
      'muted-foreground': '#8b7355',
      border: '#e8dcc8',
      ring: '#8b6f47',
    }),
    backgroundStyle: 'Soft cream textures, paper-like backgrounds, organic noise patterns',
    cardStyle: 'bg-[#f5efe6] border border-[#e8dcc8] rounded-xl shadow-warm',
    typography: 'Serif fonts (Playfair/Merriweather) for headings, warm brown tones',
    icon: 'leaf',
  },
  {
    id: 'ocean-breeze',
    name: 'Ocean Breeze',
    description: 'Cool blues and teals',
    colors: makeColors({
      primary: '#0ea5e9',
      'primary-foreground': '#ffffff',
      accent: '#06b6d4',
      'accent-foreground': '#ffffff',
      background: '#f0f9ff',
      foreground: '#0c4a6e',
      card: '#ffffff',
      'card-foreground': '#0c4a6e',
      muted: '#e0f2fe',
      'muted-foreground': '#64748b',
      border: '#bae6fd',
      ring: '#0ea5e9',
    }),
    backgroundStyle: 'Gentle blue gradients, wave patterns, soft flowing shapes',
    cardStyle: 'bg-white/80 backdrop-blur-sm border border-sky-100 rounded-2xl shadow-sky-100/50',
    typography: 'Modern sans-serif (Plus Jakarta/DM Sans), cool blue accents on text',
    icon: 'waves',
  },
  {
    id: 'retro-pop',
    name: 'Retro Pop',
    description: 'Vintage 80s aesthetic',
    colors: makeColors({
      primary: '#f97316',
      'primary-foreground': '#ffffff',
      accent: '#ec4899',
      'accent-foreground': '#ffffff',
      background: '#fef3c7',
      foreground: '#451a03',
      card: '#ffffff',
      'card-foreground': '#451a03',
      muted: '#fde68a',
      'muted-foreground': '#92400e',
      border: '#fbbf24',
      ring: '#f97316',
    }),
    backgroundStyle: 'Geometric patterns, Memphis design elements, bold color blocks',
    cardStyle: 'bg-white border-2 border-black rounded-none shadow-[4px_4px_0_0_#000]',
    typography: 'Bold display fonts (Space Grotesk/Archivo Black), playful uppercase, thick strokes',
    icon: 'sparkles',
  },
];

/**
 * Generate a style context string to inject into the AI prompt
 */
export function generateStylePrompt(style: StylePreset): string | null {
  if (style.id === 'none') return null;
  
  return `
[STYLE_CONTEXT]
Apply this visual design system consistently:

🎨 COLOR PALETTE:
- Primary: ${style.colors.primary}
- Accent: ${style.colors.accent}
- Background: ${style.colors.background}
- Card: ${style.colors.card}
- Text: ${style.colors.foreground}
- Muted: ${style.colors.muted}

📐 BACKGROUND STYLE:
${style.backgroundStyle}

🃏 CARD STYLE:
${style.cardStyle}

✏️ TYPOGRAPHY:
${style.typography}

IMPORTANT: Use these exact colors as Tailwind arbitrary values.
Maintain this visual identity across all sections, buttons, cards, and typography.
`;
}

export function getStyleById(id: string): StylePreset | undefined {
  return STYLE_PRESETS.find(s => s.id === id);
}

export const DEFAULT_STYLE = STYLE_PRESETS[0];
