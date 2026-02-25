

# Fix: FIX Intent Code Extraction Failure

## Problem
When the FIX intent generates valid JSON code, the pipeline reports `NO_CODE_PRODUCED` and rejects it. The model IS producing code, but it's being discarded.

## Root Cause Analysis
The `summary` field in the completed job contains the JSON (`{ "files": { "/storefront/..." } }`), which means `codeResult` was never set. This happens when:

1. **Intent misclassification**: The intent classifier may return something other than "FIX" for auto-triggered error repairs (e.g., if the error prompt doesn't strongly match FIX patterns). When intent != FIX/MODIFY, the fast-path at line 4281 is skipped, and the response falls to the `else` branch (line 4331) which treats the entire response as summary text only.

2. **No fallback**: Even when the raw `fullContent` is clearly valid JSON with a `files` key, the non-fast-path branches don't attempt to detect and extract it.

## Solution: Two-Part Fix

### Part 1: Add JSON Auto-Detection Fallback (Backend)

In the post-stream extraction logic (around line 4327-4335), before the final `else` branch that discards content as summary, add a JSON auto-detection check:

```text
} else {
  // NEW: Auto-detect raw JSON file maps regardless of intent
  // Catches cases where intent was misclassified but model 
  // still returned valid code JSON
  const trimmedFull = fullContent.trim();
  if (trimmedFull.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmedFull);
      if (parsed?.files && typeof parsed.files === 'object') {
        codeResult = trimmedFull;
        summary = intentResult.intent === "FIX" 
          ? "Fix applied." 
          : "Changes applied.";
        // log the rescue
      } else {
        // Check direct file map format
        const keys = Object.keys(parsed);
        if (keys.some(k => k.endsWith('.tsx') || ...)) {
          codeResult = trimmedFull;
          summary = "Changes applied.";
        }
      }
    } catch { /* not JSON, fall through */ }
  }
  
  // Only treat as summary if we couldn't extract code
  if (!codeResult) {
    summary = fullContent.length > 200 
      ? fullContent.substring(0, 200) + '...' 
      : fullContent;
  }
}
```

This ensures that even if intent classification is wrong, valid JSON code is never thrown away.

### Part 2: Harden Intent Classifier for FIX Detection

In the keyword fallback parser (around line 2228), strengthen FIX detection for auto-generated error prompts. These typically contain patterns like `CRITICAL_ERROR_REPORT`, `SyntaxError`, `Unclosed JSX`, `TypeError`, etc. Add these patterns to the FIX detection:

```text
if (upperContent.includes("FIX") || 
    upperContent.includes("ERROR") ||
    upperContent.includes("CRITICAL_ERROR_REPORT") ||
    upperContent.includes("SYNTAXERROR") ||
    upperContent.includes("UNCLOSED") ||
    upperContent.includes("TYPEERROR")) {
  return { intent: "FIX", ... };
}
```

## Files to Modify

- `supabase/functions/vibecoder-v2/index.ts`
  - Add JSON auto-detection fallback in post-stream extraction (around lines 4327-4335)
  - Strengthen FIX intent keyword detection (around line 2228)

## What This Does NOT Touch
- BUILD pipeline (unchanged)
- MODIFY pipeline (unchanged)
- Client-side zero-trust handler (already handles both formats)
- Temperatures, prompts, or routing logic
