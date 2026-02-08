
# VibeCoder 3.0: Multi-Agent Architecture Overhaul

## The Problem

The current VibeCoder is fundamentally a "one-shot" generator that attempts to stream 500+ lines of TSX in a single burst. This causes:

1. **Truncation Crashes**: The AI hits token limits mid-code, producing incomplete TSX like trailing `<` characters
2. **Preview Corruption**: Partial/invalid code gets applied to Sandpack, triggering the "Cannot set property attributeName" crash loop
3. **State Contamination**: No isolation between "what project generated this" and "what project am I viewing"
4. **No Recovery Path**: When code is truncated, there's no way to resume or self-correct

## Root Cause Analysis

```text
+-------------------+       +------------------+       +------------------+
|  User Prompt      | ----> |  Single AI Call  | ----> |  Stream to       |
|  "Build a store"  |       |  (8K token max)  |       |  Preview         |
+-------------------+       +------------------+       +------------------+
                                    |
                                    v
                           TOKEN LIMIT HIT
                           mid-className="...
                                    |
                                    v
                           SANDPACK CRASH
```

## The Solution: Multi-Agent Pipeline

Instead of one monolithic code generation, we split into discrete stages with checkpoints:

```text
+-------------+     +-------------+     +---------------+     +---------------+
|  ARCHITECT  | --> |  BUILDER    | --> |  LINTER       | --> |  DONE         |
|  (Plan)     |     |  (Component |     |  (Verify +    |     |               |
|             |     |   at a time)|     |   Self-Fix)   |     |               |
+-------------+     +-------------+     +---------------+     +---------------+
     ^                    |                    |
     |                    v                    v
     |              [Checkpoint]         [Checkpoint]
     +--- Retry if failed ---+--- Retry if failed ---+
```

---

## Implementation Plan

### Phase 1: Atomic Component Pipeline (Backend)

**Problem Solved**: Truncation crashes from generating too much code at once

**Changes to `supabase/functions/vibecoder-v2/index.ts`**:

1. **Add ARCHITECT_MODE**: When enabled, AI outputs a JSON file-tree map instead of code
   - List of components to create (Hero, ProductGrid, Footer, etc.)
   - Estimated complexity per component
   - Dependencies between components

2. **Add BUILDER_MODE**: Generates ONE component at a time
   - Each component is a small, completable chunk (< 150 lines)
   - Uses `/// COMPONENT_START: Hero ///` and `/// COMPONENT_END ///` markers
   - Failed component = retry just that component, not the whole thing

3. **Add Completion Sentinel**: Every code block MUST end with `// --- VIBECODER_COMPLETE ---`
   - If this marker is missing, the output is considered truncated
   - Triggers automatic "Ghost Fixer" retry for just the missing part

### Phase 2: Component Assembly Engine (Frontend)

**Problem Solved**: Preview crashes from partial code application

**Changes to `src/components/ai-builder/useStreamingCode.ts`**:

1. **Component Buffer**: Don't update preview until a complete component arrives
   - Accumulate tokens until `/// COMPONENT_END ///` marker
   - Validate each component independently before merging

2. **Incremental Preview**: Merge validated components into the main App.tsx
   - Keep a "skeleton" App.tsx that imports components
   - Each completed component gets injected into the skeleton
   - Sandpack only sees complete, valid code

3. **Completion Sentinel Check**: Before ANY code update:
   ```typescript
   if (!code.includes('// --- VIBECODER_COMPLETE ---')) {
     console.error('Truncated output detected - triggering Ghost Fixer');
     return triggerSelfCorrection(code);
   }
   ```

### Phase 3: Ghost Fixer (Self-Correction Loop)

**Problem Solved**: Dead-end states when AI output is truncated

**New file: `src/hooks/useGhostFixer.ts`**:

1. **Truncation Detection**: When `VIBECODER_COMPLETE` marker is missing
2. **Automatic Retry**: Call AI with "Continue from: [last 200 chars of code]"
3. **Merge Logic**: Stitch the continuation onto the existing code
4. **Max Retries**: 3 attempts before failing gracefully with the last-known-good snapshot

### Phase 4: Shadow Tester (Runtime Validation)

**Problem Solved**: Sandpack crashes from valid-syntax but runtime-broken code

**Changes to preview handling**:

1. **Hidden Sandpack Instance**: Render a second, invisible Sandpack
2. **Pre-Flight Check**: Apply new code to shadow instance first
3. **Wait for Build**: Only if shadow builds successfully, apply to main preview
4. **Error Isolation**: Shadow crashes don't affect main preview

### Phase 5: Project Lock Enforcement

**Problem Solved**: Race conditions where AI writes to wrong project

**Changes to `src/hooks/useAgentLoop.ts`**:

1. **Hard Lock**: Generation is locked to `projectId` at start
2. **Validation on Every Update**: Before ANY state update, verify lock matches active project
3. **Automatic Abort**: If project changed mid-generation, discard all pending updates

---

## Technical Implementation Details

### Backend Changes (Edge Function)

**File**: `supabase/functions/vibecoder-v2/index.ts`

```typescript
// NEW: Multi-stage prompt structure
const ARCHITECT_PROMPT = `You are a UI Architect.
OUTPUT FORMAT: JSON only, no code.
{
  "plan": {
    "components": [
      { "name": "Hero", "complexity": "medium", "lines": 80 },
      { "name": "ProductGrid", "complexity": "high", "lines": 120 }
    ],
    "order": ["Hero", "ProductGrid", "Footer"]
  }
}`;

const BUILDER_PROMPT = `You are building component: {COMPONENT_NAME}
START with: /// COMPONENT_START: {COMPONENT_NAME} ///
END with: /// COMPONENT_END ///
FINAL LINE MUST BE: // --- VIBECODER_COMPLETE ---
MAX LINES: 150
If you cannot complete, output what you have and I will continue.`;
```

### Frontend Changes

**File**: `src/components/ai-builder/useStreamingCode.ts`

Key additions:
- `parseComponentChunks(stream)`: Extract individual components from stream
- `validateComponent(code)`: Check syntax + completion sentinel
- `mergeIntoSkeleton(skeleton, components)`: Build final App.tsx from parts

**File**: `src/hooks/useGhostFixer.ts` (NEW)

```typescript
export function useGhostFixer() {
  const triggerContinuation = async (
    truncatedCode: string,
    originalPrompt: string
  ) => {
    const continuationPrompt = `
      CONTINUE FROM THIS EXACT POINT:
      ${truncatedCode.slice(-200)}
      
      Complete the code and end with:
      // --- VIBECODER_COMPLETE ---
    `;
    // Call vibecoder-v2 with continuation prompt
  };
  
  return { triggerContinuation };
}
```

---

## Migration Path

This is a significant change. Here's how we roll it out safely:

1. **Phase 1**: Add completion sentinel to existing prompt (low risk)
2. **Phase 2**: Add Ghost Fixer for truncation recovery (medium risk)  
3. **Phase 3**: Add component chunking to backend (needs testing)
4. **Phase 4**: Add Shadow Tester for preview safety (performance impact)
5. **Phase 5**: Enable full multi-agent pipeline

Each phase can be toggled via feature flags in the edge function.

---

## Expected Outcomes

| Issue | Before | After |
|-------|--------|-------|
| Truncation crashes | Common (every ~10 prompts) | Rare (auto-recovered) |
| Preview white screen | Frequent | Never (shadow testing) |
| Wrong project writes | Possible | Impossible (hard lock) |
| "Cannot set attributeName" | Every session | Never (nuclear suppression + shadow test) |
| Recovery from errors | Manual history restore | Automatic Ghost Fixer |

---

## Files to Modify

1. `supabase/functions/vibecoder-v2/index.ts` - Add multi-stage prompts, completion sentinel
2. `src/components/ai-builder/useStreamingCode.ts` - Component buffering, sentinel validation
3. `src/hooks/useAgentLoop.ts` - Hard project locking, abort on mismatch
4. `src/hooks/useGhostFixer.ts` (NEW) - Auto-continuation for truncated output
5. `src/components/ai-builder/AIBuilderCanvas.tsx` - Integrate Ghost Fixer, improve error handling
6. `src/main.tsx` - Harden global error suppression

---

## Immediate Quick Fixes (Can Do Now)

Before the full refactor, these quick wins will reduce crashes:

1. **Completion Sentinel**: Add `// --- VIBECODER_COMPLETE ---` requirement to backend
2. **Sentinel Check**: Frontend rejects any code missing the sentinel
3. **Better lastGoodCodeRef**: Never lose the last working snapshot
4. **Aggressive JSON filtering**: Never apply anything that looks like JSON to preview

These can be shipped today while the full multi-agent pipeline is built out.
