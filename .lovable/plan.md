

## Overview

This plan addresses three major requirements:
1. **Strip AI features from the free Profile Editor** - Remove AI Builder, Brand, and Settings tabs, keeping only the manual sections editor
2. **Fix the AI Builder canvas text leak** - Stop the massive text from appearing on the canvas
3. **Migrate chat features to the new AI Builder** - Port the Like/Dislike, Undo toolbar, + dropdown menu, and other features from `VibecoderChat` to `AIBuilderChat`

---

## Part 1: Remove AI Features from Free Profile Editor

### File: `src/components/profile-editor/EditorSidebar.tsx`

**Current state**: Shows 4 tabs (Sections, AI Builder, Brand, Store Style)

**Change**: Show only the "Sections" tab for manual editing

```text
Before:
┌─────────────────┐
│  📦 Sections    │
│  ✨ AI Builder  │ ← Remove
│  🎨 Brand       │ ← Remove  
│  ⚙️ Store Style │ ← Remove
└─────────────────┘

After:
┌─────────────────┐
│  📦 Sections    │
└─────────────────┘
```

- Remove `vibecoder`, `brand`, and `style` from the tabs array
- The sidebar will only show the Sections icon

### File: `src/components/profile-editor/ProfileEditorDialog.tsx`

**Changes**:
- Remove imports: `VibecoderChat`, `BrandProfilePanel`, `AssetDraftTray`, `useGeneratedAssets`
- Remove state: `showAssetTray`, and vibecoder-related state
- Remove the tab content rendering for `vibecoder`, `brand`, and `style` tabs
- Keep only the sections list UI

---

## Part 2: Fix Canvas Text Leak in AI Builder

### File: `src/components/ai-builder/AIBuilderPreview.tsx`

**Problem**: The canvas displays the user's typed message as massive text because something is leaking content across components.

**Root cause analysis**: The `EmptyCanvasState` or the renderer may be picking up content from somewhere unexpected.

**Fix**:
- Ensure `EmptyCanvasState` only shows a minimal decorative placeholder with NO text that could be confused with user input
- Add defensive `overflow-hidden` and `contain` CSS properties to fully isolate the preview

### File: `src/components/ai-builder/AIBuilderCanvas.tsx`

- Add additional CSS isolation (`contain: strict`) to the preview panel
- Ensure no shared state can cause text bleed

---

## Part 3: Migrate Features from VibecoderChat to AIBuilderChat

### Features to migrate:

| Feature | Source | Target |
|---------|--------|--------|
| + Dropdown Menu | `VibecoderChat.tsx` | `AIBuilderChat.tsx` |
| Like/Dislike buttons | `VibecoderMessage.tsx` | New message component |
| Undo per-message | `VibecoderMessage.tsx` | Enhance existing |
| Copy button | `VibecoderMessage.tsx` | Add to messages |
| Latency/Credits metadata | `VibecoderMessage.tsx` | Add to messages |
| "Load older messages" | `VibecoderChat.tsx` | Already exists, enhance |
| Plan button | Already exists | Keep |
| Mic button | Already exists | Keep |

### New file: `src/components/ai-builder/AIBuilderMessage.tsx`

Create a proper message component with:
- User/Assistant styling
- Like/Dislike feedback buttons
- Undo button for applied changes
- Copy button
- More menu with latency/credits metadata
- Operation badges showing what changed

### File: `src/components/ai-builder/AIBuilderChat.tsx`

**Enhance the + button dropdown**:
```text
┌────────────────────┐
│ 📜 History         │
│ 📚 Knowledge       │
│ 🔗 Connectors      │
├────────────────────┤
│ 📷 Take screenshot │
│ 📎 Attach          │
└────────────────────┘
```

**Enhance message rendering**:
- Replace inline message divs with `AIBuilderMessage` component
- Add feedback state management
- Add copy functionality

**Add types for chat messages**:
- Create proper interface matching `VibecoderMessage` capabilities
- Track operations, status, feedback, latency, credits

---

## Technical Details

### Type definitions to add (`AIBuilderChat.tsx` or new types file):

```typescript
interface AIBuilderChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  operations?: any[];
  status?: 'pending' | 'applied' | 'discarded';
  feedback?: 'liked' | 'disliked' | null;
  latencyMs?: number;
  creditsUsed?: number;
}
```

### Database feedback persistence:
- Update `storefront_ai_conversations` table with feedback column (already has operations column that can store feedback JSON)

### CSS isolation for preview:
```css
.preview-container {
  isolation: isolate;
  contain: strict;
  overflow: hidden;
}
```

---

## Files to Create

1. `src/components/ai-builder/AIBuilderMessage.tsx` - Message component with feedback toolbar

## Files to Modify

1. `src/components/profile-editor/EditorSidebar.tsx` - Remove AI/Brand/Style tabs
2. `src/components/profile-editor/ProfileEditorDialog.tsx` - Remove AI features and imports
3. `src/components/ai-builder/AIBuilderChat.tsx` - Add + dropdown, use new message component
4. `src/components/ai-builder/AIBuilderPreview.tsx` - Fix text leak with isolation
5. `src/components/ai-builder/AIBuilderCanvas.tsx` - Add CSS containment

---

## Summary

| Task | Complexity |
|------|------------|
| Remove AI from free editor | Low |
| Fix canvas text leak | Low |
| Create AIBuilderMessage component | Medium |
| Migrate + dropdown menu | Low |
| Add feedback persistence | Low |

**Total estimated changes**: ~5 files modified, ~1 file created

