/**
 * Design Memory System
 * Tracks user style preferences across sessions to bias future auto-themes.
 */

import { type ThemeVibe } from './theme-vibes';

export interface DesignProfile {
  preferredVibe: ThemeVibe | null;
  avgSaturation: number;      // 0-100
  avgRadius: number;           // px
  preferredDensity: 'compact' | 'comfortable' | 'spacious';
  editCount: number;
  lastUpdated: number;         // timestamp
}

const STORAGE_KEY = 'vibe-design-memory';

const DEFAULT_PROFILE: DesignProfile = {
  preferredVibe: null,
  avgSaturation: 50,
  avgRadius: 12,
  preferredDensity: 'comfortable',
  editCount: 0,
  lastUpdated: Date.now(),
};

export function loadDesignProfile(): DesignProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PROFILE };
    return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_PROFILE };
  }
}

export function saveDesignProfile(profile: DesignProfile): void {
  try {
    profile.lastUpdated = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // quota exceeded
  }
}

/**
 * Learn from a manual theme edit — adjust memory toward user preference.
 * Uses exponential moving average so recent edits weigh more.
 */
export function learnFromEdit(
  current: DesignProfile,
  opts: {
    vibe?: ThemeVibe;
    saturation?: number;
    radius?: number;
    density?: 'compact' | 'comfortable' | 'spacious';
  }
): DesignProfile {
  const alpha = 0.3; // learning rate
  const updated = { ...current, editCount: current.editCount + 1 };

  if (opts.vibe) updated.preferredVibe = opts.vibe;
  if (opts.saturation !== undefined) {
    updated.avgSaturation = current.avgSaturation * (1 - alpha) + opts.saturation * alpha;
  }
  if (opts.radius !== undefined) {
    updated.avgRadius = current.avgRadius * (1 - alpha) + opts.radius * alpha;
  }
  if (opts.density) updated.preferredDensity = opts.density;

  saveDesignProfile(updated);
  return updated;
}
