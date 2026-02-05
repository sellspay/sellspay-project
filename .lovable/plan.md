
# Dual-Boot Storefront Architecture: Complete Implementation Plan

This plan implements a "Dual-Boot" system where users can safely switch between their **Free Profile Builder** (classic Instagram-style layout) and the **Premium AI Vibecoder** (generative React code) without ever losing either version.

---

## Current Architecture Analysis

### What Already Exists

| Component | Current State |
|-----------|--------------|
| **`profiles.active_storefront_mode`** | Exists! Values: `'free'` (default), `'ai'` |
| **`ai_storefront_layouts`** | Stores AI layout JSON + `vibecoder_mode` boolean + `is_published` |
| **`project_files`** | Stores raw Vibecoder TSX code (`/App.tsx`) |
| **`profile_sections`** | Stores Free Builder sections (preserved separately) |
| **Profile Page (`Profile.tsx`)** | Renders the "Free" layout only - needs AI storefront rendering |

### What's Missing

1. **Public Storefront Router**: The `Profile.tsx` page doesn't check `active_storefront_mode` to render AI layouts
2. **Mode Toggle in Settings**: No UI for users to switch between modes after publishing
3. **AI Storefront Public Renderer**: No Sandpack-based renderer for public profile views
4. **Mode Indicator on Profile**: Users can't see which mode is currently active

---

## Implementation Plan

### Phase 1: Public AI Storefront Renderer

Create a new component that renders the Vibecoder code publicly (using Sandpack in read-only mode).

**New File: `src/components/profile/AIStorefrontRenderer.tsx`**

This component will:
- Accept a `profileId` prop
- Fetch the published Vibecoder code from `project_files`
- Render it in an isolated Sandpack iframe (read-only, no editor)
- Handle loading states and errors gracefully
- Use the same Tailwind CDN + dependencies as the builder

```text
┌────────────────────────────────────────────────────────────┐
│                   AIStorefrontRenderer                      │
├────────────────────────────────────────────────────────────┤
│  1. Fetch profile's `project_files` entry for `/App.tsx`   │
│  2. Check `ai_storefront_layouts.is_published` = true      │
│  3. Render in Sandpack (preview-only, no editor)           │
│  4. Fullscreen iframe with pointer-events enabled          │
└────────────────────────────────────────────────────────────┘
```

### Phase 2: Profile Page Router Logic

Modify `Profile.tsx` to check `active_storefront_mode` and render the appropriate layout:

```text
┌─────────────────────────────────────────────────────────────┐
│                    Profile.tsx Router                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   if (profile.active_storefront_mode === 'ai') {            │
│     // Check for published Vibecoder code                    │
│     if (vibecoderCode && aiLayout.is_published) {           │
│       return <AIStorefrontRenderer profileId={profile.id} />│
│     }                                                        │
│   }                                                          │
│                                                              │
│   // Default: Render classic Free Builder layout             │
│   return <PublicProfileSections ... />                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Key Logic:**
1. Fetch `profile.active_storefront_mode` from the profile query
2. If `'ai'`, fetch the `ai_storefront_layouts` and `project_files` for this profile
3. If Vibecoder code exists AND is published, render `AIStorefrontRenderer`
4. Otherwise, fall back to the existing `PublicProfileSections` component

### Phase 3: Mode Toggle in Settings

Add a UI control in the user's profile settings to switch between modes without losing data.

**New Component: `src/components/settings/StorefrontModeToggle.tsx`**

Features:
- Two buttons: "Classic Profile" and "Vibecoder (AI)"
- Visual indicator of which is currently active
- Confirmation dialog when switching modes
- Clear messaging: "Switching modes will NOT delete your designs. Both are saved safely."
- Updates `profiles.active_storefront_mode` on toggle

### Phase 4: Mode Indicator on Profile Header

Add a visual badge to the profile page (for profile owners) showing which mode is currently live.

**Updates to `Profile.tsx`:**
- Show a badge next to the profile name: "🎨 AI Store" or "📦 Classic"
- Only visible to the profile owner
- Clicking opens a dropdown to quickly switch modes

### Phase 5: AI Builder Canvas Updates

Enhance the `AIBuilderCanvas.tsx` to:
1. Save Vibecoder code to `project_files` on every successful generation (already done)
2. Update `ai_storefront_layouts.is_published` when publishing
3. Show "View Live" button that opens the public profile in a new tab
4. Add "Revert to Classic" quick action in the header

---

## Technical Details

### Database Updates Required

**None needed!** The existing schema already supports this:
- `profiles.active_storefront_mode`: `'free'` | `'ai'`
- `ai_storefront_layouts.vibecoder_mode`: `boolean` (differentiates Blocks vs Vibecoder within AI mode)
- `ai_storefront_layouts.is_published`: `boolean` (draft vs live)
- `project_files`: Stores the raw TSX code

### Files to Create

| File | Purpose |
|------|---------|
| `src/components/profile/AIStorefrontRenderer.tsx` | Public Sandpack renderer |
| `src/components/settings/StorefrontModeToggle.tsx` | Mode switcher in settings |

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Profile.tsx` | Add routing logic for AI storefront mode |
| `src/components/ai-builder/AIBuilderCanvas.tsx` | Add "View Live" button, mode indicator |
| `src/pages/Settings.tsx` | Add StorefrontModeToggle component |

### Security Considerations

1. **Sandpack Isolation**: Generated code runs in an isolated iframe origin (csb.app)
2. **No Access to Parent**: Cannot access cookies, localStorage, or DOM of the main app
3. **Read-Only Execution**: Public view is preview-only, no code editing
4. **RLS Protection**: `project_files` and `ai_storefront_layouts` already have RLS policies

### Data Flow Diagram

```text
┌──────────────────────────────────────────────────────────────────────┐
│                         DATA STORAGE                                  │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│   profiles.active_storefront_mode  ───┐                              │
│        ('free' | 'ai')                 │                              │
│                                        ▼                              │
│   ┌────────────────────┐      ┌────────────────────┐                 │
│   │  profile_sections  │      │ ai_storefront_layouts │              │
│   │  (Free Builder)    │      │   + project_files     │              │
│   │                    │      │   (AI/Vibecoder)      │              │
│   └────────────────────┘      └────────────────────┘                 │
│              │                           │                            │
│              ▼                           ▼                            │
│   ┌────────────────────┐      ┌────────────────────┐                 │
│   │ PublicProfileSections │   │ AIStorefrontRenderer │               │
│   │  (React components) │      │    (Sandpack)       │               │
│   └────────────────────┘      └────────────────────┘                 │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Order

1. **Create `AIStorefrontRenderer.tsx`** - The public Sandpack viewer
2. **Update `Profile.tsx`** - Add routing logic based on `active_storefront_mode`
3. **Create `StorefrontModeToggle.tsx`** - Settings page toggle
4. **Update `Settings.tsx`** - Add the toggle component
5. **Update `AIBuilderCanvas.tsx`** - Add View Live button and mode indicator
6. **Polish and test** - Ensure smooth transitions and no data loss

---

## User Experience Flow

### Publishing AI Storefront
1. User creates design in Vibecoder
2. Clicks "Publish" → `active_storefront_mode` set to `'ai'`
3. Profile now shows AI-generated storefront publicly

### Reverting to Classic
1. User goes to Settings → Storefront section
2. Clicks "Classic Profile" button
3. Confirmation: "Your AI storefront will be saved. Switch to classic?"
4. `active_storefront_mode` set to `'free'`
5. Profile now shows classic layout (AI design safely preserved)

### Switching Back to AI
1. User goes to Settings → Storefront section
2. Clicks "Vibecoder (AI)" button
3. Immediate switch - no confirmation needed (data preserved)
4. Profile now shows AI storefront again

---

## Safety Guarantees

| Scenario | What Happens |
|----------|-------------|
| User switches from AI to Classic | AI code preserved in `project_files` |
| User switches from Classic to AI | Profile sections preserved in `profile_sections` |
| User edits AI storefront | Only `project_files` is updated |
| User edits Classic profile | Only `profile_sections` is updated |
| User deletes AI storefront | Option to reset to DEFAULT_CODE, Classic untouched |
| User deletes Classic sections | AI storefront untouched |
