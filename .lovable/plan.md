

# VibeCoder Intelligence Layer: Mode Detection, Structural Diff, and Design Intelligence

## Overview

Four changes that shift VibeCoder from infrastructure to product intelligence. These are additive — nothing breaks.

---

## Step 1: Mode Detection (Vision vs Developer)

### What Changes

Add an `interactionMode` field to the intent classifier output. The existing `classifyIntent` function (line 1258) already returns structured JSON — we extend its output schema.

### Files Modified

**`supabase/functions/vibecoder-v2/index.ts`**

1. Update `INTENT_CLASSIFIER_PROMPT` (line 649) to include a new output field:
   ```
   "interactionMode": "vision" | "developer"
   ```
   Add classification rules:
   - "vision": emotional/aesthetic language ("make it feel like", "luxury", "cozy", "bold", "clean")
   - "developer": technical language ("CSS grid", "memoize", "useEffect", "flex", "z-index", "component")

2. Update `IntentClassification` interface (line 1250) to add:
   ```typescript
   interactionMode: "vision" | "developer";
   ```

3. Update `classifyIntent` response parsing (line 1306) to extract `interactionMode`, defaulting to `"vision"`.

4. Update `executeIntent` (line 1482) to inject mode-specific behavior:
   - **Vision mode**: Add a prompt injection that says "The user is non-technical. Focus on creative interpretation. Translate their emotional language into concrete design decisions. Be opinionated about layout, color, and spacing."
   - **Developer mode**: Add a prompt injection that says "The user is technical. Apply surgical precision. Respect exact CSS/React terminology. Do not interpret — execute literally."

### No Frontend Changes Required

The mode detection is invisible to the user — it just makes the AI smarter. The classifier already runs on every request.

---

## Step 2: Structural Diff Engine

### What Changes

Add a diff-awareness layer to the MODIFY intent path. Instead of the AI receiving "here is the full file, change X", it receives a hint about what changed in the last generation, reducing hallucinated regressions.

### Files Modified

**`supabase/functions/vibecoder-v2/index.ts`**

1. Add a `computeFileDiff` helper function that compares the incoming `projectFiles` against the previous `last_valid_files` snapshot and produces a lightweight diff summary:
   ```typescript
   function computeFileDiff(
     prevFiles: Record<string, string>,
     newFiles: Record<string, string>
   ): { added: string[]; removed: string[]; modified: string[]; unchanged: string[] }
   ```
   This is NOT a line-level diff — it's a file-level inventory that tells the AI "these files exist, these changed, these are new."

2. In `executeIntent` (line 1611), when building the code context for MODIFY/FIX intents with multi-file projects, inject a `FILE_INVENTORY` block before the file contents:
   ```
   FILE INVENTORY (do NOT modify unchanged files):
   - UNCHANGED: /storefront/components/Hero.tsx, /storefront/routes/Home.tsx
   - MODIFIED LAST TIME: /storefront/Layout.tsx
   - NEW: (none)
   
   Only output files you are actually changing.
   ```

3. Fetch `last_valid_files` from `vibecoder_projects` table at the start of the request (when `requestProjectId` is available) so the diff can be computed.

### Why File-Level Not Line-Level

Line-level diffs are expensive to compute server-side and unreliable with AI output. File-level inventory is cheap (just key comparison) and achieves the same goal: telling the AI which files to leave alone.

---

## Step 3: Compile-Fix Second Retry (Controlled)

### What Changes

The current repair loop (line 2238) does one attempt with the same model. Add a single lateral retry: if the primary model's repair fails, try the other premium model before aborting.

### Files Modified

**`supabase/functions/vibecoder-v2/index.ts`**

1. In the compile-fix loop (line 2250), after a repair attempt fails (`repaired` is null), add one lateral retry:
   ```typescript
   if (!repaired) {
     // Lateral retry: try the other premium model
     const lateralConfig = PREMIUM_FALLBACK_CHAIN[generatorConfig.provider];
     if (lateralConfig) {
       console.log(`[CompileFix] Primary repair failed, trying lateral: ${lateralConfig.provider}`);
       repaired = await repairBrokenFile(err.file, fileMap[err.file], err.error, lateralConfig);
     }
   }
   ```

2. This adds exactly one more repair attempt (2 total max), then abort. Matches the "stability over complexity" principle.

---

## Step 4: Storefront Design Intelligence (Brand Layer)

### What Changes

When the user uses emotional/vision language ("make it dark and futuristic"), the AI should update theme tokens holistically — not just random class edits. This connects the existing `theme-vibes.ts` system to the AI generation pipeline.

### Files Modified

**`supabase/functions/vibecoder-v2/index.ts`**

1. Add a `BRAND_LAYER_PROMPT` injection for vision-mode requests that contain style/vibe keywords. This goes into `executeIntent` when `interactionMode === "vision"` AND the prompt matches vibe keywords (reuse the keyword map from `vibe-from-text.ts`):

   ```
   DESIGN INTELLIGENCE: BRAND LAYER
   When the user describes a feeling or aesthetic, update the ENTIRE design system coherently:
   1. /storefront/theme.ts — Update color tokens, spacing scale, border radius, typography
   2. Component files — Apply the theme tokens consistently (use CSS variables, not hardcoded colors)
   
   VIBE MAP:
   - "luxury/premium/elegant" → Dark backgrounds, serif headings, wide spacing, subtle borders, gold accents
   - "futuristic/neon/cyber" → Near-black bg, neon accent colors, tight spacing, sharp corners, glow effects
   - "playful/fun/colorful" → Vibrant palette, rounded corners, bouncy animations, bold typography
   - "minimal/clean/simple" → Maximum whitespace, thin fonts, no decorative elements, monochrome
   - "corporate/professional" → Blue accents, system fonts, structured grid, subtle shadows
   
   CRITICAL: When changing the vibe, update theme.ts AND ensure components reference theme tokens.
   Never scatter hardcoded colors — centralize in theme.ts.
   ```

2. Add vibe keyword detection to the backend (port the keyword map from `vibe-from-text.ts`):
   ```typescript
   function detectVibeIntent(prompt: string): string | null {
     // Same keyword matching as vibe-from-text.ts
     // Returns: "luxury" | "cyberpunk" | "playful" | "minimal" | "corporate" | "editorial" | null
   }
   ```

3. When a vibe is detected AND mode is "vision", inject the brand layer prompt AND append to the user message:
   ```
   DETECTED VIBE: luxury
   Apply the "luxury" design system comprehensively across all affected files.
   ```

### No New Files Required

This leverages the existing `theme-vibes.ts` intelligence but surfaces it to the AI code generation pipeline. The theme system already exists on the client side — we're just teaching the AI to use it properly.

---

## Summary of All Changes

| File | Change |
|------|--------|
| `supabase/functions/vibecoder-v2/index.ts` | Add interactionMode to classifier, file inventory diff, lateral repair retry, brand layer prompt injection |

All changes are in a single file. No new files. No database changes. No frontend changes. Pure backend intelligence upgrade.

## Execution Order

1. Mode Detection (extends classifier — foundational)
2. Brand Layer (depends on mode detection)
3. File Inventory Diff (independent)
4. Lateral Repair Retry (independent, 5-line change)

All four can be implemented in a single edge function update and deployment.

