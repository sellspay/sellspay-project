
# AI Builder Architecture Upgrade: Planner-Builder-Reporter Pattern

## What's Changing

Your AI builder currently streams raw tokens from Gemini and shows a generic "Building for Xs" log. The AI already returns structured sections (`/// TYPE: CODE ///`, `/// BEGIN_CODE ///`, `[LOG: ...]`), but the frontend doesn't parse them into visible phases. This upgrade surfaces the AI's reasoning, plan, and summary as real chat messages -- making it feel conversational and premium.

## Current Flow (What Users See)

```text
User sends prompt
  -> "Thinking..." dot
  -> "Building for 42s" with hidden execution log
  -> AI message appears all at once when done
```

## New Flow (What Users Will See)

```text
User sends prompt
  -> "Analyzing your request..." (phase badge)
  -> Analysis text streams into chat as it arrives
  -> Plan checklist appears with component list
  -> "Generating code..." (progress bar pulses)
  -> Code streams into Sandpack live
  -> Summary confirmation appears
  -> "Build successful" badge
```

---

## Technical Implementation

### 1. Edge Function: Structured SSE Events (vibecoder-v2)

**Current:** The streaming path (lines 1661-1728) strips SSE framing and sends raw text tokens. The frontend has to guess where sections start.

**Change:** Emit structured SSE events with `event:` types instead of raw text. This lets the frontend know exactly what phase the AI is in.

New streaming output format:
```
event: phase
data: {"phase": "analyzing"}

event: text
data: {"content": "I see the issue with your ProductGrid..."}

event: phase  
data: {"phase": "planning"}

event: plan
data: {"items": ["Fix onClick handler", "Add route param", "Update imports"]}

event: phase
data: {"phase": "building"}

event: code_chunk
data: {"content": "import React from..."}

event: phase
data: {"phase": "complete"}

event: summary
data: {"content": "Fixed the View Asset button routing."}
```

The edge function will parse the `=== ANALYSIS ===` / `=== PLAN ===` / `=== CODE ===` / `=== SUMMARY ===` sections (or the existing `/// TYPE: CODE ///` / `/// BEGIN_CODE ///` markers) as they stream in and emit the appropriate event types.

### 2. System Prompt Update (CODE_EXECUTOR_PROMPT)

Add structured section markers to the existing prompt so Gemini returns content in parseable phases:

```
Before writing code, structure your response with these sections:

=== ANALYSIS ===
(1-2 sentences explaining what you found and what needs to change)

=== PLAN ===
- Step 1: description
- Step 2: description

=== CODE ===
/// BEGIN_CODE ///
<full React file>
// --- VIBECODER_COMPLETE ---

=== SUMMARY ===
(1 sentence confirmation of what was updated)
```

This is additive -- it wraps the existing `/// TYPE: CODE ///` / `/// BEGIN_CODE ///` markers with analysis and summary sections.

### 3. Frontend: useStreamingCode.ts Upgrade

**Current:** Detects `/// TYPE: CODE ///`, `/// TYPE: CHAT ///`, `/// TYPE: PLAN ///` markers and switches mode. Code chunks update Sandpack. Logs are extracted via regex.

**Change:** Parse the new SSE event types. Add callbacks for each phase:

- `onAnalysis(text: string)` -- streams analysis text into chat
- `onPlanItems(items: string[])` -- shows checklist UI
- `onCodeChunk(code: string)` -- existing behavior, updates Sandpack
- `onSummary(text: string)` -- shows completion message
- `onPhaseChange(phase: string)` -- updates the progress indicator

The SSE parsing will switch from raw text accumulation to event-type-based routing.

### 4. Frontend: VibecoderChat.tsx -- Phase-Based UI

Replace the single `LiveThought` component with a phase-aware rendering system:

- **Analyzing phase:** Shows a streaming text bubble (like an assistant typing) with the analysis content
- **Planning phase:** Shows a checklist card with the plan items, each getting a checkmark as building progresses  
- **Building phase:** Shows compact progress indicator (existing LiveThought style but with "Generating code..." label)
- **Complete phase:** Shows a summary badge with confirmation text

Each phase appears as a new element in the chat scroll area, creating a conversational flow.

### 5. New Component: StreamingPhaseCard

A new component that renders differently based on the current phase:

- `phase="analyzing"` -- Text streaming with typing cursor
- `phase="planning"` -- Checklist with animated items
- `phase="building"` -- Compact progress bar with code icon
- `phase="complete"` -- Green success badge with summary

### 6. AgentProgress.tsx -- Deprecation

The current `AgentProgress` component (terminal-style log viewer) will be kept but hidden by default. It becomes the "advanced view" accessible via a toggle, while the new phase-based UI is the primary experience.

### 7. useAgentLoop.ts -- Real Phase Mapping

**Current:** Fakes steps with `delay()` calls (planning 300ms, reading 300ms, etc.) before Gemini even responds.

**Change:** Map phases to real SSE events. Remove the fake delays. The `startAgent` function will:
1. Immediately show "Analyzing..." when the request is sent
2. Transition to "Planning..." when the `phase: planning` SSE event arrives
3. Transition to "Building..." when `phase: building` arrives
4. Transition to "Complete" when `phase: complete` arrives

No more simulated steps -- every phase transition comes from real AI output.

---

## Files To Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `supabase/functions/vibecoder-v2/index.ts` | Modify | Add structured SSE events to streaming path + update system prompt |
| `src/components/ai-builder/useStreamingCode.ts` | Modify | Parse SSE event types, add phase callbacks |
| `src/components/ai-builder/StreamingPhaseCard.tsx` | Create | New phase-aware UI component |
| `src/components/ai-builder/VibecoderChat.tsx` | Modify | Replace LiveThought with phase-based rendering |
| `src/hooks/useAgentLoop.ts` | Modify | Remove fake delays, map to real SSE phases |
| `src/components/ai-builder/LiveThought.tsx` | Keep | Becomes expandable "advanced log" within phase cards |

## What This Does NOT Change

- Sandpack rendering (untouched)
- Ghost Fixer / Healer Protocol (untouched)
- Job-based background processing path (untouched -- only the streaming path changes)
- Intent classifier (untouched)
- Credit system (untouched)
- Architect Mode / Plan approval flow (untouched)
