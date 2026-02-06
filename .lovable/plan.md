
# Fix: Replace Hardcoded AI Responses with Real Dynamic Text

## Problem Summary

The AI Builder throws away the AI's intelligent, context-aware response and replaces it with a generic hardcoded message like `"I've drafted a premium layout based on your request. Check the preview!"`. This makes the AI feel robotic and fake.

**Current Flow:**
```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ AI Generates:                                                               │
│   [LOG: Designing responsive grid...]                                       │
│   "Building your anime storefront. Injecting neon accents and..."           │
│   /// TYPE: CODE ///                                                        │
│   export default function App() { ... }                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ useStreamingCode.ts:                                                        │
│   ✓ Extracts LOG tags (for progress steps)                                  │
│   ✓ Extracts code (for preview)                                             │
│   ✗ DISCARDS the AI's natural language response                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ AIBuilderCanvas.tsx (onComplete):                                           │
│   → Saves: "Generated your storefront design." (HARDCODED)                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ VibecoderMessageBubble.tsx:                                                 │
│   → Replaces with: "I've drafted a premium layout..." (DOUBLE HARDCODED)    │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Target Flow:**
```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ AI Generates:                                                               │
│   [LOG: Designing responsive grid...]                                       │
│   "Building your anime storefront. Injecting neon accents and..."           │
│   /// TYPE: CODE ///                                                        │
│   export default function App() { ... }                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ useStreamingCode.ts:                                                        │
│   ✓ Extracts LOG tags (for progress steps)                                  │
│   ✓ Extracts code (for preview)                                             │
│   ✓ NEW: Extracts the AI summary text and calls onSummary()                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ AIBuilderCanvas.tsx (onComplete):                                           │
│   → Saves the REAL AI summary as the assistant message                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ VibecoderMessageBubble.tsx:                                                 │
│   → Displays the REAL AI text (no replacement)                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Plan

### Step 1: Modify `useStreamingCode.ts` to Extract the AI Summary

The stream comes in this format:
```
[LOG: Action 1...]
[LOG: Action 2...]
Building your storefront with neon accents and anime vibes...
/// TYPE: CODE ///
export default function App() { ... }
```

Extract the text between the last LOG tag and `/// TYPE: CODE ///`:

**Changes:**
- Add new state to track the accumulated summary text
- Add new callback `onSummary?: (summary: string) => void` to options
- Parse the pre-code text (strip LOG tags, trim whitespace)
- Call `onSummary()` with the real AI text when streaming completes

### Step 2: Update `AIBuilderCanvas.tsx` to Use the Real Summary

**Changes:**
- Add a `pendingSummaryRef` to capture the AI's response during streaming
- Wire up the new `onSummary` callback to store the text
- In `onComplete`, use the real summary instead of `"Generated your storefront design."`
- Fallback to a generic message only if the AI produced no summary

### Step 3: Remove Hardcoded Replacement in `VibecoderMessageBubble.tsx`

**Changes:**
- Delete the conditional that replaces `"Generated your storefront design."` with fake text
- The `displayContent` variable should just use `message.content` directly

### Step 4: Update System Prompt for Clearer Summary Format (Optional Enhancement)

The system prompt in `vibecoder-v2/index.ts` already has good "MIRRORING" rules. We can optionally add a clearer instruction to emit the summary on a dedicated line before the code block.

---

## Technical Details

### File: `src/components/ai-builder/useStreamingCode.ts`

Add summary extraction logic:

```typescript
interface UseStreamingCodeOptions {
  // ... existing options
  onSummary?: (summary: string) => void; // NEW: AI's natural language response
}

// Inside the streaming loop, after processing is done:
// Extract text between LOG tags and TYPE: CODE marker
function extractSummary(rawStream: string): string {
  // Remove LOG tags
  let cleaned = rawStream.replace(LOG_PATTERN, '').trim();
  
  // Find the position of TYPE: CODE
  const codeMarker = '/// TYPE: CODE ///';
  const codeIndex = cleaned.indexOf(codeMarker);
  
  if (codeIndex > 0) {
    // Everything before the code marker is the summary
    return cleaned.substring(0, codeIndex).trim();
  }
  
  return ''; // No summary found
}

// Call at the end of successful code streaming:
const summary = extractSummary(fullAccumulated);
if (summary) {
  options.onSummary?.(summary);
}
```

### File: `src/components/ai-builder/AIBuilderCanvas.tsx`

Use the real summary:

```typescript
// New ref to capture the AI's response during streaming
const pendingSummaryRef = useRef<string>('');

// In useStreamingCode options:
onSummary: (summary: string) => {
  pendingSummaryRef.current = summary;
},
onComplete: async (finalCode) => {
  // Use the real summary, or fallback if empty
  const aiResponse = pendingSummaryRef.current || 'Applied your changes.';
  pendingSummaryRef.current = ''; // Reset for next generation
  
  await addMessage('assistant', aiResponse, finalCode, generationLockRef.current || undefined);
  // ... rest of completion logic
}
```

### File: `src/components/ai-builder/VibecoderMessageBubble.tsx`

Remove the fake replacement:

```typescript
// BEFORE (fake text):
const displayContent = message.content === "Generated your storefront design." 
  ? "I've drafted a premium layout based on your request. Check the preview!" 
  : message.content;

// AFTER (real text):
const displayContent = message.content;
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/ai-builder/useStreamingCode.ts` | Add `onSummary` callback, extract pre-code text |
| `src/components/ai-builder/AIBuilderCanvas.tsx` | Wire `onSummary`, use real summary in `addMessage` |
| `src/components/ai-builder/VibecoderMessageBubble.tsx` | Remove hardcoded text replacement |

---

## Expected Result

**Before:**
> "I've drafted a premium layout based on your request. Check the preview!"

**After:**
> "Building your anime storefront. Injecting neon accents and adding glassmorphism cards with violet gradients. Updated the hero section with dynamic character imagery and ensured mobile responsiveness."

The AI will now feel like a **Senior Engineer** explaining exactly what it built, not a script reading from a template.
