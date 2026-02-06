
# Implementation Plan: Menu Fix, Speech-to-Text, and Fair Pricing Economy

## Overview

This plan addresses three critical issues:
1. **CSS Z-Index & Transparency Issues**: Menus are see-through and feel unclickable due to opacity and stacking problems
2. **Speech-to-Text Microphone Button**: Add a waveform-style microphone button for voice input
3. **Fair Pricing Economy**: Current credit costs are 8x more expensive than competitors—need price restructuring

---

## Part 1: Fix Menu Transparency & Clickability

### Problem Analysis
- Menus use `bg-zinc-900/98` which can still show transparency artifacts
- Click events may be getting lost due to z-index conflicts
- Need solid background with proper layering

### Changes to `src/components/ai-builder/ChatInputBar.tsx`

**Menu Styling Updates:**
- Change menu background from `bg-zinc-900/98` to solid `bg-zinc-950` with `ring-1 ring-white/5`
- Increase z-index from `z-50` to `z-[100]`
- Add `e.stopPropagation()` to button clicks to prevent event bubbling
- Add explicit click-outside overlay with higher z-index stacking

**Visual Improvements:**
- Solid opaque background for all dropdowns
- Enhanced shadow: `shadow-2xl shadow-black/60`
- Border styling: `border border-zinc-800`

---

## Part 2: Add Microphone/Waveform Speech-to-Text Button

### Feature Details
- Add animated waveform icon next to the textarea
- When clicked, initiates speech recognition
- Visual feedback: pulsing waveform animation while listening
- Transcribed text appends to the input field

### Implementation
1. **New Icon Component**: Create animated waveform SVG with bars
2. **Speech Recognition Hook**: Use browser's `SpeechRecognition` API (Web Speech API)
3. **UI States**: 
   - Idle: Static waveform icon
   - Listening: Pulsing red waveform with animation
   - Processing: Brief loading state

### New State Variables:
```typescript
const [isListening, setIsListening] = useState(false);
const speechRecognitionRef = useRef<SpeechRecognition | null>(null);
```

### Waveform Animation (CSS/Tailwind):
```tsx
<button className="group relative p-2 rounded-xl transition-all">
  <div className="flex items-end gap-0.5 h-4">
    {[1, 2, 3, 2, 1].map((h, i) => (
      <div 
        key={i}
        className={cn(
          "w-0.5 bg-current rounded-full transition-all",
          isListening && "animate-pulse"
        )}
        style={{ 
          height: isListening ? `${h * 4}px` : '4px',
          animationDelay: `${i * 0.1}s`
        }}
      />
    ))}
  </div>
</button>
```

---

## Part 3: Fair Pricing Economy Restructure

### Current vs. New Pricing

| Action | Current Cost | New Cost | Justification |
|--------|-------------|----------|---------------|
| Vibecoder Pro | 25c | 3c | Premium coding model |
| Vibecoder Flash | 0c | 0c | Free for small edits |
| Image Gen (Flux/Recraft) | 100c | 10c | ~$0.04 API cost × 2.5 margin |
| Video Gen (Kling/Luma) | 500c | 50c | ~$0.50 API cost × 1.25 margin |

### User Impact
- **Before**: 2,500 credits = 25 videos OR 100 chat messages
- **After**: 2,500 credits = 50 videos OR 833 chat messages

### Files to Update

**1. Frontend: `src/components/ai-builder/ChatInputBar.tsx`**
```typescript
export const AI_MODELS = {
  code: [
    { id: "vibecoder-pro", name: "Vibecoder Pro", cost: 3, ... },
    { id: "vibecoder-flash", name: "Vibecoder Flash", cost: 0, ... },
  ],
  image: [
    { id: "nano-banana", name: "Nano Banana", cost: 10, ... },
    { id: "flux-pro", name: "Flux 1.1 Pro", cost: 10, ... },
    { id: "recraft-v3", name: "Recraft V3", cost: 10, ... },
  ],
  video: [
    { id: "luma-ray-2", name: "Luma Ray 2", cost: 50, ... },
    { id: "kling-video", name: "Kling Video", cost: 50, ... },
  ],
};
```

**2. Backend: `supabase/functions/deduct-ai-credits/index.ts`**
```typescript
const CREDIT_COSTS: Record<string, number> = {
  vibecoder_gen: 3,      // Was 25
  vibecoder_flash: 0,    // Free tier
  image_gen: 10,         // Was 100
  video_gen: 50,         // Was 500
  sfx_gen: 5,            // Adjusted
  voice_isolator: 5,
  sfx_isolator: 5,
  music_splitter: 5,
};
```

**3. Backend: `supabase/functions/storefront-generate-asset/index.ts`**
```typescript
const MODEL_COSTS: Record<string, number> = {
  'nano-banana': 10,     // Was 100
  'flux-pro': 10,        // Was 100
  'recraft-v3': 10,      // Was 100
  'luma-ray-2': 50,      // Was 500
  'kling-video': 50,     // Was 500
};
```

---

## Technical Summary

| File | Type | Changes |
|------|------|---------|
| `src/components/ai-builder/ChatInputBar.tsx` | Frontend | Fix menu z-index/opacity, add microphone button, update pricing |
| `supabase/functions/deduct-ai-credits/index.ts` | Backend | Update CREDIT_COSTS map with new values |
| `supabase/functions/storefront-generate-asset/index.ts` | Backend | Update MODEL_COSTS map with new values |

---

## Expected Results

**After Part 1 (Menu Fix)**:
- Solid opaque dropdown backgrounds
- All menu items clickable without event leakage
- Proper z-index stacking above all content

**After Part 2 (Speech-to-Text)**:
- Animated waveform microphone button
- Click to start voice input
- Transcribed text appears in input field
- Visual feedback during listening

**After Part 3 (Fair Pricing)**:
- 8x reduction in perceived cost
- Users feel credits are valuable and generous
- Healthier profit margins aligned with API costs
