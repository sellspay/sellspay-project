
# Fix AI Builder "Blinking" Issue - Credit Preflight & Error UI

## Problem Diagnosis

The AI "blinks" (shows thinking briefly then vanishes) because:

1. **Root Cause**: User has **0 credits** - the backend correctly returns an error via SSE:
   ```
   {"type":"error","data":{"message":"Insufficient credits. Need ~8, have 0."}}
   ```

2. **Frontend Gap**: The error is processed but not prominently surfaced. The `useAgentLoop` sets `step: 'error'` but the UI doesn't render a persistent error card with upgrade options.

3. **No Preflight Check**: Generation starts without verifying credits first, wasting a roundtrip and confusing users.

---

## Solution Overview

Implement a **dual-layer credit enforcement** system:

```text
User clicks Send
      │
      ▼
┌─────────────────────────┐
│ PREFLIGHT CHECK         │
│ credits >= estimatedCost│
└─────────────────────────┘
      │
      ├── NO ──► Show UpgradeModal immediately
      │
      ▼ YES
┌─────────────────────────┐
│ START GENERATION        │
│ Call vibecoder-orchestr │
└─────────────────────────┘
      │
      ├── SSE error (402/insufficient) ──► Show InsufficientCreditsCard in chat
      │
      ▼ SUCCESS
      Normal flow continues
```

---

## Implementation Plan

### 1. Add Preflight Credit Check in handleSendMessage

**File**: `src/components/ai-builder/AIBuilderCanvas.tsx`

Before calling `startAgent()`, check if user has enough credits:

```typescript
// In handleSendMessage, before ensureProject()

// PREFLIGHT: Estimate minimum credits needed
const estimatedCredits = isQuickEdit ? 1 : 3; // Minimum tier

if (userCredits < estimatedCredits) {
  setShowUpgradeModal(true);
  return; // Block generation
}
```

**Changes**:
- Add `showUpgradeModal` state
- Add `UpgradeModal` component import and render
- Pass `insufficientCredits={true}` prop to modal

---

### 2. Create InsufficientCreditsCard Component

**New File**: `src/components/ai-builder/InsufficientCreditsCard.tsx`

A persistent error card shown in the chat when backend rejects due to credits:

```typescript
interface InsufficientCreditsCardProps {
  creditsNeeded: number;
  creditsAvailable: number;
  onUpgrade: () => void;
}
```

**Visual Design**:
- Amber/orange gradient border (warning theme)
- Coins icon with animation
- Clear message: "Not enough credits"
- "Upgrade Plan" button → opens UpgradeModal
- "Add Credits" button → navigates to /pricing

---

### 3. Surface Credit Errors in VibecoderChat

**File**: `src/components/ai-builder/VibecoderChat.tsx`

When `agentStep === 'error'` and the error contains "Insufficient credits":

```typescript
// After ChatInterface, before LiveThought
{agentStep === 'error' && isCreditsError(agentError) && (
  <InsufficientCreditsCard 
    creditsNeeded={extractCreditsNeeded(agentError)}
    creditsAvailable={userCredits}
    onUpgrade={() => onOpenBilling?.()}
  />
)}
```

---

### 4. Extract Error Details from SSE in useAgentLoop

**File**: `src/hooks/useAgentLoop.ts`

When handling `type: 'error'` events, store structured error info:

```typescript
interface AgentState {
  // ... existing
  errorType?: 'credits' | 'auth' | 'api' | 'unknown';
  errorDetails?: {
    creditsNeeded?: number;
    creditsAvailable?: number;
    message: string;
  };
}

// In handleOrchestratorEvent case 'error':
const message = errorData?.message || 'Unknown error';
const isCreditsError = message.toLowerCase().includes('insufficient credits');

setState(prev => ({
  ...prev,
  step: 'error',
  error: message,
  errorType: isCreditsError ? 'credits' : 'unknown',
  errorDetails: isCreditsError ? parseCreditsError(message) : undefined,
  isRunning: false,
}));
```

---

### 5. Wire UpgradeModal into AIBuilderCanvas

**File**: `src/components/ai-builder/AIBuilderCanvas.tsx`

Add modal state and callbacks:

```typescript
const [showUpgradeModal, setShowUpgradeModal] = useState(false);

// In JSX, after other modals
<UpgradeModal 
  open={showUpgradeModal} 
  onOpenChange={setShowUpgradeModal}
  insufficientCredits={true}
/>
```

Pass `onOpenBilling` callback to `VibecoderChat`:

```typescript
<VibecoderChat
  // ... existing props
  onOpenBilling={() => setShowUpgradeModal(true)}
/>
```

---

### 6. Update ChatInputBar Credit Display

**File**: `src/components/ai-builder/ChatInputBar.tsx`

Already shows credits and has `showCreditsDialog` state. Enhance to:

1. Show warning color when credits < 3 (minimum for any build)
2. Disable submit with tooltip when credits are insufficient

```typescript
// In the credits display section
<span className={cn(
  "text-xs font-medium",
  userCredits < 3 ? "text-amber-500" : "text-muted-foreground"
)}>
  {userCredits}c
</span>
```

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/components/ai-builder/InsufficientCreditsCard.tsx` | CREATE | Error card for credit failures |
| `src/components/ai-builder/AIBuilderCanvas.tsx` | MODIFY | Add preflight check + modal state |
| `src/components/ai-builder/VibecoderChat.tsx` | MODIFY | Render error card for credit issues |
| `src/hooks/useAgentLoop.ts` | MODIFY | Extract structured error info |
| `src/components/ai-builder/ChatInputBar.tsx` | MODIFY | Warning styling for low credits |

---

## Technical Notes

### Error Message Parsing

The backend returns: `"Insufficient credits. Need ~8, have 0."`

Regex to extract values:
```typescript
function parseCreditsError(message: string) {
  const match = message.match(/Need ~(\d+), have (\d+)/);
  return match ? {
    creditsNeeded: parseInt(match[1]),
    creditsAvailable: parseInt(match[2]),
    message,
  } : { message };
}
```

### Credit Estimate for Preflight

| Scenario | Estimated Credits |
|----------|-------------------|
| Quick edit (short prompt, has existing code) | 1 |
| Any other prompt | 3 (minimum tier) |

The actual cost may be higher after Architect analyzes complexity, but preflight catches the obvious "0 credits" case immediately.

---

## User Experience Flow

**Before Fix**:
1. User types prompt → clicks Send
2. "Thinking" bubble appears for 0.5s
3. Bubble disappears silently
4. User confused, repeats, same result

**After Fix**:
1. User types prompt → clicks Send
2. **Preflight catches 0 credits** → UpgradeModal opens immediately
3. OR if preflight passes but backend still rejects:
   - InsufficientCreditsCard appears in chat
   - Shows exactly how many credits needed vs available
   - Upgrade button prominently displayed

---

## Success Criteria

- Zero-credit users see immediate feedback (no "blinking")
- Clear messaging about credit requirements
- Direct path to upgrade from error state
- No unnecessary API calls when credits are obviously insufficient
