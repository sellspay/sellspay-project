
# Agentic AI Builder Upgrade: From Chatbot to Agent

## Overview

This is a major architectural upgrade to transform Vibecoder from a simple "Chatbot" (Input → Output) to a true "Agent" (Input → Plan → Execute → Verify → Self-Correct).

**Current State:**
- Single-shot streaming: user sends prompt, AI streams code
- Basic `[LOG:]` tags for real-time transparency
- `LiveBuildingCard` shows simple checklist during streaming

**Target State:**
- Multi-step agent loop: Planning → Reading → Writing → Installing → Verifying → Done/Error
- Premium terminal-style progress UI with timestamps and live logs
- Self-healing capability: detects Sandpack errors and auto-fixes
- Visual "thinking" that justifies the premium credit cost

---

## Part 1: Create the Agent Progress UI

### New Component: `AgentProgress.tsx`

A premium, terminal-style thinking indicator that replaces the simple loading spinner with detailed status logs.

**File:** `src/components/ai-builder/AgentProgress.tsx`

**Features:**
- Header bar with current step status and animated indicators (3 pulsing dots)
- Real-time log stream with timestamps (`[10:00:01] Reading App.tsx...`)
- Progress bar that fills as steps complete
- Step-specific icons (BrainCircuit for planning, FileCode for writing, etc.)
- Blinking cursor at end of log stream
- Color-coded status (violet for running, green for done, red for error)

**Step Types:**
```text
planning   → "Architecting Solution..." (15%)
reading    → "Analyzing Context..." (30%)
writing    → "Generating Code..." (60%)
installing → "Updating Dependencies..." (80%)
verifying  → "Running Tests..." (95%)
done       → "Complete" (100%)
error      → "Process Failed"
```

**Visual Design:**
- Dark terminal aesthetic (`bg-zinc-950/80`, `font-mono`)
- Header with status label + animated glow ring
- Scrollable log area with max height
- Gradient progress bar (violet → blue)
- Timestamps in muted color, commands in white

---

## Part 2: Create the Agent Logic Hook

### New Hook: `useAgentLoop.ts`

A state machine that orchestrates the multi-step agent workflow.

**File:** `src/hooks/useAgentLoop.ts`

**State Interface:**
```typescript
type AgentStep = 'idle' | 'planning' | 'reading' | 'writing' | 'installing' | 'verifying' | 'done' | 'error';

interface AgentState {
  step: AgentStep;
  logs: string[];
  isRunning: boolean;
  error?: string;
}
```

**Core Logic:**
1. **Planning Phase**: Parse the prompt, identify required components
2. **Reading Phase**: Analyze current code context (passed from canvas)
3. **Writing Phase**: Stream code generation (delegates to existing `useStreamingCode`)
4. **Installing Phase**: Check for new dependencies in generated code
5. **Verifying Phase**: Monitor Sandpack for errors
6. **Done/Error**: Complete or trigger self-correction loop

**Key Methods:**
- `startAgent(prompt, currentCode)` - Begins the agent loop
- `addLog(message)` - Appends to the log stream
- `setStep(step)` - Transitions the state machine
- `triggerSelfCorrection(error)` - Initiates fix loop on error

**Integration with Existing Code:**
- Wraps the existing `useStreamingCode` hook
- Enhances the `[LOG:]` tag extraction with structured step transitions
- Adds timing metadata for premium feel

---

## Part 3: Integration into VibecoderChat

### Modify: `VibecoderChat.tsx`

Replace the simple `LiveBuildingCard` with the new `AgentProgress` component when streaming.

**Changes:**
1. Import `AgentProgress` component
2. Pass `agentStep` and `agentLogs` as new props
3. Conditionally render `AgentProgress` instead of `LiveBuildingCard` when agent is running
4. Keep `LiveBuildingCard` as fallback for simple streaming (non-agent mode)

**Updated Props Interface:**
```typescript
interface VibecoderChatProps {
  // ... existing props
  agentStep?: AgentStep;      // Current agent phase
  agentLogs?: string[];       // Agent log stream
  isAgentMode?: boolean;      // Toggle for premium agent UI
}
```

---

## Part 4: Canvas Integration

### Modify: `AIBuilderCanvas.tsx`

Wire up the agent hook and pass state down to chat.

**Changes:**
1. Import `useAgentLoop` hook
2. Initialize agent state alongside existing streaming code hook
3. Update `handleSendMessage` to use agent loop instead of direct `streamCode`
4. Pass agent state props to `VibecoderChat`
5. Connect Sandpack error callback to agent's self-correction

**New Flow:**
```text
User submits prompt
      ↓
handleSendMessage calls startAgent(prompt, currentCode)
      ↓
Agent transitions: idle → planning → reading → writing
      ↓
useStreamingCode handles actual code generation
      ↓
Agent continues: writing → installing → verifying → done
      ↓
If Sandpack error detected → agent → fixing → re-writes → verifying
```

---

## Part 5: Self-Healing Enhancement

### Modify: `PreviewErrorBoundary.tsx`

Enhance the error boundary to work with the agent loop.

**Current Behavior:** Shows error UI with "Auto Fix" button

**Enhanced Behavior:**
- Automatically trigger agent self-correction when error detected
- Pass error details to agent for intelligent repair
- Show agent progress UI while fixing

**Integration:**
```typescript
const handleAutoFix = (errorMsg: string) => {
  // Agent receives error context and attempts fix
  startAgent(`[CRITICAL_ERROR_REPORT]\nError: ${errorMsg}\nFix the code.`, currentCode);
};
```

---

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/components/ai-builder/AgentProgress.tsx` | **CREATE** | Premium terminal-style progress UI |
| `src/hooks/useAgentLoop.ts` | **CREATE** | Agent state machine and orchestration logic |
| `src/components/ai-builder/VibecoderChat.tsx` | **MODIFY** | Integrate AgentProgress, add agent props |
| `src/components/ai-builder/AIBuilderCanvas.tsx` | **MODIFY** | Wire up useAgentLoop, connect to error boundary |
| `src/components/ai-builder/types/chat.ts` | **MODIFY** | Export AgentStep type |

---

## Technical Details

### AgentProgress Component Structure

```text
┌─────────────────────────────────────────────────────┐
│  🧠 Architecting Solution...        ● ● ●           │  ← Header with status
├─────────────────────────────────────────────────────┤
│  [10:00:01] > Received prompt: "Create a..."        │
│  [10:00:02] Analyzing request complexity...         │
│  [10:00:03] Identified components: Header, Hero     │
│  [10:00:04] Reading src/App.tsx...                  │
│  [10:00:05] > Generating code for Hero.tsx...       │  ← Scrollable log area
│  _                                                  │  ← Blinking cursor
├─────────────────────────────────────────────────────┤
│  ████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │  ← Progress bar (60%)
└─────────────────────────────────────────────────────┘
```

### State Machine Flow

```text
                ┌─────────┐
                │  idle   │
                └────┬────┘
                     │ startAgent()
                     ▼
              ┌──────────────┐
              │   planning   │ (15%)
              └──────┬───────┘
                     │
                     ▼
              ┌──────────────┐
              │   reading    │ (30%)
              └──────┬───────┘
                     │
                     ▼
              ┌──────────────┐
              │   writing    │ (60%) ← streamCode() executes here
              └──────┬───────┘
                     │
                     ▼
              ┌──────────────┐
              │  installing  │ (80%)
              └──────┬───────┘
                     │
                     ▼
              ┌──────────────┐
              │  verifying   │ (95%)
              └──────┬───────┘
            ┌────────┴────────┐
            │                 │
    ┌───────▼───────┐  ┌──────▼──────┐
    │     done      │  │    error    │
    │  (Complete)   │  │  (Failed)   │
    └───────────────┘  └──────┬──────┘
                              │
                              ▼
                       ┌─────────────┐
                       │   fixing    │ ← Self-correction loop
                       └──────┬──────┘
                              │
                              ▼
                       (back to writing)
```

---

## Expected Results

1. **Premium "Thinking" Experience**: Users see exactly what the AI is doing at each step, justifying the credit cost

2. **Transparency**: Real-time logs show file reading, component generation, and verification

3. **Self-Healing**: Sandpack errors trigger automatic fix loops without user intervention

4. **Future-Ready**: Architecture supports adding more agent capabilities (Vision, WebContainers, etc.)

5. **Progressive Enhancement**: Existing streaming code hook remains functional; agent layer wraps it
