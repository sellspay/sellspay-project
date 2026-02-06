

# VibeCoder 2.0 → 2.1: Elite Validation Upgrades

## Executive Summary

This plan addresses three critical weaknesses identified in the current VibeCoder pipeline that are causing a ~30% success rate:

1. **The "Blind" Linter** - Currently only reads text, missing runtime crashes
2. **No Visual Validation** - Can't detect design issues (contrast, overlaps)
3. **Flat Credit Pricing** - Simple edits cost the same as full rebuilds

---

## Current Architecture Analysis

### What's Working ✅
- Multi-agent pipeline (Architect → Builder → Linter → Healing)
- SSE streaming with real-time progress updates
- Design tokens injected per style profile
- Static validation catching syntax errors and policy violations
- SDK components preventing "boring" defaults

### Critical Gaps ⚠️

| Gap | Current State | Impact |
|-----|--------------|--------|
| Runtime Errors | Only caught AFTER code reaches frontend Sandpack | User sees red screen, must click "Fix" |
| Healing Context | Frontend error flows through `handleSendMessage()` as new prompt, NOT through orchestrator's healing loop | Healing loop in orchestrator never receives runtime errors |
| Visual QA | None | Unreadable text, broken layouts delivered |
| Credit Granularity | Fixed 3c (Quick) / 8c (Full) | Losing margin on complex builds |

---

## The Fixes

### 1. Headless Runtime Validation ("Ghost Render")

**Problem**: The Linter (`vibecoder-linter`) only performs static text analysis. If the Builder writes `products.map()` without optional chaining, the Linter might pass it, but Sandpack crashes.

**Solution**: Add a "Shadow Render" step in the Orchestrator that attempts a basic JSX transpile + React validation BEFORE delivering code.

**Implementation**:

```text
┌─────────────────────────────────────────────────────────────┐
│                   ORCHESTRATOR FLOW (Updated)               │
├─────────────────────────────────────────────────────────────┤
│  1. ARCHITECT → JSON Plan                                   │
│  2. BUILDER → TSX Code                                      │
│  3. LINTER (Static) → Syntax/Policy Check                   │
│  4. 🆕 SHADOW RENDER → Try esbuild transpile + basic eval   │
│     └─ If fails → Pass real stack trace to HEALING LOOP     │
│  5. DELIVER CODE                                            │
└─────────────────────────────────────────────────────────────┘
```

**Edge Function Changes** (`vibecoder-orchestrator/index.ts`):
- Import esbuild WASM for lightweight transpilation in Deno
- After Linter PASS, attempt `esbuild.transform(code, { loader: 'tsx' })`
- If transpile fails, extract error line/message and trigger healing with `runtimeError` context
- This catches ~80% of crashes (undefined vars, missing imports, JSX syntax) before they reach the user

**Limitations**:
- Cannot catch React-specific runtime errors (hooks in loops, missing keys) without a full React runtime
- True "headless React" (JSDOM + ReactDOMServer) is too heavy for Edge Functions (cold start penalty)
- We're trading off completeness for speed - esbuild catches the most common issues

---

### 2. Smart Healing Loop (Wire Frontend Errors to Backend)

**Problem**: When Sandpack crashes in the user's browser, the error is captured by `handlePreviewError()` which calls `handleSendMessage(errorMsg)`. This creates a NEW generation request instead of feeding into the Orchestrator's self-healing loop.

**Current Flow**:
```text
Sandpack Error → handlePreviewError() → handleSendMessage() → NEW startAgent() call
                                                              ↳ Full pipeline restarts
```

**Desired Flow**:
```text
Sandpack Error → handlePreviewError() → triggerHealingWithContext(error, failedCode)
                                        ↳ Orchestrator receives runtime error
                                        ↳ Builder gets full healing context
```

**Implementation**:

1. **New Edge Endpoint**: Create `vibecoder-heal` that accepts:
   - `runtimeError`: The actual error message from Sandpack
   - `failedCode`: The current code that crashed
   - `architectPlan`: Original plan for context
   - `styleProfile`: Preserve design intent

2. **Frontend Changes** (`useAgentLoop.ts`):
   - Add `healCode(error: string, code: string)` method
   - This calls `vibecoder-heal` directly with runtime context
   - Skips Architect entirely (we're fixing, not rebuilding)

3. **Healing Prompt Enhancement**:
```typescript
const healingPrompt = `
🚨 CRITICAL: The code crashed in the browser with this EXACT error:
"${runtimeError}"

Your previous code that failed:
\`\`\`tsx
${failedCode}
\`\`\`

FIX INSTRUCTIONS:
1. Find the EXACT line causing "${runtimeError}"
2. Apply the minimal fix (add optional chaining, fix import, etc.)
3. Do NOT refactor or change styling
4. Output the COMPLETE fixed file
`;
```

---

### 3. Multimodal Visual Validator (Phase 2 - Future)

**Why Phase 2**: This requires generating a screenshot of the rendered preview, which means:
- The code must first successfully render in Sandpack
- We'd need to capture the iframe content and send to Gemini Vision
- This adds ~3-5 seconds to every generation

**Recommended Approach**:
- Implement as an OPTIONAL "Premium QA" mode users can enable
- Trigger ONLY if static validation passes
- Use `google/gemini-3-pro-preview` with image input for design analysis

**Visual QA Prompt** (for future implementation):
```typescript
const visualQAPrompt = `
Analyze this storefront screenshot for design quality issues:

CHECK FOR:
1. Text readability (contrast ratio, font size)
2. Overlapping elements
3. Broken layouts (elements off-screen, squished)
4. Empty states (missing images showing as broken icons)
5. Mobile responsiveness issues

STYLE PROFILE: ${styleProfile}
Expected mood: ${architectPlan.vibeAnalysis.moodKeywords.join(', ')}

If issues found, describe the EXACT fix needed.
If the design matches the premium ${styleProfile} aesthetic, respond "VISUAL_PASS".
`;
```

**Not Included in This Plan**: This is complex and should be a separate iteration after the healing loop is proven.

---

### 4. Tiered Complexity Credits

**Problem**: A quick "change button color" costs the same as "rebuild entire store with 5 sections".

**Solution**: Use the Architect's `complexityScore` to set dynamic pricing.

**New Credit Tiers**:

| Complexity Score | Description | Credit Cost |
|-----------------|-------------|-------------|
| 1-3 (Low) | Simple edit, single element | 1 credit |
| 4-6 (Medium) | Section change, add component | 5 credits |
| 7-10 (High) | Full page rebuild, multi-section | 15 credits |

**Implementation** (`vibecoder-orchestrator/index.ts`):
- After Architect returns `complexityScore`, calculate credits
- For `skipArchitect` (quick edit), default to Low tier
- Deduct appropriate amount before Builder runs

**UI Changes** (`ChatInputBar.tsx`):
- Show estimated credit cost BEFORE sending
- "This will use ~5 credits based on complexity"

---

## Technical Implementation Details

### Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/vibecoder-orchestrator/index.ts` | Add shadow render step, tiered credits, healing context |
| `supabase/functions/vibecoder-heal/index.ts` | NEW - Dedicated healing endpoint |
| `supabase/functions/vibecoder-builder/index.ts` | Enhanced healing prompt format |
| `src/hooks/useAgentLoop.ts` | Add `healCode()` method for runtime errors |
| `src/components/ai-builder/AIBuilderCanvas.tsx` | Wire `handlePreviewError` to new healing flow |
| `supabase/functions/deduct-ai-credits/index.ts` | Support tiered pricing |

### New Dependencies

For shadow rendering in Deno Edge Functions:
```typescript
// Use esbuild WASM for lightweight transpilation
import * as esbuild from "https://deno.land/x/esbuild@v0.20.1/wasm.js";
```

---

## Implementation Order

1. **Phase 1a**: Smart Healing Loop (wire frontend errors to backend)
   - Highest impact, fixes the "user clicks Fix, AI apologizes" loop
   
2. **Phase 1b**: Shadow Render in Orchestrator
   - Catch transpile errors before they reach the user
   
3. **Phase 1c**: Tiered Credit Pricing
   - Protect margins on expensive generations

4. **Phase 2** (Future): Visual Validator
   - Premium feature, requires more infrastructure

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| First-attempt success rate | ~30% | 70%+ |
| Healing loop effectiveness | ~10% (AI apologizes) | 80%+ (actually fixes) |
| Average attempts per generation | 2.5 | 1.3 |
| Credit margin on complex builds | Negative | Positive |

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| esbuild WASM cold start in Edge Functions | Lazy-load only when needed, cache initialization |
| Healing loop infinite retry | Hard cap at 2 retries (already implemented) |
| Tiered pricing confuses users | Show estimate before send, clear breakdown after |

