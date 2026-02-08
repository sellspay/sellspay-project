
# VibeCoder 3.0: Master Architect Agentic Protocol Implementation

## Executive Summary

Upgrade VibeCoder from a "one-shot" code generator to a **Plan-Act-Verify** multi-agent system. This prevents the recurring "Unterminated string" crashes by ensuring the AI never attempts to output 500+ lines in a single breath.

---

## Current State Analysis

The codebase already has foundational pieces in place:
- **Intent Classifier** (Stage 1) - Detects BUILD/MODIFY/QUESTION/FIX/REFUSE
- **Completion Sentinel** - `// --- VIBECODER_COMPLETE ---` marker
- **Ghost Fixer Hook** - `useGhostFixer.ts` for truncation recovery
- **Architect Mode** - Plan-before-code protocol (partially implemented)
- **Agent Loop** - `useAgentLoop.ts` with project locking

**What's Missing:**
1. The Architect Mode isn't being triggered properly - it's opt-in instead of mandatory for complex builds
2. Ghost Fixer isn't wired into AIBuilderCanvas (the callback exists but isn't connected)
3. No "Small Breath Rule" enforcement - AI still attempts 500+ line outputs
4. No modular component-by-component generation
5. Plan approval flow exists but doesn't trigger step-by-step execution

---

## Implementation Plan

### Phase 1: Wire Ghost Fixer into AIBuilderCanvas

**Problem**: The `onTruncationDetected` callback exists in `useStreamingCode` but isn't connected to `useGhostFixer` in AIBuilderCanvas.

**Changes to `src/components/ai-builder/AIBuilderCanvas.tsx`**:
1. Import `useGhostFixer` hook
2. Pass `onTruncationDetected` callback to `useStreamingCode`
3. On truncation detection, trigger `triggerContinuation(truncatedCode, originalPrompt)`
4. On fix success, apply the merged code via `setCode()`
5. Add visual feedback during Ghost Fixer retries

---

### Phase 2: Enforce Mandatory Plan Mode for Complex Builds

**Problem**: Architect Mode is opt-in, so users can still trigger massive one-shot builds.

**Changes to `supabase/functions/vibecoder-v2/index.ts`**:
1. Add `COMPLEXITY_THRESHOLD` detection based on prompt analysis
2. If prompt requests multiple components or "full page", force Architect Mode
3. Inject `[ARCHITECT_MODE_ACTIVE]` automatically for complex requests
4. Return a plan JSON that the frontend surfaces for approval

**Complexity Detection Keywords**:
- "full page", "complete storefront", "entire landing"
- Multiple sections: "hero AND products AND testimonials"
- Word count > 30 for the request

---

### Phase 3: Step-by-Step Execution After Plan Approval

**Problem**: When user approves a plan, the AI still tries to build everything at once.

**Changes to `supabase/functions/vibecoder-v2/index.ts`**:
1. Add `STEP_EXECUTOR_PROMPT` - generates ONE component at a time (< 150 lines)
2. Store the plan in the generation job record
3. On plan approval, iterate: `Step 1 → Generate → Validate → Step 2 → Generate → ...`
4. Each step uses the previous step's output as context

**Changes to `src/components/ai-builder/AIBuilderCanvas.tsx`**:
1. Track `currentPlanStep` state (0, 1, 2, ...)
2. On plan approval, call `executeStep(0)`
3. On step completion, increment and call `executeStep(nextStep)`
4. Show progress indicator: "Building Step 2 of 5: ProductGrid"

---

### Phase 4: Modular Component Markers

**Problem**: AI output is monolithic - can't tell where one component ends and another begins.

**Changes to `supabase/functions/vibecoder-v2/index.ts`**:
1. Add `COMPONENT_MARKERS_PROTOCOL` to system prompt
2. Enforce output format:
   ```
   /// COMPONENT_START: Hero ///
   const Hero = () => { ... }
   /// COMPONENT_END ///
   ```
3. Each component must be < 150 lines

**Changes to `src/components/ai-builder/useStreamingCode.ts`**:
1. Add `parseComponentMarkers(rawStream)` function
2. Buffer tokens until `/// COMPONENT_END ///` is seen
3. Validate each component independently before merging
4. Incremental preview: show completed components while streaming continues

---

### Phase 5: Shadow Tester Integration

**Problem**: Valid-looking code can still crash Sandpack at runtime.

**Changes to `src/hooks/useShadowTester.ts`** (already exists, enhance):
1. Add `validateInSandbox(code)` function
2. Before applying code to main preview, run through shadow Sandpack
3. If shadow fails to build, trigger error recovery instead of crashing main

**Changes to `src/components/ai-builder/VibecoderPreview.tsx`**:
1. Add hidden shadow Sandpack instance (invisible to user)
2. Pre-flight validation before main preview update
3. Timeout-based fallback if shadow doesn't respond

---

## Condensed System Prompt Update

The current 650+ line prompt needs condensation. The new "Agentic" prompt structure:

```
### IDENTITY
You are the SellsPay Master Architect, a Senior Creative Director.

### AGENTIC PROTOCOL (Mandatory)
Phase 1: PLANNING
- Before code, output a # PLAN section
- List all files/components to create
- Outline logic steps

Phase 2: EXECUTION (Small Breath Rule)
- No file > 120 lines
- Decompose into sub-components
- End with: // --- VIBECODER_COMPLETE ---

Phase 3: VERIFICATION
- Self-check for truncation
- If incomplete, output partial and wait for continuation

### DESIGN STANDARDS
- Zinc-900/950 backgrounds
- Framer Motion animations
- Inter typography
```

This replaces the repetitive 650 lines with a focused 50-line directive.

---

## File Changes Summary

| File | Changes |
|------|---------|
| `src/components/ai-builder/AIBuilderCanvas.tsx` | Wire Ghost Fixer, add step tracking |
| `src/components/ai-builder/useStreamingCode.ts` | Component marker parsing, incremental preview |
| `src/hooks/useGhostFixer.ts` | Minor fixes for edge cases |
| `src/hooks/useShadowTester.ts` | Full sandbox validation implementation |
| `supabase/functions/vibecoder-v2/index.ts` | Complexity detection, step executor, condensed prompt |
| `src/components/ai-builder/VibecoderChat.tsx` | Step progress UI |

---

## Expected Outcomes

| Issue | Before | After |
|-------|--------|-------|
| Truncation crashes | Every ~10 prompts | Auto-recovered by Ghost Fixer |
| Preview white screen | Frequent | Prevented by Shadow Tester |
| 500+ line single outputs | Common | Impossible (< 150 line rule) |
| Recovery from errors | Manual history restore | Automatic self-correction |
| Complex builds | One massive output | Step-by-step with checkpoints |

---

## Technical Details

### Complexity Detection Logic
```typescript
function shouldForceArchitectMode(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  
  // Explicit multi-component requests
  if (/full page|complete|entire|whole|everything/i.test(lower)) return true;
  
  // Multiple sections mentioned
  const sectionKeywords = ['hero', 'product', 'footer', 'pricing', 'testimonial', 'about', 'faq'];
  const mentionedSections = sectionKeywords.filter(k => lower.includes(k));
  if (mentionedSections.length >= 3) return true;
  
  // Long prompt = complex request
  if (prompt.split(/\s+/).length > 35) return true;
  
  return false;
}
```

### Step Executor Prompt
```typescript
const STEP_EXECUTOR_PROMPT = `You are executing STEP ${stepIndex + 1} of ${totalSteps}.
TARGET COMPONENT: ${stepName}
MAX LINES: 150
PREVIOUS COMPONENTS: ${previousComponents.join(', ')}

Output ONLY this component. Start with:
/// COMPONENT_START: ${stepName} ///
End with:
/// COMPONENT_END ///
// --- VIBECODER_COMPLETE ---`;
```

### Ghost Fixer Integration
```typescript
// In AIBuilderCanvas.tsx
const ghostFixer = useGhostFixer({
  maxRetries: 3,
  onFixAttempt: (attempt) => {
    toast.info(`Auto-fixing truncated code (attempt ${attempt}/3)...`);
  },
  onFixSuccess: (mergedCode) => {
    setCode(mergedCode);
    toast.success('Code recovered successfully!');
  },
  onFixFailure: (reason) => {
    toast.error(`Could not recover: ${reason}`);
  }
});

// Pass to useStreamingCode
useStreamingCode({
  onTruncationDetected: (truncatedCode, originalPrompt) => {
    ghostFixer.triggerContinuation(truncatedCode, originalPrompt);
  }
});
```

---

## Rollout Strategy

1. **Immediate** (Phase 1): Wire Ghost Fixer - fixes truncation now
2. **Next** (Phase 2): Mandatory Plan Mode for complex builds
3. **Then** (Phase 3-4): Step-by-step execution + component markers
4. **Finally** (Phase 5): Shadow Tester for runtime validation

Each phase can be shipped independently and tested before moving to the next.
