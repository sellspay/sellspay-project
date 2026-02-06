

# ChatInputBar Layout Fix & PageNavigator Cleanup

## Overview

This plan fixes two key issues in the AI Builder:

1. **ChatInputBar Layout Collision** - The speech-to-text updates are causing layout glitches because interim text changes trigger textarea resize logic too aggressively. The "Low Balance" warning is also improperly nested inside the flex container.

2. **PageNavigator Cleanup** - Remove the "Login" page and "Create New Page" button, and ensure navigation actually works.

---

## Part 1: ChatInputBar Layout Stabilization

### Problem Analysis

Looking at the current code (lines 738-746), the "Low Balance Warning" is placed **inside** the flex container (`<div className="flex items-end gap-2 p-2">`). This causes:

1. The warning text competes with the textarea for space
2. Speech-to-text interim results trigger resize calculations
3. The layout "fights" between elements, causing infinite scroll glitches

### Solution: Move Warning Outside + Add Speech Popup Bubble

**File:** `src/components/ai-builder/ChatInputBar.tsx`

#### Change 1: Extract Warning from Flex Container

Move the "Insufficient credits" warning **outside** the main flex container so it doesn't affect layout calculations.

```text
Current structure (BROKEN):
┌─────────────────────────────────────────┐
│ [Model Selector]           [Credits]    │
│ ┌─────────────────────────────────────┐ │
│ │ [+] [Textarea......] [Mic] [Send]   │ │
│ │ [Warning text inside flex!]         │ │ ← PROBLEM
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘

Fixed structure:
┌─────────────────────────────────────────┐
│ [Model Selector]           [Credits]    │
│ ┌─────────────────────────────────────┐ │
│ │ [+] [Textarea......] [Mic] [Send]   │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
│ [Warning text OUTSIDE the box]          │ ← FIXED
```

#### Change 2: Add Floating Speech Bubble

When `isListening` is true, show a floating "popup" bubble above the input container. This separates the live speech text from the main textarea, preventing resize loops.

```text
┌─────────────────────────────────────────┐
│ 🔴 Listening...                         │ ← Floating bubble
│ "Hello this is what I'm saying..."      │
│                                     [X] │
└─────────────────────────────────────────┘
                    ▼
┌─────────────────────────────────────────┐
│ [Model Selector]           [Credits]    │
│ [+] [Textarea......] [Mic] [Send]       │
└─────────────────────────────────────────┘
```

#### Change 3: Separate Speech State

Add a `transcript` state to hold the live speech text separately from the main `value`. This prevents constant re-renders of the textarea while speaking.

```typescript
const [transcript, setTranscript] = useState("");  // Live speech text (popup only)

// In onresult handler:
recognition.onresult = (event) => {
  let liveText = "";
  for (let i = event.resultIndex; i < event.results.length; i++) {
    liveText += event.results[i][0].transcript;
  }
  setTranscript(liveText);  // Update popup, NOT main input
};

// When mic stops, append to main input:
recognition.onend = () => {
  if (transcript.trim()) {
    const spacing = value.trim() ? " " : "";
    onChange(value + spacing + transcript);
  }
  setTranscript("");
};
```

### Technical Details

| Line Range | Change |
|------------|--------|
| 243 | Add `transcript` state: `const [transcript, setTranscript] = useState("");` |
| 256-257 | Update `promptBeforeSpeechRef` to track text before mic started |
| 285-306 | Modify `onresult` to update `transcript` state instead of `value` |
| 314-316 | Update `onend` to append transcript to value and clear |
| 422-430 | Add floating speech bubble JSX before the main container |
| 738-746 | Move warning outside the rounded container |

---

## Part 2: PageNavigator Cleanup

### Problem Analysis

Looking at `src/components/ai-builder/PageNavigator.tsx` (provided in context):

1. Contains a "Login" page that shouldn't be in a storefront navigator
2. Has a "Create New Page" button that implies users can create pages (only AI should)
3. The `onPageChange` callback exists but navigation isn't wired up

### Solution

**File:** `src/components/ai-builder/PageNavigator.tsx`

#### Change 1: Remove Login from SITE_PAGES

```typescript
// BEFORE
const SITE_PAGES = [
  { id: "home", path: "/", label: "Home", icon: Layout },
  { id: "products", path: "/products", label: "Products", icon: ShoppingBag },
  { id: "login", path: "/login", label: "Login", icon: User },  // ← REMOVE
  { id: "contact", path: "/contact", label: "Contact", icon: Mail },
];

// AFTER
const SITE_PAGES = [
  { id: "home", path: "/", label: "Home", icon: Layout },
  { id: "products", path: "/products", label: "Products", icon: ShoppingBag },
  { id: "contact", path: "/contact", label: "Contact", icon: Mail },
];
```

#### Change 2: Remove "Create New Page" Button

Delete the footer section with the `<Plus />` icon button (lines ~95-105 in PageNavigator.tsx).

#### Change 3: Update Interface to Include onNavigate

Rename `onPageChange` to `onNavigate` for clarity and ensure it's called on selection.

---

## File Changes Summary

| File | Action | Changes |
|------|--------|---------|
| `src/components/ai-builder/ChatInputBar.tsx` | MODIFY | Add transcript state, speech popup bubble, move warning outside container |
| `src/components/ai-builder/PageNavigator.tsx` | MODIFY | Remove Login page, remove Create New Page button |

---

## Expected Results

### ChatInputBar

- ✅ Speech popup appears as floating bubble above input
- ✅ Main textarea doesn't resize during speech
- ✅ Warning text is outside the box, no layout collision
- ✅ Users can type with 0 credits (only Send button is blocked)
- ✅ No more infinite scroll glitch

### PageNavigator

- ✅ Only shows Home, Products, Contact pages
- ✅ No "Create New Page" button
- ✅ Clicking a page triggers navigation callback

