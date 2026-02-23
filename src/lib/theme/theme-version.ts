/**
 * Theme Schema Versioning & Migration
 * Ensures stored themes can be safely upgraded when tokens change.
 */

import { ThemeTokens } from './theme-tokens';
import { DEFAULT_THEME } from './theme-presets';

export const THEME_SCHEMA_VERSION = 2;

/**
 * Versioned theme envelope for storage.
 */
export interface VersionedTheme {
  version: number;
  tokens: ThemeTokens;
  presetId: string;
  source: string;
  locked: boolean;
}

/**
 * Migrate a stored theme to the current schema version.
 * Fills missing token keys with defaults — never removes existing keys.
 */
export function migrateTheme(raw: Record<string, unknown>): VersionedTheme {
  const version = (raw.version as number) || 1;
  const tokens = (raw.tokens as Record<string, string>) || {};

  // Fill any missing keys from defaults
  const defaults = DEFAULT_THEME.tokens;
  const migrated: ThemeTokens = { ...defaults };
  for (const key of Object.keys(defaults) as (keyof ThemeTokens)[]) {
    if (tokens[key] !== undefined) {
      migrated[key] = tokens[key];
    }
  }

  return {
    version: THEME_SCHEMA_VERSION,
    tokens: migrated,
    presetId: (raw.presetId as string) || 'none',
    source: (raw.source as string) || 'preset',
    locked: (raw.locked as boolean) || false,
  };
}

/**
 * Check if a stored theme needs migration.
 */
export function needsMigration(raw: Record<string, unknown>): boolean {
  return !raw.version || (raw.version as number) < THEME_SCHEMA_VERSION;
}
