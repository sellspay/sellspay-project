
# VibeCoder 2.0: Multi-Agent AI Operating System Upgrade

This plan transforms VibeCoder from a single-prompt code generator into a sophisticated **multi-agent AI pipeline** with self-healing, visual verification, and specialized model roles.

---

## Current State Analysis

**What exists today:**
- Single-model architecture (Gemini 3 Flash Preview as primary)
- ~650-line monolithic system prompt in `vibecoder-v2/index.ts`
- Basic agent loop with simulated steps (planning → reading → writing → verifying)
- Sandpack preview with error detection
- Policy guardrail system for forbidden requests
- Context injection with current code + user prompt

**Key limitations:**
1. No true multi-agent pipeline - the "Agent Loop" is UI-only simulation
2. No actual linting/verification before user sees code
3. No visual feedback (screenshot analysis)
4. Repetitive designs due to monolithic prompt
5. Context window pollution from large system prompt

---

## The "God-Tier" Architecture

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                         USER SENDS PROMPT                                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  STAGE 1: ARCHITECT AGENT (Claude/Gemini Pro)                               │
│  ─────────────────────────────────────────────────────────────────────────  │
│  • Analyzes prompt complexity & intent                                      │
│  • Creates SPEC document (visual style, components, data flow)              │
│  • Outputs structured JSON plan with steps                                  │
│  • Estimates token cost & identifies potential pitfalls                     │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  STAGE 2: BUILDER AGENT (Gemini Pro / GPT-5)                                │
│  ─────────────────────────────────────────────────────────────────────────  │
│  • Receives Architect's plan + style profile                                │
│  • Generates React/TSX code following the blueprint                         │
│  • Uses pruned context (only relevant existing code)                        │
│  • Streams code to "Shadow Sandpack" (invisible to user)                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  STAGE 3: LINTER AGENT (Gemini Flash - cheap & fast)                        │
│  ─────────────────────────────────────────────────────────────────────────  │
│  • Scans code for syntax errors, missing imports, undefined vars            │
│  • Checks marketplace policy compliance                                     │
│  • Evaluates design fidelity vs Architect's spec                           │
│  • Returns JSON verdict: { verdict: "PASS"|"FAIL", explanation: "..." }    │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                    ┌────────────────┴────────────────┐
                    │                                 │
                    ▼                                 ▼
              ┌──────────┐                     ┌──────────────┐
              │  PASS    │                     │    FAIL      │
              └──────────┘                     └──────────────┘
                    │                                 │
                    │                                 ▼
                    │                    ┌─────────────────────────┐
                    │                    │  SELF-HEAL LOOP         │
                    │                    │  (Max 2 retries)        │
                    │                    │  Builder receives error │
                    │                    │  and fixes specific bug │
                    │                    └─────────────────────────┘
                    │                                 │
                    │                                 │
                    ▼                                 │
┌─────────────────────────────────────────────────────────────────────────────┐
│  STAGE 4: VISUAL VALIDATOR (Future - Gemini Vision)                         │
│  ─────────────────────────────────────────────────────────────────────────  │
│  • Takes screenshot of rendered preview                                     │
│  • Asks: "Does this match a premium marketplace store?"                     │
│  • Flags alignment issues, overlapping elements, broken layouts             │
│  • (Phase 2 enhancement - optional for V1)                                  │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  USER SEES VERIFIED, WORKING CODE                                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Plan

### Phase 1: Multi-Agent Backend Infrastructure

**1.1 Create Edge Function: `vibecoder-architect`**
- New Supabase Edge Function dedicated to the Architect role
- Uses `google/gemini-3-pro-preview` or `openai/gpt-5` for deep reasoning
- Input: User prompt + existing code summary + user's products/collections
- Output: Structured JSON plan with:
  - `vibeAnalysis`: visual style, color palette, typography
  - `componentArchitecture`: list of components, state management
  - `executionSteps`: 3-6 actionable steps
  - `debugForecast`: potential pitfalls for the Builder

**1.2 Create Edge Function: `vibecoder-builder`**
- Dedicated Builder agent receiving the Architect's plan
- Uses `google/gemini-3-flash-preview` for fast code generation
- Receives pruned context (only the specific component being edited)
- Outputs full TSX code with style profile enforcement

**1.3 Create Edge Function: `vibecoder-linter`**
- Ultra-fast validation agent using `google/gemini-2.5-flash-lite` (free tier)
- Input: Generated code + Architect's spec
- Output: JSON verdict with `PASS/FAIL` and error location
- Checks:
  - Syntax validity (closures, brackets)
  - Import validity (no hallucinated libraries)
  - Policy compliance (no auth, payments, settings)
  - Design fidelity (did Builder follow the vibe?)

**1.4 Create Edge Function: `vibecoder-orchestrator`**
- Master coordinator that chains the agents
- Implements retry logic (max 2 self-heal attempts)
- Streams progress updates to frontend
- Final gatekeeper before pushing to user

### Phase 2: Frontend Pipeline Integration

**2.1 Update `useAgentLoop` Hook**
- Replace simulated steps with real agent calls
- New steps: `architect` → `building` → `linting` → `healing` → `complete`
- Real-time log streaming from each agent stage
- Cancel propagation across all agents

**2.2 Update `AIBuilderCanvas`**
- Wire up the new orchestrator endpoint
- Display Architect's plan in `PlanApprovalCard` for optional review
- "Fast Mode" toggle: Skip plan approval for quick iterations
- Show lint failures in chat with "Auto-fixing..." status

**2.3 Create "Style Engine" UI**
- Model selector expanded to include "Style Profiles"
- Profiles: Cyberpunk Neon, Luxury Minimal, Brutalist, Kawaii, Streetwear Dark
- Each profile is a condensed ~50-line prompt fragment
- Stored in `STYLE_PROFILES` constant, injected into Builder prompt

### Phase 3: Intelligent Context Pruning

**3.1 Create `extractRelevantContext` Utility**
- Analyzes user prompt to identify which components matter
- Example: "Change button color" → only Button section, not Hero/Footer
- Reduces context window by 60-80% for targeted edits
- Falls back to full code for "rebuild entire store" requests

**3.2 Inject Product/Collection Data**
- On each generation, fetch user's actual products from DB
- Create condensed `products_summary` JSON (id, title, price, tags)
- Inject into Builder prompt so AI uses real data, not placeholders

### Phase 4: Self-Healing Pipeline

**4.1 Shadow Sandpack Validation**
- Before pushing to visible preview, test in hidden Sandpack instance
- Capture any runtime errors programmatically
- If error detected, feed to Linter Agent for diagnosis

**4.2 Retry Loop Implementation**
- Linter returns structured error (type, location, fix suggestion)
- Builder receives error context and generates patch
- Maximum 2 retries before falling back to user-visible error
- Success rate target: 85%+ first-time renders

### Phase 5: Premium SDK Injection

**5.1 Expand `vibecoder-stdlib.ts`**
- Add `@sellspay/core` namespace with pre-built components:
  - `<SellsPay.ProductCard />`
  - `<SellsPay.CheckoutButton />`
  - `<SellsPay.FeaturedProducts />`
  - `<SellsPay.CreatorBio />`
- AI just references these; zero chance of payment bugs

**5.2 Type Definitions for AI**
- Include TypeScript interfaces in system prompt
- AI knows exact props for each SDK component
- Reduces hallucination of incorrect prop names

---

## Technical Details

### New Edge Functions to Create

| Function | Model | Purpose | Credits |
|----------|-------|---------|---------|
| `vibecoder-orchestrator` | N/A (coordinator) | Chains agents, handles retries | 0 |
| `vibecoder-architect` | `google/gemini-3-pro-preview` | Creates blueprint | 5 |
| `vibecoder-builder` | `google/gemini-3-flash-preview` | Writes code | 3 |
| `vibecoder-linter` | `google/gemini-2.5-flash-lite` | Validates code | 0 (free) |

### Updated Agent Step Flow

```typescript
type AgentStep = 
  | 'idle' 
  | 'architect'    // New: Creating blueprint
  | 'planning'     // Renamed: Analyzing plan
  | 'building'     // New: Generating code
  | 'linting'      // New: Validating code
  | 'healing'      // New: Auto-fixing errors
  | 'verifying'    // Existing: Final check
  | 'done' 
  | 'error';
```

### Style Profile Structure

```typescript
interface StyleProfile {
  id: string;
  name: string;
  promptFragment: string; // ~50 lines of style rules
  colorPalette: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
  typography: {
    heading: string;
    body: string;
  };
}
```

---

## Files to Create

1. `supabase/functions/vibecoder-orchestrator/index.ts` - Master coordinator
2. `supabase/functions/vibecoder-architect/index.ts` - Planning agent
3. `supabase/functions/vibecoder-builder/index.ts` - Code generation agent
4. `supabase/functions/vibecoder-linter/index.ts` - Validation agent
5. `src/lib/vibecoder-style-profiles.ts` - Style profile definitions
6. `src/lib/vibecoder-context-pruning.ts` - Context extraction utilities
7. `src/lib/vibecoder-sdk.ts` - Expanded SDK components

## Files to Modify

1. `src/hooks/useAgentLoop.ts` - Real agent orchestration
2. `src/components/ai-builder/AIBuilderCanvas.tsx` - Pipeline integration
3. `src/components/ai-builder/ChatInputBar.tsx` - Style profile selector
4. `src/lib/vibecoder-stdlib.ts` - SDK component expansion
5. `src/components/ai-builder/AgentProgress.tsx` - New step types
6. `src/components/ai-builder/useStreamingCode.ts` - Orchestrator integration

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| First-render success | ~30% | 85%+ |
| Design repetition | High | Low (via style profiles) |
| Context efficiency | 100% code sent | 20-40% (pruned) |
| Self-heal rate | 0% | 70%+ (of failures) |
| Time to first render | ~8s | ~12s (more stages, higher quality) |

---

## Rollout Strategy

1. **Week 1**: Build orchestrator + architect + builder functions
2. **Week 2**: Implement linter + self-heal loop
3. **Week 3**: Frontend integration + style profiles
4. **Week 4**: Shadow validation + SDK expansion
5. **Week 5**: Visual validator (optional Phase 2)

This transforms VibeCoder from a "chat that writes code" into a true **AI Operating System** with specialized agents, quality gates, and self-healing capabilities.
