

# Implementation Plan: Self-Healing AI & Dynamic Personality

This plan implements three major improvements to make the Vibecoder AI "smart" and resilient:

1. **Auto-Fix Error Boundary** - Capture Sandpack errors and send them to the AI for self-healing
2. **Dynamic Personality Prompt** - Make the AI mirror user intent instead of robotic templates
3. **Enhanced Standard Library** - Add path alias mappings to prevent module crashes

---

## Part 1: Auto-Fix Error Boundary

### Problem
When the Sandpack preview crashes (e.g., "Module not found"), users see a scary red error screen with no way to recover. The AI doesn't know something broke.

### Solution
Create a `PreviewErrorBoundary` component that:
1. Catches runtime errors from the Sandpack preview
2. Displays a premium "Build Failed" UI with the exact error message
3. Provides an "Auto-Fix with AI" button that sends the error to the AI for automatic repair

### New File: `src/components/ai-builder/PreviewErrorBoundary.tsx`

```text
+----------------------------------------------------+
|  🔺  Build Failed                                  |
|                                                    |
|  ┌──────────────────────────────────────────────┐  |
|  │ Module not found: @/hooks/useSellsPayCheckout │  |
|  └──────────────────────────────────────────────┘  |
|                                                    |
|      [ ✨ Auto-Fix with AI ]                       |
|                                                    |
|  The AI will analyze the error and rewrite code.  |
+----------------------------------------------------+
```

**Key Features:**
- Class-based React ErrorBoundary to catch component errors
- `onAutoFix` callback prop that sends the error message to the parent
- Premium dark red styling with subtle pulse animation
- Error message displayed in a monospace code block

### File Updates: `src/components/ai-builder/AIBuilderCanvas.tsx`

1. Import the new `PreviewErrorBoundary` component
2. Create a `handleAutoFix` callback that:
   - Prefixes the error with `CRITICAL_ERROR_REPORT: The preview crashed...`
   - Calls `handleVibecoderMessage()` to trigger AI regeneration
3. Wrap `<VibecoderPreview>` in `<PreviewErrorBoundary onAutoFix={handleAutoFix}>`

### File Updates: `src/components/ai-builder/VibecoderPreview.tsx`

Since Sandpack handles its own errors internally, we need to listen to Sandpack's error state. We'll add a callback prop:
- `onError?: (error: string) => void`

When Sandpack reports an error, we'll call this callback which can then trigger the auto-fix flow.

---

## Part 2: Dynamic Personality (System Prompt Updates)

### Problem
The AI gives robotic responses like "I have drafted a premium layout" instead of engaging with the user's specific request.

### Solution
Update the system prompt in `supabase/functions/vibecoder-v2/index.ts` to add:

1. **Personality Protocol** - Force the AI to mirror user intent in its opening line
2. **Emergency Debug Protocol** - Handle error reports with technical precision
3. **Image Asset Protocol** - Force external URLs to prevent 404s

### New System Prompt Sections

```text
PERSONALITY & REFLECTION (Dynamic Responses):
You must NOT use generic templates like "I have generated..." or "Here is the layout...".
Instead, **MIRROR** the user's specific request in your opening line.

Examples:
- User: "Make it anime styled."
  You: "Injecting anime aesthetics. Adding vibrant character art and neon accents."

- User: "Add a dark hero section."
  You: "Building a cinematic dark hero. Full-bleed gradient with bold typography."

- User: "Change the button to blue."
  You: "Done. Primary buttons are now Electric Blue."

EMERGENCY & DEBUG PROTOCOL:
If the user sends a "CRITICAL_ERROR_REPORT" or mentions "crash", "red screen", or "broke":
1. **DROP THE PERSONA:** Stop being enthusiastic. Become the Lead Engineer.
2. **ACKNOWLEDGE:** "I detected a crash. Diagnosing..."
3. **ANALYZE:** Parse the error message:
   - "Module not found": Remove the broken import or fix the path.
   - "undefined": Add optional chaining (?.) or null checks.
   - "render error": Fix JSX syntax or missing keys.
4. **OUTPUT:** Fix the code immediately. No chat-only response.

IMAGE ASSET PROTOCOL:
1. **NO LOCAL PATHS:** Never use src="./img.png" or src="/assets/...". These do not exist in Sandpack.
2. **USE EXTERNAL URLs:** Always use high-quality placeholder URLs:
   - Unsplash: "https://images.unsplash.com/photo-..."
   - Picsum: "https://picsum.photos/800/600"
3. **Category Examples:**
   - Anime/Gaming: picsum.photos with grayscale or Unsplash abstract
   - Fashion: Unsplash fashion collection
   - Tech: Unsplash technology collection
```

---

## Part 3: Enhanced Standard Library

### Problem
The AI sometimes imports from `@/hooks/useSellsPayCheckout` but the path in Sandpack is `/hooks/useSellsPayCheckout.ts`. The `@/` alias doesn't work in the Sandpack virtual filesystem.

### Solution
Update `src/lib/vibecoder-stdlib.ts` to:
1. Add multiple path aliases for the checkout hook
2. Add a default export for compatibility
3. Include common utility files the AI might expect

### Updated Standard Library

```typescript
export const VIBECODER_STDLIB: Record<string, string> = {
  // Primary checkout hook
  '/hooks/useSellsPayCheckout.ts': `...mocked hook...`,
  
  // Path aliases (catching AI import variations)
  '/hooks/useMarketplace.ts': `export * from './useSellsPayCheckout';`,
  '/useSellsPayCheckout.ts': `export * from './hooks/useSellsPayCheckout';`,
  
  // Utility file
  '/lib/utils.ts': `...cn function...`,
};
```

### File Updates: `src/components/ai-builder/VibecoderPreview.tsx`

Ensure the stdlib files are injected at proper paths. The current implementation already does this correctly, but we'll verify the hidden flag is set properly so these files don't clutter the Sandpack file tree.

---

## Technical Summary

| File | Changes |
|------|---------|
| `src/components/ai-builder/PreviewErrorBoundary.tsx` | **New file** - Error boundary with Auto-Fix button |
| `src/components/ai-builder/AIBuilderCanvas.tsx` | Add `handleAutoFix` callback, wrap preview in error boundary |
| `src/components/ai-builder/VibecoderPreview.tsx` | Add error detection from Sandpack state |
| `supabase/functions/vibecoder-v2/index.ts` | Add Personality, Emergency, and Image protocols to prompt |
| `src/lib/vibecoder-stdlib.ts` | Add path aliases and default export |

---

## Expected User Experience

### Crash Recovery Flow
1. **Error occurs**: Sandpack fails to compile (e.g., missing module)
2. **Beautiful error UI**: Red overlay with exact error message
3. **One-click fix**: User clicks "Auto-Fix with AI"
4. **AI diagnoses**: "I detected a crash: Module not found. Fixing the import path..."
5. **Code regenerates**: Preview comes back online automatically

### Dynamic Personality Flow
- User: "Make it anime themed"
- Old AI: "I have drafted a premium layout with anime aesthetics."
- New AI: "Injecting anime aesthetics. Bold character art and neon speed-lines incoming."

### Image Safety Flow
- AI no longer generates `src="/images/product.png"` (would 404)
- AI generates `src="https://images.unsplash.com/..."` (always works)

---

## Implementation Notes

1. **Sandpack Error Detection**: Sandpack provides error state through its internal hooks. We may need to use `useSandpack()` hook to access `sandpack.error` state and trigger the callback.

2. **Error Boundary Scope**: The error boundary catches React rendering errors but may not catch Sandpack compilation errors. We'll need to handle both:
   - React ErrorBoundary for runtime crashes
   - Sandpack's built-in error state for compilation errors

3. **Auto-Fix Message Format**: The error message sent to the AI should include:
   - The literal error text
   - The current code (if available)
   - Clear instruction to fix, not discuss

