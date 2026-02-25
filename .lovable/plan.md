

# Fix: Remove FIX/MODIFY Fast-Path, Unify Code Extraction

## Problem
The FIX/MODIFY fast-path at line 4281 creates a fragile coupling:
- If intent is correctly classified as FIX/MODIFY, fast-path works
- If intent is misclassified (e.g., auto-triggered error reports not tagged as FIX), the raw JSON response skips the fast-path, falls to the `else` branch, and gets discarded as summary text
- Result: `NO_CODE_PRODUCED` even though the model returned valid code

## Root Cause
The fast-path creates a single point of failure tied to intent classification accuracy. When it misses, there's no recovery.

## Solution: Remove Fast-Path, Unify Extraction

### Step 1: Delete the MODIFY/FIX Fast-Path (lines 4281-4287)

Remove this entire block:
```text
if (intentResult.intent === "MODIFY" || intentResult.intent === "FIX") {
  codeResult = fullContent
    .replace(/^```(?:json|tsx?|jsx?)?\s*\n?/i, '')
    .replace(/\n?```\s*$/i, '')
    .trim();
  summary = intentResult.intent === "FIX" ? "Fix applied." : "Modification applied.";
  console.log(...);
}
```

### Step 2: Unified Flow

After removal, ALL intents follow the same extraction chain:

1. Check for `=== CODE ===` section (BUILD structured responses)
2. Check for `/// TYPE: CHAT ///` (chat-only responses)
3. **Auto-detect rescue** (catches raw JSON from FIX/MODIFY regardless of intent classification)

The auto-detect rescue (already at lines 4331-4365) handles both:
- `{ "files": { "/path": "content" } }` (object map)
- `{ "files": [{ "path": "...", "content": "..." }] }` (array format)
- Direct file maps: `{ "/path.tsx": "content" }`

### Step 3: Strengthen Auto-Detect with Schema Normalization

Inside the auto-detect rescue, after successfully parsing JSON, normalize the `files` format so downstream validation always receives a consistent structure. Convert object maps to the expected format before setting `codeResult`.

### Step 4: Add Intent-Aware Summary Defaults

In the auto-detect rescue, set appropriate summary text:
- FIX intent: "Fix applied."
- MODIFY intent: "Modification applied."
- Other: "Changes applied."

## File to Modify

- `supabase/functions/vibecoder-v2/index.ts`
  - Remove lines 4281-4287 (fast-path block)
  - Adjust the `else if` at line 4288 to become the primary `if` check
  - The auto-detect rescue at lines 4331-4365 already handles the fallback

## What Changes

- FIX responses: raw JSON -> auto-detect rescue -> `codeResult` set -> validation gates
- MODIFY responses: raw JSON -> auto-detect rescue -> `codeResult` set -> validation gates  
- BUILD responses: structured sections -> `=== CODE ===` parser -> validation gates (unchanged)

## What Does NOT Change

- FIX/MODIFY prompts (still instruct raw JSON output)
- BUILD pipeline (still uses structured sections)
- Zero-trust validation gates
- Temperature settings
- Intent classifier (already hardened for FIX detection)

## Why This Works

The auto-detect rescue is intent-agnostic. It checks the actual content structure, not the intent label. This means:
- Correct intent classification: works (auto-detect finds JSON)
- Wrong intent classification: still works (auto-detect finds JSON)
- No more single point of failure tied to intent routing

