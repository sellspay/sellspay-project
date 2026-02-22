/**
 * Code Guardrails — Enterprise-grade protection against catastrophic overwrites.
 *
 * Guards:
 *  1. Length Guard — rejects if output shrinks too much
 *  2. Diff Guard — rejects if too many lines changed (especially for micro-edits)
 *  3. Structure Guard — rejects if key structural elements are removed
 *  4. Confidence Gate — rejects low-confidence generations
 *
 * Also provides:
 *  - Auto-snapshot before every apply
 *  - Rollback to last-known-good snapshot
 *  - Micro-edit detection
 */

// ─── Types ───────────────────────────────────────────────────

export interface GuardResult {
  passed: boolean;
  guard: string;
  message: string;
  details?: Record<string, number | string>;
}

export interface GuardConfig {
  /** Minimum newLen/oldLen ratio. Default 0.4 for normal, 0.7 for micro. */
  minLengthRatio: number;
  /** Max fraction of lines that can change. Default 0.7 for normal, 0.4 for micro. */
  maxDiffRatio: number;
  /** Min newLines/oldLines ratio. Default 0.3 for normal, 0.6 for micro. */
  minLineRatio: number;
  /** Minimum old code length to activate guards (chars). */
  activationThreshold: number;
  /** Minimum confidence score to accept (0-100). */
  minConfidence: number;
}

const NORMAL_CONFIG: GuardConfig = {
  minLengthRatio: 0.4,
  maxDiffRatio: 0.7,
  minLineRatio: 0.3,
  activationThreshold: 200,
  minConfidence: 40,
};

const MICRO_CONFIG: GuardConfig = {
  minLengthRatio: 0.7,
  maxDiffRatio: 0.4,
  minLineRatio: 0.6,
  activationThreshold: 200,
  minConfidence: 50,
};

// ─── Micro-edit Detection ────────────────────────────────────

/** Detect if a prompt is a micro-edit (small, targeted request). */
export function isMicroEdit(prompt: string): boolean {
  const words = prompt.trim().split(/\s+/).filter(w => w.length > 0);
  if (words.length > 20) return false;

  // Patterns that indicate small, surgical requests
  const microPatterns = [
    /^(make|change|update|fix|add|remove|set|swap|replace|move|adjust|tweak)\b/i,
    /^(can you|please)\s+(make|change|update|fix|add|remove)\b/i,
  ];

  const promptLower = prompt.toLowerCase().trim();
  return words.length <= 15 || microPatterns.some(p => p.test(promptLower));
}

// ─── Guard Functions ─────────────────────────────────────────

/** GUARD 1: Length Guard — reject if new code is drastically smaller */
export function lengthGuard(oldCode: string, newCode: string, config: GuardConfig): GuardResult {
  const oldLen = oldCode.length;
  const newLen = newCode.length;
  const ratio = newLen / oldLen;

  if (ratio < config.minLengthRatio) {
    return {
      passed: false,
      guard: 'LENGTH_GUARD',
      message: `Output (${newLen} chars) is only ${Math.round(ratio * 100)}% of original (${oldLen} chars). Rejected to prevent code wipe.`,
      details: { oldLen, newLen, ratio: Math.round(ratio * 100) },
    };
  }

  return { passed: true, guard: 'LENGTH_GUARD', message: 'OK' };
}

/** GUARD 2: Diff Guard — reject if too many lines changed */
export function diffGuard(oldCode: string, newCode: string, config: GuardConfig): GuardResult {
  const oldLines = oldCode.split('\n');
  const newLines = newCode.split('\n');
  const minLen = Math.min(oldLines.length, newLines.length);

  let changed = 0;
  for (let i = 0; i < minLen; i++) {
    if (oldLines[i] !== newLines[i]) changed++;
  }
  // Lines that only exist in one version count as changes
  changed += Math.abs(oldLines.length - newLines.length);

  const diffRatio = changed / Math.max(oldLines.length, 1);

  if (diffRatio > config.maxDiffRatio) {
    return {
      passed: false,
      guard: 'DIFF_GUARD',
      message: `${Math.round(diffRatio * 100)}% of lines changed (max ${Math.round(config.maxDiffRatio * 100)}% allowed). Rejected to prevent excessive rewrite.`,
      details: { changed, total: oldLines.length, diffRatio: Math.round(diffRatio * 100) },
    };
  }

  return { passed: true, guard: 'DIFF_GUARD', message: 'OK' };
}

/** GUARD 3: Line Count Guard — reject if line count drops dramatically */
export function lineCountGuard(oldCode: string, newCode: string, config: GuardConfig): GuardResult {
  const oldLines = oldCode.split('\n').length;
  const newLines = newCode.split('\n').length;
  const ratio = newLines / Math.max(oldLines, 1);

  if (oldLines > 50 && ratio < config.minLineRatio) {
    return {
      passed: false,
      guard: 'LINE_COUNT_GUARD',
      message: `${oldLines} lines → ${newLines} lines (${Math.round(ratio * 100)}%). Rejected to prevent structural collapse.`,
      details: { oldLines, newLines, ratio: Math.round(ratio * 100) },
    };
  }

  return { passed: true, guard: 'LINE_COUNT_GUARD', message: 'OK' };
}

/** GUARD 4: Structure Guard — reject if key structural patterns are removed */
export function structureGuard(oldCode: string, newCode: string): GuardResult {
  // Count key structural elements in old code
  const countPatterns = (code: string) => ({
    components: (code.match(/(?:function|const)\s+[A-Z][a-zA-Z0-9]*\s*(?:[:=(])/g) || []).length,
    exports: (code.match(/export\s+(?:default\s+)?(?:function|const)/g) || []).length,
    returns: (code.match(/return\s*\(/g) || []).length,
    routes: (code.match(/<Route\b/g) || []).length,
  });

  const old = countPatterns(oldCode);
  const nw = countPatterns(newCode);

  // If old code had multiple components/routes and new has drastically fewer
  if (old.components >= 3 && nw.components <= 1) {
    return {
      passed: false,
      guard: 'STRUCTURE_GUARD',
      message: `${old.components} components reduced to ${nw.components}. Rejected to prevent structural wipe.`,
      details: { oldComponents: old.components, newComponents: nw.components },
    };
  }

  if (old.routes >= 2 && nw.routes === 0) {
    return {
      passed: false,
      guard: 'STRUCTURE_GUARD',
      message: `${old.routes} routes removed entirely. Rejected to prevent navigation wipe.`,
      details: { oldRoutes: old.routes, newRoutes: nw.routes },
    };
  }

  return { passed: true, guard: 'STRUCTURE_GUARD', message: 'OK' };
}

/** GUARD 5: Confidence Gate — reject if AI confidence is too low */
export function confidenceGuard(score: number, config: GuardConfig): GuardResult {
  if (score < config.minConfidence) {
    return {
      passed: false,
      guard: 'CONFIDENCE_GUARD',
      message: `AI confidence ${score}/100 is below minimum ${config.minConfidence}. Rejected.`,
      details: { score, minimum: config.minConfidence },
    };
  }

  return { passed: true, guard: 'CONFIDENCE_GUARD', message: 'OK' };
}

// ─── Combined Safe Apply ─────────────────────────────────────

export interface SafeApplyResult {
  accepted: boolean;
  code: string;
  failedGuards: GuardResult[];
}

/**
 * Run all guards on a code change. Returns whether the change should be applied.
 * If any guard fails, returns the old code with failure details.
 */
export function safeApply(
  oldCode: string,
  newCode: string,
  prompt: string,
  confidenceScore?: number,
): SafeApplyResult {
  // Skip guards for first-time generation (no meaningful old code)
  if (!oldCode || oldCode.length < 200) {
    return { accepted: true, code: newCode, failedGuards: [] };
  }

  const micro = isMicroEdit(prompt);
  const config = micro ? MICRO_CONFIG : NORMAL_CONFIG;

  const guards = [
    lengthGuard(oldCode, newCode, config),
    diffGuard(oldCode, newCode, config),
    lineCountGuard(oldCode, newCode, config),
    structureGuard(oldCode, newCode),
  ];

  // Only check confidence if a score was provided
  if (confidenceScore !== undefined) {
    guards.push(confidenceGuard(confidenceScore, config));
  }

  const failed = guards.filter(g => !g.passed);

  if (failed.length > 0) {
    console.error('🛡️ GUARDRAILS REJECTED:', failed.map(f => `${f.guard}: ${f.message}`).join(' | '));
    return { accepted: false, code: oldCode, failedGuards: failed };
  }

  return { accepted: true, code: newCode, failedGuards: [] };
}

// ─── Snapshot System ─────────────────────────────────────────

const MAX_SNAPSHOTS = 10;
const snapshots: Array<{ code: string; timestamp: number; prompt: string }> = [];

/** Save a snapshot before applying new code */
export function saveSnapshot(code: string, prompt: string): void {
  if (!code || code.length < 50) return;
  snapshots.push({ code, timestamp: Date.now(), prompt });
  if (snapshots.length > MAX_SNAPSHOTS) {
    snapshots.shift();
  }
}

/** Get the last snapshot for rollback */
export function getLastSnapshot(): { code: string; timestamp: number; prompt: string } | null {
  return snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;
}

/** Get all snapshots (for history) */
export function getSnapshots() {
  return [...snapshots];
}
