
# Chat-Integrated Undo: Premium In-Flow Version Control

## Overview

This plan implements a **Chat-Integrated Undo** system where every AI message that modifies code has a prominent "Undo" button directly in the message bubble. This keeps version control visible in the conversation flow—no need to hunt through sidebars or history panels.

---

## Current State

The system already has foundational versioning capabilities:
- **`vibecoder_messages.code_snapshot`** - Stores the complete code state after each AI response
- **`restoreToVersion(messageId)`** - RPC that deletes all messages after a given point and returns the snapshot
- **`RevertConfirmDialog`** - A confirmation modal already exists for revert actions
- **Undo button exists** - Currently an icon-only button in the hover toolbar (low visibility)

**What's Missing:**
1. The Undo button is hidden in a hover toolbar (not visible by default)
2. No direct "Undo to previous version" - only "Restore to this version"
3. No safety check for linter-passed versions (truncated code could be reverted to)
4. No visual distinction for "code change" messages vs. chat-only messages

---

## Implementation Plan

### Phase 1: Enhanced Message Bubble with Prominent Undo

**File: `src/components/ai-builder/VibecoderMessageBubble.tsx`**

Transform the subtle hover-only Undo button into a prominent action pill visible for all code-changing AI messages:

1. **Always-Visible Undo Pill** - For the most recent AI message that changed code, show an always-visible "Undo Change" pill button (not just on hover)
2. **Smart Visibility Logic**:
   - Show for assistant messages with `code_snapshot` 
   - Only show if there's a previous version to restore to (not the first code message)
   - Use the existing `canRestore` logic but make UI always visible
3. **Visual Design**: Zinc-800 background, `RotateCcw` icon, subtle hover animation

```text
Current (hidden on hover):
┌─────────────────────────────┐
│ I've updated the Hero...    │
│ Code applied to preview     │
│                             │
│ [hidden until hover]        │
└─────────────────────────────┘

New (always visible):
┌─────────────────────────────┐
│ I've updated the Hero...    │
│ Code applied to preview     │
│                             │
│ [ ↩ Undo Change ]           │
└─────────────────────────────┘
```

### Phase 2: Quick Undo Logic (Previous Version)

**File: `src/components/ai-builder/hooks/useVibecoderProjects.ts`**

Add a new function for "quick undo" that reverts to the **previous** code snapshot without requiring the user to pick a specific message:

1. **`undoLastChange()`** - Finds the second-to-last message with a code snapshot and restores to it
2. **Safety Check** - Only allow undo if there are at least 2 code snapshots (can't undo initial creation)
3. **Reuse existing `restoreToVersion()` RPC** - Just pass the previous message's ID

```typescript
// New function in useVibecoderProjects
const undoLastChange = useCallback(async (): Promise<string | null> => {
  const withCode = messages.filter(m => m.role === 'assistant' && m.code_snapshot);
  if (withCode.length < 2) return null; // Can't undo - no previous version
  
  const previousMessage = withCode[withCode.length - 2];
  return await restoreToVersion(previousMessage.id);
}, [messages, restoreToVersion]);
```

### Phase 3: Linter-Passed Version Safety

**File: `src/components/ai-builder/hooks/useVibecoderProjects.ts`**

Add validation to ensure we only restore to "healthy" code versions:

1. **Import `hasCompleteSentinel`** from `useStreamingCode.ts`
2. **Filter "safe" versions** - Before exposing `getPreviousCodeSnapshot`, check that the code includes the completion sentinel
3. **`getLastSafeVersion()`** - New function that returns the most recent code that passed the linter check

```typescript
// Get the last code version that includes the completion sentinel
const getLastSafeVersion = useCallback((): { messageId: string; code: string } | null => {
  const withCode = messages.filter(m => 
    m.role === 'assistant' && 
    m.code_snapshot && 
    hasCompleteSentinel(m.code_snapshot)
  );
  
  if (withCode.length === 0) return null;
  const last = withCode[withCode.length - 1];
  return { messageId: last.id, code: last.code_snapshot! };
}, [messages]);
```

### Phase 4: Action Row Component

**File: `src/components/ai-builder/MessageActionRow.tsx` (NEW)**

Create a dedicated component for message actions that appears below AI messages:

```text
Components:
┌─────────────────────────────────────────────────┐
│ [ ↩ Undo ] [ 🕒 View History ] [ ✨ Iterate ]   │
└─────────────────────────────────────────────────┘
```

1. **Undo** - Reverts to previous code state (calls `undoLastChange`)
2. **View History** - Opens full history panel/dialog (stretch goal)
3. **Iterate** - Pre-fills chat input with "Refine this by..." (stretch goal)

For MVP, only the Undo button is essential. The others can be added later.

### Phase 5: Wire into AIBuilderCanvas

**File: `src/components/ai-builder/AIBuilderCanvas.tsx`**

1. **Pass `undoLastChange`** to VibecoderChat alongside existing `onRestoreToVersion`
2. **Add toast feedback** for undo success/failure
3. **Refresh preview** after undo completes

---

## Technical Implementation Details

### Updated VibecoderMessageBubble Component

The key change is making the Undo button always visible for the **latest AI message with code changes**, not hidden behind hover:

```tsx
// In AssistantMessage component
const isLatestWithCode = canRestore && !!message.code_snapshot;

// Render the action row
{isLatestWithCode && (
  <div className="mt-4 pt-3 border-t border-zinc-800/50 flex items-center gap-2">
    <button
      onClick={handleRevertClick}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg 
                 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white
                 text-xs font-medium transition-colors"
    >
      <RotateCcw size={12} />
      Undo Change
    </button>
  </div>
)}
```

### Data Flow

```text
User clicks "Undo Change"
        ↓
RevertConfirmDialog shows warning
        ↓
User confirms
        ↓
undoLastChange() called
        ↓
Finds previous code message ID
        ↓
Calls restoreToVersion(previousMessageId) RPC
        ↓
RPC deletes future messages, returns code
        ↓
setCode(restoredCode) updates preview
        ↓
Messages state refreshed from DB
        ↓
Toast: "Restored to previous version"
```

---

## File Changes Summary

| File | Changes |
|------|---------|
| `src/components/ai-builder/VibecoderMessageBubble.tsx` | Add always-visible Undo pill for latest code message |
| `src/components/ai-builder/hooks/useVibecoderProjects.ts` | Add `undoLastChange()`, add sentinel safety check |
| `src/components/ai-builder/VibecoderChat.tsx` | Pass new undo handler to ChatInterface |
| `src/components/ai-builder/AIBuilderCanvas.tsx` | Wire `undoLastChange` and add feedback |

---

## Visual Design Spec

**Undo Button Styling (Zinc-800 Theme)**:
- Background: `bg-zinc-800` → `hover:bg-zinc-700`
- Text: `text-zinc-300` → `hover:text-white`
- Border: `border border-zinc-700/50`
- Icon: Lucide `RotateCcw` (12px)
- Font: 12px, medium weight
- Padding: `px-3 py-1.5`
- Radius: `rounded-lg`

**Placement**: Below the message content, above the hover toolbar, separated by a subtle `border-t border-zinc-800/50`.

---

## Expected Outcomes

| Issue | Before | After |
|-------|--------|-------|
| Undo visibility | Hidden on hover | Always visible for code messages |
| Undo action | Requires picking message | One-click to previous version |
| Truncated code protection | None | Only restore to linter-passed versions |
| Workflow speed | Navigate to history | Undo right in chat flow |

---

## Optional Enhancements (Stretch Goals)

1. **"View Full History" button** - Links to a sidebar or modal showing all versions
2. **"Iterate" button** - Pre-populates chat with "Refine the current design by..."
3. **Version diff preview** - Show what changed before confirming undo
4. **Keyboard shortcut** - Cmd/Ctrl+Z for quick undo (conflicts with text input, needs careful handling)
