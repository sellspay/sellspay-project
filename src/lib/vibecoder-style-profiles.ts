/**
 * VibeCoder Style Profiles
 * 
 * Pre-defined visual styles that inject specific Tailwind patterns
 * into the Builder's prompt. This prevents repetitive designs by
 * giving the AI concrete direction for each "vibe."
 */

export interface StyleProfile {
  id: string;
  name: string;
  description: string;
  promptFragment: string;
  colorPalette: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  typography: {
    heading: string;
    body: string;
  };
  preview?: {
    gradient: string;
    icon: string;
  };
}

export const STYLE_PROFILES: StyleProfile[] = [
  {
    id: 'luxury-minimal',
    name: 'Luxury Minimal',
    description: 'High-end, Apple-inspired aesthetic',
    promptFragment: `
STYLE: Luxury Minimal
- Background: bg-zinc-950 with subtle gradient overlays
- Typography: Use a serif or elegant sans-serif feel, large tracking-tight headings
- Spacing: Extremely generous whitespace (py-24, px-8 on sections)
- Colors: Monochromatic with gold/cream accents (text-amber-100/50)
- Shadows: Elegant diffused shadows (shadow-[0_20px_50px_rgba(0,0,0,0.3)])
- Borders: Subtle, near-invisible (border-zinc-800/30)
- Animations: Slow, graceful fade-ins and scale transitions
- Hero: Full-bleed with minimal text, maximum impact
- Product Cards: Clean, spacious, focus on product imagery
`,
    colorPalette: {
      primary: '#fafafa',
      secondary: '#a1a1aa',
      accent: '#fcd34d',
      background: '#09090b',
      text: '#fafafa',
    },
    typography: {
      heading: 'font-serif tracking-tight',
      body: 'font-sans text-zinc-400',
    },
    preview: {
      gradient: 'from-zinc-900 to-zinc-950',
      icon: '✨',
    },
  },
  {
    id: 'cyberpunk-neon',
    name: 'Cyberpunk Neon',
    description: 'Neon-lit, futuristic aesthetic',
    promptFragment: `
STYLE: Cyberpunk Neon
- Background: Pure black (bg-black) with neon glow overlays
- Typography: Monospace or tech fonts, glitchy effects welcome
- Colors: Cyan, magenta, electric blue (text-cyan-400, text-fuchsia-500)
- Borders: Neon glow effect (border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.5)])
- Glassmorphism: Heavy use (bg-black/50 backdrop-blur-xl border border-cyan-500/30)
- Animations: Glitch effects, scanlines, pulsing neon
- Hero: Dark with vibrant neon accents, maybe grid patterns
- Product Cards: Dark glass with neon borders on hover
- Scanlines: Optional CSS overlay for retro CRT effect
`,
    colorPalette: {
      primary: '#22d3ee',
      secondary: '#d946ef',
      accent: '#3b82f6',
      background: '#000000',
      text: '#22d3ee',
    },
    typography: {
      heading: 'font-mono tracking-wider uppercase',
      body: 'font-mono text-cyan-400/80',
    },
    preview: {
      gradient: 'from-cyan-500/20 to-fuchsia-500/20',
      icon: '⚡',
    },
  },
  {
    id: 'streetwear-dark',
    name: 'Streetwear Dark',
    description: 'Bold, urban, high-contrast',
    promptFragment: `
STYLE: Streetwear Dark
- Background: Deep black/charcoal (bg-zinc-950)
- Typography: Heavy, bold sans-serif (text-6xl font-black tracking-tighter)
- Colors: High contrast with vibrant accents (bg-red-500, bg-orange-500)
- Imagery: Strong, bold product photos, grunge textures
- Layout: Asymmetric, editorial-style grids
- Hero: Massive typography, maybe overlapping elements
- Product Cards: Bold borders, dramatic hover states
- Animations: Snappy, punchy transitions (not subtle)
- Overall: Urban, confident, in-your-face aesthetic
`,
    colorPalette: {
      primary: '#ffffff',
      secondary: '#a1a1aa',
      accent: '#ef4444',
      background: '#09090b',
      text: '#ffffff',
    },
    typography: {
      heading: 'font-black tracking-tighter uppercase',
      body: 'font-bold text-zinc-400',
    },
    preview: {
      gradient: 'from-red-500/30 to-orange-500/20',
      icon: '🔥',
    },
  },
  {
    id: 'kawaii-pop',
    name: 'Kawaii Pop',
    description: 'Cute, playful, pastel colors',
    promptFragment: `
STYLE: Kawaii Pop
- Background: Soft pastels (bg-pink-50, bg-purple-50)
- Typography: Rounded, friendly fonts (rounded-full on buttons too)
- Colors: Soft pink, lavender, mint, peach (text-pink-600, bg-purple-200)
- Borders: Soft, rounded everything (rounded-3xl, rounded-full)
- Shadows: Soft, colorful drop shadows (shadow-lg shadow-pink-200/50)
- Animations: Bouncy, playful (spring animations)
- Hero: Cheerful with cute illustrations or stickers
- Product Cards: Rounded, card-like with soft shadows
- Icons: Cute, emoji-style or hand-drawn feel
- Overall: Warm, inviting, Instagram-friendly aesthetic
`,
    colorPalette: {
      primary: '#ec4899',
      secondary: '#a855f7',
      accent: '#34d399',
      background: '#fdf2f8',
      text: '#831843',
    },
    typography: {
      heading: 'font-bold tracking-tight',
      body: 'font-medium text-pink-800',
    },
    preview: {
      gradient: 'from-pink-300 to-purple-300',
      icon: '🌸',
    },
  },
  {
    id: 'brutalist',
    name: 'Brutalist',
    description: 'Raw, bold, intentionally rough',
    promptFragment: `
STYLE: Brutalist
- Background: Stark white or black, no gradients
- Typography: Bold, harsh, sometimes ALL CAPS (font-black text-black)
- Colors: Black and white with ONE accent color (red or yellow)
- Borders: Thick, visible, harsh (border-4 border-black)
- No shadows: Flat design, 2D feel
- Layout: Asymmetric, unexpected, intentionally "broken" looking
- Hero: Raw, impactful, maybe just massive text
- Product Cards: Simple boxes with thick borders
- Animations: Minimal or jarring (not smooth)
- Overall: Anti-design, punk aesthetic, memorable
`,
    colorPalette: {
      primary: '#000000',
      secondary: '#ffffff',
      accent: '#dc2626',
      background: '#ffffff',
      text: '#000000',
    },
    typography: {
      heading: 'font-black uppercase',
      body: 'font-bold',
    },
    preview: {
      gradient: 'from-white to-zinc-100',
      icon: '◼️',
    },
  },
  {
    id: 'vaporwave',
    name: 'Vaporwave',
    description: 'Retro 80s/90s aesthetic',
    promptFragment: `
STYLE: Vaporwave
- Background: Gradient from purple to pink to teal (bg-gradient-to-br from-purple-900 via-pink-600 to-cyan-400)
- Typography: Retro fonts, sometimes Japanese text mixed in
- Colors: Hot pink, cyan, purple, sunset gradients
- Imagery: Roman busts, palm trees, sunsets, grid patterns
- Grid patterns: Perspective grids (Tron-style)
- Hero: Sunset gradient with silhouette elements
- Product Cards: Neon outlines, holographic effects
- Animations: Slow, dreamy, floating
- Overall: Nostalgic, surreal, internet-culture aesthetic
`,
    colorPalette: {
      primary: '#ec4899',
      secondary: '#06b6d4',
      accent: '#a855f7',
      background: '#3b0764',
      text: '#fdf4ff',
    },
    typography: {
      heading: 'font-bold tracking-widest',
      body: 'font-medium text-pink-200',
    },
    preview: {
      gradient: 'from-purple-600 via-pink-500 to-cyan-400',
      icon: '🌴',
    },
  },
];

/**
 * Get a style profile by ID
 */
export function getStyleProfile(id: string): StyleProfile | undefined {
  return STYLE_PROFILES.find(p => p.id === id);
}

/**
 * Get the default style profile
 */
export function getDefaultStyleProfile(): StyleProfile {
  return STYLE_PROFILES[0]; // Luxury Minimal as default
}

/**
 * Inject style profile into a prompt
 */
export function injectStyleProfile(prompt: string, profileId?: string): string {
  if (!profileId) return prompt;
  
  const profile = getStyleProfile(profileId);
  if (!profile) return prompt;
  
  return `${prompt}\n\n${profile.promptFragment}`;
}
