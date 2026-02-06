

# Creative Studio Implementation Plan

## Overview

This plan implements a **Creative Studio** — a dedicated workspace for generating images/videos that is architecturally separate from the website building preview. Users can:
1. Generate assets using image/video models (Flux, Nano Banana, Kling, Luma)
2. Review the generated asset in a dedicated canvas
3. Inject the asset into their website with natural language placement instructions

---

## Architecture Diagram

```text
┌─────────────────────────────────────────────────────────────────────┐
│                        AIBuilderCanvas                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   viewMode: 'preview' | 'code' | 'generation'  ◄── NEW STATE        │
│   currentAsset: GeneratedAsset | null           ◄── NEW STATE        │
│   isAssetGenerating: boolean                    ◄── NEW STATE        │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌─────────────┐     ┌─────────────────────────────────────────┐   │
│   │  Project    │     │          MAIN CANVAS AREA               │   │
│   │  Sidebar    │     │  ┌─────────────────────────────────────┐│   │
│   │             │     │  │  if viewMode === 'generation':     ││   │
│   │             │     │  │    <GenerationCanvas />              ││   │
│   │             │     │  │  else:                               ││   │
│   │             │     │  │    <VibecoderPreview />              ││   │
│   │             │     │  └─────────────────────────────────────┘│   │
│   └─────────────┘     └─────────────────────────────────────────┘   │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                   CHAT PANEL                                │   │
│   │   ChatInputBar (model selector detects image/video models)  │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Part 1: New Types & State Management

### File: `src/components/ai-builder/types/generation.ts` (NEW)

Define the generated asset interface and related types:

```typescript
export interface GeneratedAsset {
  id: string;
  type: 'image' | 'video';
  url: string;
  prompt: string;
  modelId: string;
  createdAt: Date;
}

export type ViewMode = 'preview' | 'code' | 'generation';
```

### File: `src/components/ai-builder/AIBuilderCanvas.tsx` (MODIFY)

Add new state variables:
- `viewMode: 'preview' | 'code' | 'generation'` (extend existing)
- `currentAsset: GeneratedAsset | null`
- `isAssetGenerating: boolean`
- `showPlacementModal: boolean`

Add new handlers:
- `handleAssetGeneration()` — calls backend, switches to generation view
- `handleApplyToCanvas()` — takes placement instructions and constructs special prompt
- `handleRetryGeneration()` — regenerates with same prompt

---

## Part 2: Generation Canvas Component (NEW)

### File: `src/components/ai-builder/GenerationCanvas.tsx`

A new component that replaces the website preview when in generation mode.

**Three Visual States:**

| State | Description |
|-------|-------------|
| Empty | No generation started — shows "Creative Studio" placeholder with icon |
| Loading | Generation in progress — animated spinner with "Creating magic..." text |
| Result | Asset displayed with floating action toolbar |

**Action Toolbar (on Result state):**
- 👍 / 👎 — Feedback buttons
- 🔄 Retry — Regenerate with same prompt
- ✨ Use in Canvas — Opens PlacementPromptModal

**Props:**
```typescript
interface GenerationCanvasProps {
  asset: GeneratedAsset | null;
  isLoading: boolean;
  onRetry: () => void;
  onUseInCanvas: () => void;
  onFeedback: (rating: 'positive' | 'negative') => void;
}
```

**Design:**
- Full-height dark background (`bg-zinc-950`)
- Asset centered with `max-h-full max-w-full object-contain`
- Video uses HTML5 video player with controls
- Floating toolbar at bottom center with glassmorphism styling

---

## Part 3: Placement Prompt Modal (NEW)

### File: `src/components/ai-builder/PlacementPromptModal.tsx`

A modal that appears when user clicks "Use in Canvas".

**UI Elements:**
- Thumbnail of the generated asset (16x16 preview)
- Headline: "Where should this go?"
- Subtext: "Describe the exact location on your canvas"
- Textarea for placement instructions
- Submit button: "Apply to Canvas"

**Behavior:**
1. User enters natural language instructions (e.g., "Replace the main hero image")
2. On submit, constructs a special prompt for the AI:
   ```
   [ASSET_INJECTION_REQUEST]
   Asset Type: image
   Asset URL: https://...base64...
   User Instructions: Replace the main hero image with this logo
   
   TASK: Modify the existing code to place this asset as specified.
   ```
3. Closes modal, switches to preview mode, triggers code generation

---

## Part 4: ChatInputBar Integration

### File: `src/components/ai-builder/ChatInputBar.tsx` (MODIFY)

The `AI_MODELS` config already has `category` property. We need to ensure the parent component can detect when an image/video model is selected.

**Changes:**
- Export the `category` property on `AIModel` type
- No structural changes needed — the parent (`VibecoderChat`) receives the model in `onSubmit`

---

## Part 5: Chat Handler Flow Routing

### File: `src/components/ai-builder/VibecoderChat.tsx` (MODIFY)

Update `handleSubmit` to detect asset models and route appropriately:

```typescript
const handleSubmit = (options: { model: AIModel; ... }) => {
  const isAssetModel = options.model.category === 'image' || options.model.category === 'video';
  
  if (isAssetModel) {
    // Call onGenerateAsset with model and prompt
    onGenerateAsset?.(options.model, input);
  } else {
    // Existing code generation flow
    onSendMessage(finalPrompt);
  }
};
```

**New Prop on VibecoderChat:**
```typescript
onGenerateAsset?: (model: AIModel, prompt: string) => void;
```

---

## Part 6: Header View Mode Update

### File: `src/components/ai-builder/VibecoderHeader.tsx` (MODIFY)

Extend the view mode pill to support a third "Studio" option:

```typescript
viewMode: 'preview' | 'code' | 'generation'
```

Add a third button in the view switcher with 🎨 icon and "Studio" label. This allows manual switching between modes.

---

## Part 7: Backend Integration

### File: `supabase/functions/storefront-generate-asset/index.ts` (EXISTING)

This function already handles:
- Credit deduction
- Image generation via Lovable AI
- Saving to `storefront_generated_assets` table

**No changes needed** — the frontend will call this function from `AIBuilderCanvas`.

---

## File Changes Summary

| File | Action | Changes |
|------|--------|---------|
| `src/components/ai-builder/types/generation.ts` | CREATE | New types for GeneratedAsset, ViewMode |
| `src/components/ai-builder/GenerationCanvas.tsx` | CREATE | New canvas component with 3 states (empty/loading/result) |
| `src/components/ai-builder/PlacementPromptModal.tsx` | CREATE | Modal for asset placement instructions |
| `src/components/ai-builder/AIBuilderCanvas.tsx` | MODIFY | Add generation state, asset state, routing logic |
| `src/components/ai-builder/VibecoderChat.tsx` | MODIFY | Add onGenerateAsset prop and routing in handleSubmit |
| `src/components/ai-builder/VibecoderHeader.tsx` | MODIFY | Add "Studio" view mode option |
| `src/components/ai-builder/ChatInputBar.tsx` | MINOR | Ensure category export on AIModel type |

---

## User Flow Summary

1. **Select Model**: User clicks model dropdown, selects "Flux 1.1 Pro"
2. **Type Prompt**: "A premium logo with violet accents"
3. **Submit**: System detects image model → routes to asset generation
4. **View Switches**: `viewMode` changes to `'generation'`, website preview replaced by Creative Studio
5. **Loading**: Spinner with "Creating magic..." while backend generates
6. **Result**: Generated image appears centered, floating toolbar visible
7. **Use in Canvas**: User clicks button → PlacementPromptModal opens
8. **Instructions**: User types "Put this in the header section"
9. **Apply**: Modal closes, `viewMode` changes to `'preview'`, special prompt sent to code generator
10. **Result**: Website preview shows with new image inserted

---

## Technical Considerations

### Asset URL Handling
The Lovable AI image generation returns base64-encoded images. These will be passed directly to the Sandpack preview since:
- Base64 URLs work in `<img src="data:image/...">` tags
- No separate upload/storage step needed for preview
- Assets can optionally be saved to Supabase Storage later for persistence

### Credit Tracking
The existing `storefront-generate-asset` function already deducts credits before generation. The frontend should:
- Check user credits before allowing generation
- Display toast on 402 (insufficient credits) response

### Error Handling
- If generation fails, refund credits (already implemented in backend)
- Show error toast and remain in generation view
- Allow retry with same prompt

