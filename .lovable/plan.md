

# 2-Stage Analyzer Pipeline: Smart Suggestions + Clarification Questions

## Overview
Replace the hardcoded client-side suggestion chips with a backend-driven 2-stage pipeline. Stage 1 (Analyzer) runs a fast Gemini call to infer intent, generate tailored suggestions, and optionally ask clarification questions before any code generation happens. Stage 2 (existing codegen) only fires once the request is specific enough.

## What Changes

### 1. New Analyzer Stage in Edge Function (`supabase/functions/vibecoder-v2/index.ts`)

Add a new `analyzeIntent` function called with a lightweight Gemini model (`gemini-2.5-flash`) that returns strict JSON:

```text
{
  "intent": { "primary": "saas", "secondary": ["landing"], "confidence": 0.86 },
  "stage": "structure",
  "missing": ["pricing_model", "brand_style"],
  "questions": [
    { "id": "pricing_model", "label": "What pricing model?", "type": "single", 
      "options": [{ "value": "one_time", "label": "One-time" }, ...] }
  ],
  "suggestions": [
    { "label": "Add pricing tiers", "prompt": "Add a premium 3-tier pricing section..." }
  ],
  "feature_tags": ["pricing", "hero", "testimonials"],
  "enhanced_prompt_seed": "Create a premium SaaS landing page for ..."
}
```

The analyzer system prompt instructs Gemini to:
- Infer user intent from message + conversation history + intent profile
- Generate 5-7 tailored suggestion chips (short labels, full prompts)
- Generate 0-6 multiple-choice clarification questions when the request is vague
- Return `feature_tags` for intent profile tracking
- Return `enhanced_prompt_seed` to enrich the final codegen prompt

### 2. New SSE Event Types

Add two new SSE events emitted by the edge function before code generation:

- `event: suggestions` - Carries `suggestions[]` array for chip rendering
- `event: questions` - Carries `questions[]` array for clarification UI
- `event: enhanced_prompt` - Carries the enriched prompt seed after answers

The existing SSE flow becomes:

```text
1. event: phase { phase: "analyzing" }
2. event: suggestions [{ label, prompt }, ...]      <-- NEW
3. event: questions [{ id, label, type, options }]  <-- NEW (if vague)
4. event: text { content: "analysis..." }
5. event: phase { phase: "planning" }
6. event: plan { items: [...] }
7. event: phase { phase: "building" }
8. event: code_chunk { content: "..." }
9. event: phase { phase: "complete" }
```

If questions are emitted, the stream pauses (closes) and waits for the user to submit answers. The answers are sent as a new request with `type: "clarification_answers"`.

### 3. Intent Profile Table (Database)

New table `vibecoder_intent_profiles` to track per-project intent over time:

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | PK |
| project_id | uuid | FK to vibecoder_projects |
| primary_intent | text | "saas", "ecommerce", "portfolio", etc. |
| feature_counts | jsonb | `{ "pricing": 3, "hero": 5, "stripe": 1 }` |
| updated_at | timestamptz | Auto-updated |

This gets sent as context to the analyzer so suggestions stay consistent across messages.

### 4. Frontend: Replace Hardcoded ContextualSuggestions

**Delete** the hardcoded `SUGGESTION_POOLS` and `detectProjectContext` logic in `ContextualSuggestions.tsx`.

**Replace** with a component that renders `suggestions[]` received from the backend SSE stream. The component:
- Receives suggestions via new state in `useAgentLoop` / `useStreamingCode`
- Renders chips the same way visually (animated pills above input)
- On click, inserts the `prompt` into the input field
- Suggestions persist after generation completes (until next message)

### 5. Frontend: New ClarificationCard Component

New component `ClarificationCard.tsx` that renders when `questions[]` arrives:
- Shows a card in the chat area with the questions
- Each question has radio buttons (single) or checkboxes (multi)
- "Continue" button submits answers back to the edge function
- The answers payload is: `{ type: "clarification_answers", answers: { pricing_model: "subscription", ... }, enhanced_prompt_seed: "..." }`
- The edge function receives this and proceeds to Stage 2 (codegen) with the enriched prompt

### 6. Wire It All Together

**`useStreamingCode.ts`** - Add new SSE case handlers:
- `case 'suggestions':` - Forward to new `onSuggestions` callback
- `case 'questions':` - Forward to new `onQuestions` callback

**`useAgentLoop.ts`** - Add new state fields:
- `backendSuggestions: Suggestion[]`
- `pendingQuestions: Question[]`
- New callbacks: `onSuggestions`, `onQuestions`

**`AIBuilderCanvas.tsx`** - Wire the new callbacks and pass state to `VibecoderChat`

**`VibecoderChat.tsx`** - Render `ClarificationCard` when `pendingQuestions` is non-empty, render backend suggestions instead of hardcoded ones

### 7. Edge Function Flow Changes

The main handler in `vibecoder-v2/index.ts` changes to:

```text
1. Receive message
2. If type === "clarification_answers":
   - Build enhanced prompt from answers + seed
   - Skip analyzer, go straight to codegen (Stage 2)
3. Else:
   - Run analyzer (Stage 1) with gemini-2.5-flash
   - Emit suggestions SSE event
   - If questions.length > 0:
     - Emit questions SSE event
     - Close stream (wait for answers)
   - Else:
     - Use enhanced_prompt_seed for codegen
     - Proceed to Stage 2 (existing flow)
4. Update intent profile in DB
```

## Technical Details

### Analyzer System Prompt (abbreviated)
```
You are a premium product strategist for VibeCoder.
Goal: Convert vague requests into premium builds. Ask structured questions when underspecified.
Generate context-aware suggestion chips based on intent + history.

Return ONLY valid JSON with schema:
{ intent, stage, missing, questions, suggestions, feature_tags, enhanced_prompt_seed }

Rules:
- questions: 4-6 items when missing info; 0 when specific
- suggestions: 5-7 chips, tailored to intent + profile
- Labels max 28 chars
- Prompts directly usable as user messages
```

### Credit Cost
- Analyzer call (gemini-2.5-flash, ~500 tokens): **0 credits** (free, fast model)
- Only the codegen stage costs credits (existing pricing)

### Files Modified
1. `supabase/functions/vibecoder-v2/index.ts` - Add analyzer stage, new SSE events, clarification handler
2. `src/components/ai-builder/useStreamingCode.ts` - Handle new SSE event types
3. `src/hooks/useAgentLoop.ts` - New state for suggestions + questions
4. `src/components/ai-builder/AIBuilderCanvas.tsx` - Wire new callbacks
5. `src/components/ai-builder/VibecoderChat.tsx` - Render backend suggestions + clarification card
6. `src/components/ai-builder/ContextualSuggestions.tsx` - Refactor to accept backend-driven suggestions
7. **New:** `src/components/ai-builder/ClarificationCard.tsx` - Question UI component
8. **New:** Database migration for `vibecoder_intent_profiles` table

