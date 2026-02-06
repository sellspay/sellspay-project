
# Three-Step UI Enhancement Plan

## Overview

This plan implements three key improvements to the AI Builder:

1. **PageNavigator Component** - Replace the static URL bar with a functional page selector dropdown
2. **TextArea Max Height Fix** - Enforce a strict 6-line limit (~160px) with proper scroll behavior  
3. **Real-Time Speech Transcription** - Add `interimResults` to show text while speaking (instead of waiting for silence)

---

## Step 1: PageNavigator Component

### New File: `src/components/ai-builder/PageNavigator.tsx`

Create a dropdown component that replaces the static `/ai-builder` URL pill:

**Features:**
- Green "Live" indicator dot
- Shows current page path (e.g., "Home", "/products")
- Dropdown with all site pages (Home, Products, Login, Contact)
- "Create New Page" quick action at bottom
- Click-outside to close behavior

**Props:**
```typescript
interface PageNavigatorProps {
  activePage?: string;
  onPageChange?: (pageId: string) => void;
}
```

**Mock Pages (for UI demo):**
```text
┌──────────────────────────────────────┐
│  ● Home                        ▼     │  ← Trigger
└──────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│  Site Pages                          │
├──────────────────────────────────────┤
│  🏠 Home                         ✓   │
│  🛍️ Products                         │
│  👤 Login                            │
│  ✉️ Contact                          │
├──────────────────────────────────────┤
│  + Create New Page                   │
└──────────────────────────────────────┘
```

### Modify: `src/components/ai-builder/VibecoderHeader.tsx`

**Changes to LEFT section:**
- Remove the project selector button (lines 98-107)
- Remove the separator line (line 96)
- Keep only the "Exit" button

**Changes to RIGHT section:**
- Replace the static Address Bar (lines 194-204) with `<PageNavigator />`
- Keep the Refresh button functionality within PageNavigator

**Before:**
```text
[ ← Exit ] | [ 🟣 Anime Store ▼ ] [Live]     [Preview|Code|Image|Video]     [●/ai-builder ↻] [Publish] | [👤]
```

**After:**
```text
[ ← Exit ]                                   [Preview|Code|Image|Video]     [● Home ▼ ↻] [Publish] | [👤]
```

---

## Step 2: TextArea Max Height Fix

### Modify: `src/components/ai-builder/ChatInputBar.tsx`

**Current Issue:** 
The textarea auto-resize logic caps at 200px but doesn't enforce scrollbar behavior precisely.

**Solution:**
Update the `useEffect` resize handler (lines 317-323) to:

1. Set `maxHeight` constant to `160px` (~6 lines)
2. Dynamically toggle `overflowY` between `hidden` and `auto` based on content
3. Ensure `minHeight` stays at 36-44px for single-line appearance

**Updated Logic:**
```typescript
useEffect(() => {
  const textarea = textareaRef.current;
  if (textarea) {
    // Reset to measure true scrollHeight
    textarea.style.height = 'auto';
    
    const MAX_HEIGHT = 160; // ~6 lines
    const newHeight = Math.min(textarea.scrollHeight, MAX_HEIGHT);
    textarea.style.height = `${newHeight}px`;
    
    // Enable scroll only when hitting the limit
    textarea.style.overflowY = textarea.scrollHeight > MAX_HEIGHT ? 'auto' : 'hidden';
  }
}, [value]);
```

**CSS Changes to textarea (line 625-630):**
- Change `max-h-[200px]` to `max-h-[160px]`
- Add `scrollbar-thin scrollbar-thumb-zinc-600 scrollbar-track-transparent`

---

## Step 3: Real-Time Speech Transcription

### Modify: `src/components/ai-builder/ChatInputBar.tsx`

**Current Issue:**
The speech recognition already has `interimResults: true` (line 272), but the `onresult` handler only appends `finalTranscript` (lines 289-291). It ignores `interimTranscript`, causing the delay.

**Solution:**
Track interim text separately and show it live in the input while speaking:

1. Add `promptBeforeSpeech` ref to remember text before mic started
2. Track both `finalTranscript` and `interimTranscript` in `onresult`
3. Update the input value with: `baseText + finalTranscript + interimTranscript`

**Updated `onresult` Handler:**
```typescript
// Add ref before toggleSpeechRecognition
const promptBeforeSpeechRef = useRef("");

const toggleSpeechRecognition = useCallback(() => {
  // ... existing SpeechRecognition checks ...

  // Save current text before starting
  promptBeforeSpeechRef.current = value;

  recognition.onresult = (event: SpeechRecognitionEvent) => {
    let finalTranscript = '';
    let interimTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript;
      } else {
        interimTranscript += transcript;
      }
    }

    // UPDATE IMMEDIATELY with both final AND interim text
    const spacing = promptBeforeSpeechRef.current ? ' ' : '';
    onChange(promptBeforeSpeechRef.current + spacing + finalTranscript + interimTranscript);
    
    // Update base text when final transcript is confirmed
    if (finalTranscript) {
      promptBeforeSpeechRef.current += spacing + finalTranscript;
    }
  };

  // ... rest of recognition setup ...
}, [isListening, value, onChange]);
```

**Visual Feedback Enhancements:**
- Placeholder changes to "Listening..." with pulse animation when active
- Input text styled with subtle violet tint during transcription

---

## File Changes Summary

| File | Action | Changes |
|------|--------|---------|
| `src/components/ai-builder/PageNavigator.tsx` | CREATE | New page selector dropdown component |
| `src/components/ai-builder/VibecoderHeader.tsx` | MODIFY | Remove project selector from left, add PageNavigator to right |
| `src/components/ai-builder/ChatInputBar.tsx` | MODIFY | Fix 6-line max height, add real-time speech transcription |
| `src/components/ai-builder/index.ts` | MODIFY | Export PageNavigator |

---

## Expected Results

### Step 1 - PageNavigator:
- Clean left side with just "Exit" button
- Functional page dropdown on the right showing "Home" with green dot
- Clicking reveals page list with checkmark on active page
- Refresh button integrated into the navigator

### Step 2 - TextArea Fix:
- Textarea grows smoothly for lines 1-6
- At line 7+, scrollbar appears and height locks at 160px
- No layout jumping or jittering

### Step 3 - Real-Time Speech:
- Words appear INSTANTLY as you speak (no waiting for pauses)
- If you typed "Create a button and " then click mic and say "make it blue", result is "Create a button and make it blue"
- Mic icon pulses red with waveform animation while active
