

# Vibecoder: Stale State Fix + Intent Router Implementation

## Overview

This plan addresses two critical UX issues:

1. **Stale State Bug**: After deleting a project, the preview continues showing the old code instead of resetting to a blank canvas
2. **Intent Router**: The AI blindly builds code for every input—even when the user asks a question or requests a forbidden layout

---

## Part 1: Stale State Fix

### The Problem
When you delete the active project, the sidebar updates correctly but the main preview still shows the old "Zenith Studios" code because:
- The `resetCode()` call happens, but the component doesn't fully re-mount
- React keeps the old state in memory since the component identity doesn't change

### The Solution: React Key-Based Reset

We'll use React's `key` prop to force a complete component destruction and recreation when the active project changes or is deleted.

### Changes Required

**1. Update `AIBuilderCanvas.tsx`:**
- Add a `resetKey` counter state
- Pass `key={`${activeProjectId}-${resetKey}`}` to the preview and chat components
- When a project is deleted, increment `resetKey` to force re-mount
- Update `handleDeleteProject` to properly trigger the nuclear reset

**2. Update `useVibecoderProjects.ts`:**
- Ensure `deleteProject` properly clears messages and returns to a clean state
- Add a callback option to notify the parent when deletion completes

---

## Part 2: Intent Router

### The Problem
Every user input is treated as a "build this" command. If the user asks "How do I change the colors?" or requests "Put nav at the top" (forbidden), the AI still tries to generate code.

### The Solution: Response Type Detection

The AI will prefix every response with a type flag:
- `/// TYPE: CHAT ///` — For questions, explanations, or refusals
- `/// TYPE: CODE ///` — For actual code generation

The frontend will detect this flag in the first few bytes of the stream and route accordingly.

### Changes Required

**1. Update `supabase/functions/vibecoder-v2/index.ts`:**
- Add an "Intent Analysis" section to the system prompt
- Define the output format protocol with explicit type prefixes
- Include example refusals for forbidden requests

**2. Update `useStreamingCode.ts`:**
- Add a detection phase at the start of streaming
- Parse the type flag from the buffer
- Emit different events based on detected mode:
  - `CHAT` mode: Stop streaming animation, return text to chat
  - `CODE` mode: Continue normal code streaming behavior

**3. Update `AIBuilderCanvas.tsx`:**
- Handle the new `onChatResponse` callback from the streaming hook
- Display chat responses in the message list instead of the preview

---

## Technical Details

### System Prompt Changes (vibecoder-v2)

The new prompt will include:

```text
INPUT ANALYSIS:
1. Is the user asking a question? (e.g., "How do I...?", "Why...?") -> MODE: CHAT
2. Is the user asking for a prohibited layout? (e.g., "Nav above hero") -> MODE: CHAT (Refuse politely)
3. Is the user asking to build/modify the design? -> MODE: CODE

OUTPUT FORMAT PROTOCOL (CRITICAL):
- If MODE is CHAT:
  Start response EXACTLY with: "/// TYPE: CHAT ///"
  Followed by your explanation. Do NOT output any code.

- If MODE is CODE:
  Start response EXACTLY with: "/// TYPE: CODE ///"
  Followed by the full React component code.
```

### Streaming Hook Changes

```typescript
// Detection state
type StreamMode = 'detecting' | 'chat' | 'code';

// In the streaming loop:
if (mode === 'detecting') {
  if (buffer.includes('/// TYPE: CHAT ///')) {
    mode = 'chat';
    buffer = buffer.replace('/// TYPE: CHAT ///', '').trim();
    options.onChatResponse?.(true); // Signal chat mode
  } else if (buffer.includes('/// TYPE: CODE ///')) {
    mode = 'code';
    buffer = buffer.replace('/// TYPE: CODE ///', '').trim();
  }
}
```

### Component Key Reset Pattern

```typescript
// Force full component reset on delete
const [resetKey, setResetKey] = useState(0);

const handleDeleteProject = async (projectId: string) => {
  const isActiveProject = activeProjectId === projectId;
  const success = await deleteProject(projectId);
  
  if (success && isActiveProject) {
    resetCode();
    setResetKey(prev => prev + 1); // Nuclear reset
  }
};

// In render:
<VibecoderPreview 
  key={`preview-${activeProjectId}-${resetKey}`} 
  code={code} 
  isStreaming={isStreaming} 
/>
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/ai-builder/AIBuilderCanvas.tsx` | Add `resetKey` state, update key props, handle chat responses |
| `src/components/ai-builder/useStreamingCode.ts` | Add intent detection, new callback for chat mode |
| `src/components/ai-builder/hooks/useVibecoderProjects.ts` | Improve deletion state cleanup |
| `supabase/functions/vibecoder-v2/index.ts` | Add intent router to system prompt |

---

## Expected Behavior After Implementation

### Stale State Fix
1. User deletes "Zenith Studios" project
2. `resetKey` increments from 0 to 1
3. React destroys `<VibecoderPreview key="proj-123-0" />` 
4. React creates fresh `<VibecoderPreview key="null-1" />`
5. New instance loads with default "Vibecoder Ready" blank canvas

### Intent Router
1. User types: "How do I add more products?"
2. AI responds: `/// TYPE: CHAT /// Great question! To add more products...`
3. Frontend detects `TYPE: CHAT` in first 50 characters
4. Streaming animation stops immediately
5. Text response appears in chat bubble (no code generation)

1. User types: "Put the nav at the very top"
2. AI responds: `/// TYPE: CHAT /// I cannot place the navigation bar above the Hero section...`
3. Polite refusal appears in chat
4. No broken/partial code is generated

1. User types: "Make it purple and add testimonials"
2. AI responds: `/// TYPE: CODE /// import { useState }...`
3. Normal code streaming proceeds
4. Preview updates with new design

