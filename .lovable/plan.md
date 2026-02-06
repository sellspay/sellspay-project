
# Portal-Based Menu Fix & Backend Model Routing

## Problem Analysis

The menus in `ChatInputBar.tsx` are rendered inside a parent container (`AIBuilderCanvas.tsx` line 427) that uses `overflow-hidden`. This CSS property clips any child element that extends beyond the container's boundaries, making the dropdown menus:

1. **Clipped/Cut Off**: Menus can't extend outside the chat panel
2. **Unclickable in Clipped Regions**: Events don't register on invisible parts
3. **Z-Index Irrelevant**: No amount of z-index can escape `overflow-hidden`

The current menu implementation:
```tsx
// Current (broken) - trapped by parent overflow
<div className="relative">
  <button onClick={() => setShowModelMenu(!showModelMenu)}>...</button>
  {showModelMenu && (
    <div className="absolute bottom-full mb-2 ...">  {/* Clipped! */}
      ...menu content...
    </div>
  )}
</div>
```

---

## Solution: React Portal Implementation

### Part 1: Create Portal Component

Add a simple Portal utility inside `ChatInputBar.tsx`:

```tsx
import { createPortal } from "react-dom";

const Portal = ({ children }: { children: React.ReactNode }) => {
  if (typeof window === "undefined") return null;
  return createPortal(children, document.body);
};
```

### Part 2: Add Position Tracking State

Track the button's screen coordinates to position the portal menu:

```tsx
const [modelMenuCoords, setModelMenuCoords] = useState({ top: 0, left: 0 });
const [plusMenuCoords, setPlusMenuCoords] = useState({ top: 0, left: 0 });
const modelButtonRef = useRef<HTMLButtonElement>(null);
const plusButtonRef = useRef<HTMLButtonElement>(null);
```

### Part 3: Update Model Menu to Use Portal

**Before (clipped by parent):**
```tsx
{showModelMenu && (
  <div className="absolute bottom-full mb-2 left-0 w-64 bg-zinc-950 ...">
    ...menu content...
  </div>
)}
```

**After (portaled to body):**
```tsx
{showModelMenu && (
  <Portal>
    {/* Invisible backdrop to catch outside clicks */}
    <div 
      className="fixed inset-0 z-[9998]" 
      onClick={() => setShowModelMenu(false)} 
    />
    {/* Menu positioned using fixed coordinates */}
    <div 
      className="fixed z-[9999] w-64 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl shadow-black/60"
      style={{ 
        left: modelMenuCoords.left,
        bottom: window.innerHeight - modelMenuCoords.top + 8,
      }}
    >
      ...menu content...
    </div>
  </Portal>
)}
```

### Part 4: Calculate Position on Toggle

```tsx
const toggleModelMenu = () => {
  if (!showModelMenu && modelButtonRef.current) {
    const rect = modelButtonRef.current.getBoundingClientRect();
    setModelMenuCoords({
      left: rect.left,
      top: rect.top,
    });
  }
  setShowModelMenu(!showModelMenu);
  setShowMenu(false); // Close other menu
};

const togglePlusMenu = () => {
  if (!showMenu && plusButtonRef.current) {
    const rect = plusButtonRef.current.getBoundingClientRect();
    setPlusMenuCoords({
      left: rect.left,
      top: rect.top,
    });
  }
  setShowMenu(!showMenu);
  setShowModelMenu(false); // Close other menu
};
```

### Part 5: Apply Same Pattern to Plus (Attachment) Menu

Both menus will be portaled with the same technique.

---

## Part 2: Backend Model Routing

Currently, `vibecoder-v2/index.ts` accepts a `model` parameter but only uses it for credit calculation. We need to route to different AI backends based on the selected model.

### Update Edge Function Model Router

In `supabase/functions/vibecoder-v2/index.ts`, add model-specific configuration:

```typescript
// Model Configuration Mapping
const MODEL_CONFIG: Record<string, { endpoint: string; modelId: string }> = {
  'vibecoder-pro': { 
    endpoint: LOVABLE_AI_URL, 
    modelId: 'google/gemini-3-flash-preview' 
  },
  'vibecoder-flash': { 
    endpoint: LOVABLE_AI_URL, 
    modelId: 'google/gemini-2.5-flash-lite' 
  },
  'reasoning-o1': { 
    endpoint: LOVABLE_AI_URL, 
    modelId: 'openai/gpt-5.2' 
  },
};
```

Then use it when calling the AI:
```typescript
const config = MODEL_CONFIG[model] || MODEL_CONFIG['vibecoder-pro'];

const response = await fetch(config.endpoint, {
  method: "POST",
  headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, ... },
  body: JSON.stringify({
    model: config.modelId,  // Dynamic model selection
    messages: [...],
    stream: true,
  }),
});
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/ai-builder/ChatInputBar.tsx` | Add Portal component, position tracking refs/state, update both menus to use portals |
| `supabase/functions/vibecoder-v2/index.ts` | Add MODEL_CONFIG routing table, use dynamic model ID in API calls |

---

## Technical Summary

### Portal Benefits
- **Escapes `overflow-hidden`**: Renders directly on `document.body`
- **Proper z-index stacking**: Uses `z-[9999]` on body layer
- **Accurate positioning**: Uses `getBoundingClientRect()` for pixel-perfect placement
- **Click-outside handling**: Invisible backdrop catches all outside clicks

### Expected Results
1. Model dropdown menu will render above all content, fully visible
2. Plus (attachment) menu will render above all content, fully visible
3. Both menus will be scrollable if content exceeds max-height
4. Selecting a model will route to the appropriate AI backend (Gemini Flash for cheap, GPT-5.2 for reasoning)
