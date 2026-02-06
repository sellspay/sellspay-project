/**
 * SemVer Versioning System for SellsPay Platform Updates
 */

import { supabase } from "@/integrations/supabase/client";

export interface Version {
  major: number;
  minor: number;
  patch: number;
}

/**
 * Parse a version string into its components
 * @example parseVersion("2.1.0") => { major: 2, minor: 1, patch: 0 }
 */
export function parseVersion(versionStr: string): Version {
  const match = versionStr.match(/^v?(\d+)\.(\d+)\.(\d+)$/);
  if (!match) {
    return { major: 0, minor: 0, patch: 0 };
  }
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
  };
}

/**
 * Format a version object into a string
 * @example formatVersion({ major: 2, minor: 1, patch: 0 }) => "2.1.0"
 */
export function formatVersion(v: Version): string {
  return `${v.major}.${v.minor}.${v.patch}`;
}

/**
 * Increment a version based on the type of change
 */
export function incrementVersion(
  current: Version,
  type: "major" | "minor" | "patch"
): Version {
  switch (type) {
    case "major":
      return { major: current.major + 1, minor: 0, patch: 0 };
    case "minor":
      return { major: current.major, minor: current.minor + 1, patch: 0 };
    case "patch":
      return { major: current.major, minor: current.minor, patch: current.patch + 1 };
  }
}

/**
 * Get the latest version from the database
 */
export async function getLatestVersion(): Promise<Version> {
  const { data, error } = await supabase
    .from("platform_updates")
    .select("version_number")
    .not("version_number", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data?.version_number) {
    // Default to 2.0.0 if no versions exist (VibeCoder 2.0 baseline)
    return { major: 2, minor: 0, patch: 0 };
  }

  return parseVersion(data.version_number);
}

/**
 * Generate the next version number based on type
 */
export async function getNextVersion(type: "major" | "minor" | "patch"): Promise<string> {
  const current = await getLatestVersion();
  const next = incrementVersion(current, type);
  return formatVersion(next);
}

/**
 * Version type labels for display
 */
export const VERSION_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  major: { label: "Major", color: "bg-red-500" },
  minor: { label: "Minor", color: "bg-blue-500" },
  patch: { label: "Patch", color: "bg-amber-500" },
};

/**
 * Category labels for changelog entries
 */
export const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  announcement: { label: "Announcement", color: "bg-purple-500" },
  feature: { label: "Added", color: "bg-emerald-500" },
  improvement: { label: "Improved", color: "bg-blue-500" },
  fix: { label: "Fixed", color: "bg-amber-500" },
  marketplace: { label: "Marketplace", color: "bg-violet-500" },
};
