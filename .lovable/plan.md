
# Race Condition Fix: Strict Project ID Locking

## Problem Analysis

The race condition occurs because:

1. **User starts "New Project"** → AI begins generating code in the background
2. **User switches to "Old Project"** before generation completes
3. **AI finishes** and writes the result to the current canvas state
4. The canvas blindly applies the new code to whatever project is currently active, **overwriting the old project**

The root cause: There is **no verification** that the project the user is viewing when generation completes is the same project that initiated the generation.

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                        RACE CONDITION TIMELINE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ T=0s    User clicks "New Project", types prompt                             │
│         → startAgent() called with Project A's context                      │
│                                                                             │
│ T=2s    AI is generating in background...                                   │
│         User clicks on "Old Project B" in sidebar                           │
│         → activeProjectId changes to B                                      │
│                                                                             │
│ T=5s    AI finishes generating code for Project A                           │
│         → onComplete() fires, code is written to canvas                     │
│         → addMessage() saves to activeProjectId (now B!) ← BUG!             │
│         → Project B's history is corrupted with Project A's code            │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Solution: Strict ID Locking

Implement a **generation lock** that captures the project ID when generation starts and verifies it before any writes.

### Technical Changes

#### 1. Add `generationLockRef` to `AIBuilderCanvas.tsx`

Create a ref that stores the project ID when a generation starts:

```typescript
// New ref to lock generation to a specific project
const generationLockRef = useRef<string | null>(null);
```

#### 2. Lock the Project ID When Generation Starts

In `handleSendMessage()`, capture the project ID BEFORE starting the agent:

```typescript
const handleSendMessage = async (prompt: string) => {
  // ...existing auto-create logic...
  
  const projectId = await ensureProject(projectName);
  if (!projectId) return;
  
  // LOCK: Capture which project this generation belongs to
  generationLockRef.current = projectId;
  
  await addMessage('user', prompt);
  startAgent(prompt, code !== DEFAULT_CODE ? code : undefined);
};
```

#### 3. Verify Lock Before Writes in `useStreamingCode`

Modify the `useStreamingCode` hook to accept a `shouldAbort` callback that checks the lock:

```typescript
// In useStreamingCode options
interface UseStreamingCodeOptions {
  // ...existing options...
  shouldAbort?: () => boolean; // NEW: Check if we should stop
}

// Inside streamCode, check before final writes:
if (options.shouldAbort?.()) {
  console.warn('🛑 Aborted: Project changed during generation');
  setState(prev => ({ ...prev, isStreaming: false }));
  return;
}
options.onComplete?.(finalCode);
```

#### 4. Guard the Callbacks in `AIBuilderCanvas.tsx`

Modify the `useStreamingCode` initialization to include abort checking:

```typescript
const { streamCode, ... } = useStreamingCode({
  shouldAbort: () => {
    // If the lock doesn't match current project, abort
    if (generationLockRef.current && 
        generationLockRef.current !== activeProjectId) {
      console.warn(`🛑 BLOCKED: Generation for ${generationLockRef.current} but viewing ${activeProjectId}`);
      return true;
    }
    return false;
  },
  onComplete: async (finalCode) => {
    // Double-check the lock before saving
    if (generationLockRef.current !== activeProjectId) {
      console.warn('🛑 Discarded code: Project mismatch');
      generationLockRef.current = null;
      return;
    }
    
    // Safe to save - project matches
    await addMessage('assistant', 'Generated your storefront design.', finalCode);
    generationLockRef.current = null; // Release lock
    onStreamingComplete();
  },
  // ...rest of options
});
```

#### 5. Clear Lock on Project Switch

In the project verification `useEffect`, abort any in-flight generation:

```typescript
useEffect(() => {
  async function verifyAndLoadProject() {
    // If there's an active generation for a DIFFERENT project, abort it
    if (generationLockRef.current && 
        generationLockRef.current !== activeProjectId) {
      console.warn(`🛑 Aborting generation for ${generationLockRef.current} (switched to ${activeProjectId})`);
      cancelStream(); // Stop the HTTP stream
      cancelAgent();  // Reset agent state
      generationLockRef.current = null;
    }
    
    // ...rest of existing verification logic...
  }
  
  verifyAndLoadProject();
}, [activeProjectId, ...]);
```

#### 6. Guard `addMessage` at the Source

Add a safety check directly in the `addMessage` function:

```typescript
// In useVibecoderProjects.ts
const addMessage = useCallback(async (
  role: 'user' | 'assistant' | 'system',
  content: string | null,
  codeSnapshot?: string | null,
  forProjectId?: string // NEW: Optional explicit project ID
) => {
  const targetProjectId = forProjectId || activeProjectId;
  if (!targetProjectId) return null;
  
  // Save to the explicit project, not just "current"
  const { data, error } = await supabase
    .from('vibecoder_messages')
    .insert({
      project_id: targetProjectId,
      role,
      content,
      code_snapshot: codeSnapshot ?? null,
    })
    .select()
    .single();
  
  // Only update local state if target matches active
  if (targetProjectId === activeProjectId && !error) {
    setMessages(prev => [...prev, data as VibecoderMessage]);
  }
  
  return data;
}, [activeProjectId]);
```

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/ai-builder/AIBuilderCanvas.tsx` | Add `generationLockRef`, guard all callbacks, abort on project switch |
| `src/components/ai-builder/useStreamingCode.ts` | Add `shouldAbort` option, check before `onComplete` |
| `src/components/ai-builder/hooks/useVibecoderProjects.ts` | Add optional `forProjectId` param to `addMessage` |
| `src/hooks/useAgentLoop.ts` | Add project ID tracking to ensure agent respects the lock |

### Edge Cases Handled

1. **User switches projects mid-generation** → Generation is aborted, no data written
2. **User deletes the generating project** → Lock becomes orphaned, writes are blocked
3. **User creates new project while old is generating** → Old generation is aborted
4. **User refreshes mid-generation** → Lock is lost, generation result is discarded

### Verification Steps

After implementation, test these scenarios:
1. Start generation on Project A, switch to Project B before completion → B unchanged
2. Start generation, create new project before completion → Old generation discarded  
3. Start generation, delete the project → No crash, no orphan data
4. Complete a full generation without switching → Works normally
