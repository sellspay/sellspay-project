// Style Design Presets for AI Builder
// These presets inject visual design instructions into the AI prompt

export interface StylePreset {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    muted: string;
  };
  backgroundStyle: string;
  cardStyle: string;
  typography: string;
  icon: 'moon' | 'zap' | 'sun' | 'leaf' | 'waves' | 'sparkles' | 'palette';
}

// Special "None" preset that represents no style override
export const NO_STYLE_PRESET: StylePreset = {
  id: 'none',
  name: 'Current Theme',
  description: 'Your existing design',
  colors: {
    primary: '',
    accent: '',
    background: '',
    surface: '',
    text: '',
    muted: '',
  },
  backgroundStyle: '',
  cardStyle: '',
  typography: '',
  icon: 'palette',
};

export const STYLE_PRESETS: StylePreset[] = [
  NO_STYLE_PRESET, // "None" option first
  {
    id: 'midnight-luxury',
    name: 'Midnight Luxury',
    description: 'Dark mode with violet accents',
    colors: {
      primary: '#8b5cf6',
      accent: '#a78bfa',
      background: '#0a0a0f',
      surface: '#1a1a2e',
      text: '#ffffff',
      muted: '#71717a',
    },
    backgroundStyle: 'Glassmorphism overlays with backdrop-blur-xl, subtle gradient meshes, border border-white/10',
    cardStyle: 'bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-violet-500/10',
    typography: 'Clean sans-serif (Inter/Geist), high contrast white on dark, elegant letter-spacing',
    icon: 'moon',
  },
  {
    id: 'neon-cyberpunk',
    name: 'Neon Cyberpunk',
    description: 'Bold neon on dark',
    colors: {
      primary: '#00ff88',
      accent: '#ff00ff',
      background: '#0f0f0f',
      surface: '#1a1a1a',
      text: '#ffffff',
      muted: '#888888',
    },
    backgroundStyle: 'Gradient meshes with neon glow effects, animated gradients, grid patterns',
    cardStyle: 'bg-black/80 border border-[#00ff88]/30 rounded-lg shadow-[0_0_30px_rgba(0,255,136,0.2)]',
    typography: 'Bold condensed fonts (Orbitron/Rajdhani), glowing text effects, uppercase headers',
    icon: 'zap',
  },
  {
    id: 'clean-minimal',
    name: 'Clean Minimal',
    description: 'Light, spacious, professional',
    colors: {
      primary: '#1a1a1a',
      accent: '#3b82f6',
      background: '#ffffff',
      surface: '#f5f5f5',
      text: '#171717',
      muted: '#737373',
    },
    backgroundStyle: 'Pure white with subtle shadows, lots of whitespace, no gradients',
    cardStyle: 'bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow',
    typography: 'System fonts (Inter/SF Pro), generous line-height, minimal weight contrast',
    icon: 'sun',
  },
  {
    id: 'warm-earth',
    name: 'Warm Earth',
    description: 'Natural, organic tones',
    colors: {
      primary: '#8b6f47',
      accent: '#c9a66b',
      background: '#faf7f2',
      surface: '#f5efe6',
      text: '#3d2914',
      muted: '#8b7355',
    },
    backgroundStyle: 'Soft cream textures, paper-like backgrounds, organic noise patterns',
    cardStyle: 'bg-[#f5efe6] border border-[#e8dcc8] rounded-xl shadow-warm',
    typography: 'Serif fonts (Playfair/Merriweather) for headings, warm brown tones',
    icon: 'leaf',
  },
  {
    id: 'ocean-breeze',
    name: 'Ocean Breeze',
    description: 'Cool blues and teals',
    colors: {
      primary: '#0ea5e9',
      accent: '#06b6d4',
      background: '#f0f9ff',
      surface: '#e0f2fe',
      text: '#0c4a6e',
      muted: '#64748b',
    },
    backgroundStyle: 'Gentle blue gradients, wave patterns, soft flowing shapes',
    cardStyle: 'bg-white/80 backdrop-blur-sm border border-sky-100 rounded-2xl shadow-sky-100/50',
    typography: 'Modern sans-serif (Plus Jakarta/DM Sans), cool blue accents on text',
    icon: 'waves',
  },
  {
    id: 'retro-pop',
    name: 'Retro Pop',
    description: 'Vintage 80s aesthetic',
    colors: {
      primary: '#f97316',
      accent: '#ec4899',
      background: '#fef3c7',
      surface: '#fde68a',
      text: '#451a03',
      muted: '#92400e',
    },
    backgroundStyle: 'Geometric patterns, Memphis design elements, bold color blocks',
    cardStyle: 'bg-white border-2 border-black rounded-none shadow-[4px_4px_0_0_#000]',
    typography: 'Bold display fonts (Space Grotesk/Archivo Black), playful uppercase, thick strokes',
    icon: 'sparkles',
  },
];

/**
 * Generate a style context string to inject into the AI prompt
 * This ensures the AI uses the selected visual design system
 * Returns null for "None" style so no style injection occurs
 */
export function generateStylePrompt(style: StylePreset): string | null {
  // If "None" style is selected, don't inject any style context
  if (style.id === 'none') {
    return null;
  }
  
  return `
[STYLE_CONTEXT]
Apply this visual design system consistently:

🎨 COLOR PALETTE:
- Primary: ${style.colors.primary}
- Accent: ${style.colors.accent}
- Background: ${style.colors.background}
- Surface/Card: ${style.colors.surface}
- Text: ${style.colors.text}
- Muted: ${style.colors.muted}

📐 BACKGROUND STYLE:
${style.backgroundStyle}

🃏 CARD STYLE:
${style.cardStyle}

✏️ TYPOGRAPHY:
${style.typography}

IMPORTANT: Use these exact colors as Tailwind arbitrary values (e.g., bg-[${style.colors.background}], text-[${style.colors.primary}]).
Maintain this visual identity across all sections, buttons, cards, and typography.
`;
}

/**
 * Get a style preset by ID
 */
export function getStyleById(id: string): StylePreset | undefined {
  return STYLE_PRESETS.find(s => s.id === id);
}

/**
 * Default style when none is selected
 */
export const DEFAULT_STYLE = STYLE_PRESETS[0]; // "No Style" by default
