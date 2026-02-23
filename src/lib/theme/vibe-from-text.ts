/**
 * Prompt-based vibe detection.
 * Deterministic keyword matching — prompt intent overrides palette heuristics.
 */

import { type ThemeVibe } from './theme-vibes';

type VibeKeywords = { vibe: ThemeVibe; keywords: string[]; weight: number };

const VIBE_KEYWORD_MAP: VibeKeywords[] = [
  {
    vibe: 'cyberpunk',
    keywords: ['futuristic', 'neon', 'cyber', 'sci-fi', 'scifi', 'hacker', 'matrix', 'synthwave', 'retrowave', 'vaporwave', 'glitch', 'tech noir'],
    weight: 3,
  },
  {
    vibe: 'luxury',
    keywords: ['luxury', 'premium', 'elegant', 'exclusive', 'high-end', 'highend', 'sophisticated', 'upscale', 'boutique', 'jewel', 'gold', 'marble', 'opulent'],
    weight: 3,
  },
  {
    vibe: 'playful',
    keywords: ['playful', 'fun', 'colorful', 'vibrant', 'cheerful', 'bright', 'energetic', 'kids', 'gaming', 'cartoon', 'whimsical', 'quirky'],
    weight: 3,
  },
  {
    vibe: 'minimal',
    keywords: ['minimal', 'minimalist', 'clean', 'simple', 'zen', 'whitespace', 'bare', 'austere', 'understated', 'stripped'],
    weight: 3,
  },
  {
    vibe: 'corporate',
    keywords: ['corporate', 'saas', 'enterprise', 'b2b', 'business', 'professional', 'dashboard', 'fintech', 'banking', 'consulting', 'agency'],
    weight: 2,
  },
  {
    vibe: 'editorial',
    keywords: ['editorial', 'magazine', 'blog', 'journal', 'newspaper', 'article', 'portfolio', 'gallery', 'photography', 'typography'],
    weight: 2,
  },
  {
    vibe: 'modern',
    keywords: ['modern', 'contemporary', 'sleek', 'sharp', 'startup', 'app', 'landing'],
    weight: 1,
  },
];

/**
 * Detect vibe from user prompt text using weighted keyword matching.
 * Returns null if no strong signal is found (fall back to palette-based detection).
 */
export function detectVibeFromPrompt(prompt: string): ThemeVibe | null {
  if (!prompt || prompt.length < 3) return null;

  const p = prompt.toLowerCase();

  // Score each vibe
  const scores: Record<ThemeVibe, number> = {
    modern: 0,
    luxury: 0,
    playful: 0,
    cyberpunk: 0,
    minimal: 0,
    corporate: 0,
    editorial: 0,
  };

  for (const entry of VIBE_KEYWORD_MAP) {
    for (const kw of entry.keywords) {
      if (p.includes(kw)) {
        scores[entry.vibe] += entry.weight;
      }
    }
  }

  // Find highest scoring vibe
  let bestVibe: ThemeVibe | null = null;
  let bestScore = 0;

  for (const [vibe, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      bestVibe = vibe as ThemeVibe;
    }
  }

  // Only return if we have at least one keyword match
  return bestScore > 0 ? bestVibe : null;
}

/**
 * Merge prompt-detected vibe with palette-detected vibe.
 * Prompt wins when present — palette is fallback.
 */
export function mergeVibeSignals(
  promptVibe: ThemeVibe | null,
  paletteVibe: ThemeVibe
): ThemeVibe {
  return promptVibe ?? paletteVibe;
}
