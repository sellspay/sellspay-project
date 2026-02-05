
# Premium AI Builder: Lovable-Style Blank Canvas Architecture

## Executive Summary

This plan implements a complete separation between the **Free Profile Editor** (unchanged) and a new **Premium AI Builder** - a standalone, blank-canvas storefront creation experience that mimics Lovable's approach: chat, plan, render, iterate.

---

## Current State Analysis

**What exists today:**
- Single `profile_sections` table storing all sections for a profile
- `ProfileEditorDialog` with tabs: Sections (manual), AI Builder (Vibecoder), Brand, Store Style
- AI Builder modifies the same `profile_sections` data as manual editing
- No layout separation between free and premium modes
- AI operates as an "assistant" rather than the sole author

**Core problem:** The AI is editing an existing structure rather than authoring from zero. This caps the perceived intelligence.

---

## Architecture: Two Separate Builders

```text
┌─────────────────────────────────────────────────────────────────┐
│                         USER PROFILE                            │
├─────────────────────────┬───────────────────────────────────────┤
│   FREE BUILDER          │        PREMIUM AI BUILDER             │
│   (Current System)      │        (New System)                   │
├─────────────────────────┼───────────────────────────────────────┤
│ • Manual section grid   │ • Blank canvas                        │
│ • Drag-and-drop         │ • Conversational interface            │
│ • Instagram-style       │ • AI authors everything               │
│ • profile_sections      │ • ai_storefront_layouts               │
│                         │ • Premium subscription gate           │
└─────────────────────────┴───────────────────────────────────────┘
```

---

## Database Changes

### New Table: `ai_storefront_layouts`

Stores the AI-generated layout separately from the free profile.

```sql
CREATE TABLE public.ai_storefront_layouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  layout_json JSONB NOT NULL DEFAULT '{"sections": [], "theme": {}, "header": {}}',
  is_published BOOLEAN NOT NULL DEFAULT false,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(profile_id)
);

-- Enable RLS
ALTER TABLE public.ai_storefront_layouts ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can manage their own AI layouts"
  ON public.ai_storefront_layouts
  FOR ALL
  TO authenticated
  USING (
    profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  )
  WITH CHECK (
    profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

-- Public read for published layouts
CREATE POLICY "Anyone can view published AI layouts"
  ON public.ai_storefront_layouts
  FOR SELECT
  TO anon, authenticated
  USING (is_published = true);
```

### New Column on `profiles`: `active_storefront_mode`

```sql
ALTER TABLE public.profiles 
ADD COLUMN active_storefront_mode TEXT NOT NULL DEFAULT 'free' 
CHECK (active_storefront_mode IN ('free', 'ai'));
```

This determines which layout is shown publicly on the `/@username` profile page.

---

## Frontend Changes

### 1. New Route: `/ai-builder`

A dedicated fullscreen page for the Premium AI Builder. Not a tab inside the existing dialog.

```text
/ai-builder
├── Premium gate (subscription check)
├── Blank canvas view
├── Centered chat interface
├── Live preview panel
└── Exit button (back to profile)
```

### 2. Entry Points

**From Profile Page:**
- New button: "Create with AI" (prominent, gradient CTA)
- Only visible to profile owner with premium subscription
- Opens `/ai-builder` in fullscreen

**Toggle in Settings:**
- "Active Storefront" dropdown: Free | AI Builder
- Allows switching which layout is public

### 3. AI Builder Page Structure

```text
┌──────────────────────────────────────────────────────────────────┐
│  [SellsPay Logo]                              [Exit] [Publish]   │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│                     ┌─────────────────────┐                      │
│                     │                     │                      │
│                     │   LIVE PREVIEW      │                      │
│                     │   (iframe or        │                      │
│                     │    rendered view)   │                      │
│                     │                     │                      │
│                     └─────────────────────┘                      │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │ + │ Describe your vision...                    [Plan][Mic]│   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                  │
│            [Build My Store]  [Premium] [Modern] [Minimal]        │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 4. Component Files to Create

| File | Purpose |
|------|---------|
| `src/pages/AIBuilder.tsx` | Main fullscreen page |
| `src/components/ai-builder/AIBuilderCanvas.tsx` | Blank canvas with live preview |
| `src/components/ai-builder/AIBuilderChat.tsx` | Chat interface (extracted/upgraded from VibecoderChat) |
| `src/components/ai-builder/AIBuilderPreview.tsx` | Real-time preview renderer |
| `src/components/ai-builder/PremiumGate.tsx` | Subscription check wrapper |

### 5. Premium Gate Logic

```typescript
// Check if user has premium subscription
const isPremium = profile?.subscription_tier && 
  ['pro', 'enterprise'].includes(profile.subscription_tier);

if (!isPremium) {
  return <PremiumUpgradePrompt />;
}
```

---

## AI Pipeline Enhancements

### Blank Canvas Intelligence

When the canvas is empty, the AI must:
1. **Choose structure** - Hero, sections, CTA flow
2. **Choose hierarchy** - Visual weight distribution
3. **Choose copy** - Compelling headlines and descriptions
4. **Choose styling** - Cohesive theme without asking

### Pattern Library

The AI will internally map user prompts to known patterns:

| Prompt Intent | Layout Pattern |
|---------------|----------------|
| "fitness creator" | Hero + Feature grid + Testimonials + CTA |
| "premium brand" | Full-bleed hero + Minimal sections + Dark theme |
| "product showcase" | Bento grid + Featured products + Social proof |
| "portfolio" | Gallery + About + Contact |

### Updated Backend Behavior

In `storefront-vibecoder/index.ts`:

1. Add new mode parameter: `mode: 'free_editor' | 'ai_builder'`
2. When mode is `ai_builder`:
   - Operate on `ai_storefront_layouts` table instead of `profile_sections`
   - Default to "complete authoring" behavior
   - Include layout patterns in planner context
   - Store/retrieve from the `layout_json` JSONB column

---

## Data Flow

### Creating with AI Builder

```text
User Prompt: "Build me a premium creator store"
        ↓
Intent Extractor → { goal: "full premium storefront", intensity: "complete_overhaul" }
        ↓
Planner → { layout_plan: [...], theme_plan: {...}, copy_plan: {...} }
        ↓
Ops Generator → JSON layout (not patch ops, full layout)
        ↓
Save to ai_storefront_layouts.layout_json
        ↓
Render in preview
```

### Publishing

When user clicks "Publish":
1. Validate the AI layout is complete
2. Set `ai_storefront_layouts.is_published = true`
3. Set `profiles.active_storefront_mode = 'ai'`
4. Public profile now renders from AI layout

### Switching Back to Free

In Settings:
1. Set `profiles.active_storefront_mode = 'free'`
2. Public profile renders from `profile_sections` again
3. AI layout is preserved for later

---

## UI/UX Specifications

### Empty State (First Visit)

```text
┌─────────────────────────────────────────────┐
│                                             │
│         [SellsPay Logo - Large]             │
│                                             │
│      ╔══════════════════════════════╗       │
│      ║  AI-Powered Store Builder    ║       │
│      ╚══════════════════════════════╝       │
│                                             │
│   Describe your vision and watch it         │
│   come to life. Create stunning             │
│   storefronts with a single prompt.         │
│                                             │
│        ┌─────────────────────┐              │
│        │  ✨ Build My Store  │              │
│        └─────────────────────┘              │
│                                             │
│   [Premium] [Modern] [Minimal] [Bold]       │
│                                             │
└─────────────────────────────────────────────┘
```

### Active Chat State

- Messages appear in a vertical timeline
- AI responses include "Applying changes..." loader
- Preview updates in real-time on the right
- Undo button appears after changes apply
- Quick action chips below the input

### Chat Input Bar

```text
┌─────────────────────────────────────────────────────────────┐
│ [+] │ Describe your vision...                 [Plan] [Mic] [→]│
└─────────────────────────────────────────────────────────────┘
```

- **+**: Attachment menu (History, Knowledge, Connectors, Screenshot, Attach)
- **Plan**: Toggle plan mode (shows AI's thinking)
- **Mic**: Voice input (future)
- **→ / ■**: Send or Stop (square when AI is working)

---

## Technical Implementation Order

### Phase 1: Database & Backend (Day 1)
1. Create `ai_storefront_layouts` table with RLS
2. Add `active_storefront_mode` column to profiles
3. Update `storefront-vibecoder` edge function to support new mode
4. Create new layout storage/retrieval functions

### Phase 2: Frontend Structure (Day 2)
1. Create `/ai-builder` route and page component
2. Implement `PremiumGate` wrapper
3. Build `AIBuilderCanvas` with split view (chat + preview)
4. Extract and upgrade chat component for AI Builder

### Phase 3: Preview System (Day 3)
1. Create `AIBuilderPreview` component
2. Implement real-time layout rendering from JSON
3. Add smooth transitions for layout changes
4. Connect to the new `ai_storefront_layouts` table

### Phase 4: Publishing & Mode Toggle (Day 4)
1. Implement publish flow for AI layouts
2. Add "Active Storefront" toggle in Settings
3. Update public profile page to render correct mode
4. Handle edge cases (unpublished AI, empty states)

### Phase 5: Polish & Premium UX (Day 5)
1. Add pattern library to AI context
2. Implement "Build My Store" full generation flow
3. Add animations and loading states
4. Test premium gate and subscription checks

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/App.tsx` | Add `/ai-builder` route |
| `src/pages/Profile.tsx` | Add "Create with AI" button, conditional rendering |
| `src/pages/Settings.tsx` | Add "Active Storefront" toggle |
| `supabase/functions/storefront-vibecoder/index.ts` | Add mode parameter, layout table support |

## Files to Create

| File | Purpose |
|------|---------|
| `src/pages/AIBuilder.tsx` | Main AI Builder page |
| `src/components/ai-builder/AIBuilderCanvas.tsx` | Canvas with chat + preview |
| `src/components/ai-builder/AIBuilderChat.tsx` | Upgraded chat component |
| `src/components/ai-builder/AIBuilderPreview.tsx` | Live preview renderer |
| `src/components/ai-builder/PremiumGate.tsx` | Subscription check |
| `src/components/ai-builder/PatternSelector.tsx` | Quick start patterns (optional) |

---

## Key Differences from Current System

| Aspect | Current (Free) | New (AI Builder) |
|--------|----------------|------------------|
| Entry point | ProfileEditorDialog tab | Fullscreen `/ai-builder` page |
| Data storage | `profile_sections` table | `ai_storefront_layouts` table |
| Canvas state | Pre-populated with existing sections | Blank - AI authors everything |
| AI behavior | Patches existing layout | Authors complete layouts |
| Presets/Templates | Visible in UI | Hidden - AI chooses internally |
| User mental model | "Editing my profile" | "Building a website" |

---

## Success Criteria

1. **Complete separation**: Free builder unchanged, AI builder is new experience
2. **Blank canvas**: AI Builder starts empty, not with existing content
3. **Premium only**: Subscription gate prevents free users from accessing
4. **Mode toggle**: Users can switch which layout is public
5. **Lovable feel**: Chat, plan, render, iterate workflow feels intelligent
