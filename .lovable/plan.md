
# Thumbnail Capture Pipeline + Doorway UX Upgrade

## Overview

Two changes: (1) capture real screenshots from the Sandpack preview so project cards show actual UI instead of the generic "WELCOME TO MY STORE" placeholder, and (2) upgrade the doorway (LovableHero) layout to include a persistent sidebar and tabbed project shelf for a more premium feel.

## Current State

- `vibecoder_projects` table already has a `thumbnail_url` column (confirmed in types.ts and useVibecoderProjects.ts)
- `LovableHero.tsx` already renders thumbnails when `thumbnail_url` is present (line 335), but falls back to a static placeholder (lines 342-361) that looks identical for every project
- No capture pipeline exists -- `thumbnail_url` is never populated
- The doorway is a single centered column layout (prompt + suggestion chips + horizontal scroll of recent projects)
- `VibecoderPreview` has an `onReady` callback that fires when Sandpack finishes rendering
- The Sandpack iframe is cross-origin (codesandbox.io), so direct DOM access from the parent is impossible

## Part 1: Thumbnail Capture Pipeline

### Approach

Since the Sandpack iframe is cross-origin, we cannot use `html2canvas` from the parent. Instead, we inject a small capture script into the Sandpack file map that runs inside the iframe and sends the screenshot back via `postMessage`.

### A) Inject capture helper into Sandpack files

**File:** `src/components/ai-builder/VibecoderPreview.tsx`

Add a new hidden file to the Sandpack file map (`/utils/capture.ts`) that:
- Listens for a `postMessage` from the parent requesting a capture
- Finds the hero element (`[data-hero="true"]`) or falls back to the top 900px of `document.body`
- Uses the Canvas API to draw the visible viewport to a canvas
- Converts to a JPEG blob via `canvas.toBlob()`
- Sends the blob back to the parent via `postMessage` (transferring the ArrayBuffer)

The script is lightweight (~40 lines) and only activates when it receives the capture message, so it has zero impact on normal preview performance.

Import the capture script from `/index.tsx` so it runs automatically.

### B) Parent-side capture orchestration

**File:** `src/components/ai-builder/hooks/useThumbnailCapture.ts` (new)

A custom hook that:
1. Listens for `message` events from the Sandpack iframe containing screenshot data
2. When received, creates a Blob from the ArrayBuffer
3. Uploads to the `site-assets` storage bucket (already exists and is public) at path `project-thumbs/{projectId}/hero.jpg`
4. Updates `vibecoder_projects.thumbnail_url` with the public URL
5. Updates local state so the doorway cards refresh immediately

### C) Trigger capture at the right moments

**File:** `src/components/ai-builder/AIBuilderCanvas.tsx`

Call the capture function:
- When `onReady` fires after a successful generation (streaming completes + preview renders)
- Debounced by 2 seconds to ensure the preview has stabilized
- Only when `!isStreaming` and the project has real code (not the default scaffold)

The flow:
```text
Generation completes
  -> onReady fires from Sandpack
  -> 2s debounce
  -> Parent sends "capture" postMessage to iframe
  -> Iframe captures viewport, sends ArrayBuffer back
  -> Parent uploads to storage
  -> Updates thumbnail_url in DB
  -> Local project state updates
  -> Doorway cards show real screenshot
```

### D) Fallback for projects without screenshots

**File:** `src/components/ai-builder/LovableHero.tsx`

Replace the current static "WELCOME TO MY STORE" placeholder with a unique gradient seeded by `projectId`. This ensures that even before capture runs, no two project cards look identical.

Use a simple hash of the project ID to pick from a set of 6-8 gradient combinations (e.g., orange-to-purple, blue-to-teal, rose-to-amber).

### E) System prompt convention

**File:** `supabase/functions/vibecoder-v2/index.ts`

Add to the CODE_EXECUTOR_PROMPT: "The hero section element MUST include the attribute `data-hero=\"true\"` on its outermost wrapper div."

This makes capture targeting reliable.

## Part 2: Doorway UX Upgrade

### A) New sidebar component for the doorway

**File:** `src/components/ai-builder/DoorwaySidebar.tsx` (new)

A persistent left sidebar (~260px) visible only on the doorway screen. Contains:
- **Top section:** App logo/wordmark
- **Navigation:**
  - Home (active by default)
  - My Projects (navigates to filtered view)
  - Templates (future -- shows as "Coming soon" badge)
- **Project list:** Last 5 projects as compact items with folder icon + name + relative time
- **Bottom:** Credit balance display + "New Project" button
- Collapsible on mobile (hamburger trigger)

### B) Tabbed project shelf

**File:** `src/components/ai-builder/ProjectShelf.tsx` (new)

A bottom shelf component replacing the current inline `recentProjects` section in LovableHero. Features:
- **Tabs:** "Recent" | "My Projects" | "Starred" (starred is future, greyed out)
- **Card grid:** Horizontal scroll with snap behavior, 4-5 cards visible on desktop
- Each card shows:
  - Thumbnail image (real screenshot or seeded gradient fallback)
  - Project name (truncated)
  - Relative timestamp ("2 hours ago")
  - Published badge (if published)
- "Browse all" link on the right (scrolls to show more or opens sidebar projects view)

### C) Refactor LovableHero layout

**File:** `src/components/ai-builder/LovableHero.tsx`

Restructure from single centered column to a sidebar + main layout:

```text
+------------------+----------------------------------------+
|                  |                                        |
|  DoorwaySidebar  |   Hero prompt area (centered)          |
|                  |   - Pill badge                         |
|  - Logo          |   - Headline                           |
|  - Nav items     |   - Input bar                          |
|  - Recent list   |   - Suggestion chips                   |
|  - Credits       |                                        |
|                  |   ProjectShelf (bottom)                |
|                  |   - Tabs + scrollable cards            |
+------------------+----------------------------------------+
```

- The background image and overlay remain on the main area only
- Sidebar has a solid dark background (zinc-950) with subtle right border
- On mobile (< 768px), sidebar collapses to a hamburger menu

### D) Visual polish

- Cards: `rounded-2xl` with `hover:scale-[1.02]` and `hover:shadow-lg`
- Shelf area: slightly darker base (`bg-black/40 backdrop-blur-sm`) for grouping contrast
- Typography: reduce headline size slightly to `text-3xl md:text-4xl` to make room for shelf
- Prompt input: add subtle `backdrop-blur-xl` for glass effect (already partially there)
- Project cards: add a subtle gradient overlay at the bottom for text readability over thumbnails

## Implementation Order

1. Inject capture script into Sandpack file map (VibecoderPreview.tsx)
2. Create `useThumbnailCapture` hook
3. Wire capture trigger in AIBuilderCanvas.tsx (onReady + debounce)
4. Replace static placeholder with seeded gradient fallback (LovableHero.tsx)
5. Add `data-hero="true"` convention to system prompt
6. Create `DoorwaySidebar.tsx` component
7. Create `ProjectShelf.tsx` component
8. Refactor `LovableHero.tsx` to use new sidebar + shelf layout
9. Test end-to-end: generate a project, verify thumbnail appears on doorway

## Technical Notes

- No new storage bucket needed -- `site-assets` is already public and suitable for thumbnails
- No database migration needed -- `thumbnail_url` column already exists on `vibecoder_projects`
- The capture script inside Sandpack uses the native Canvas API (no external library needed) -- it renders the iframe's own viewport via `document.documentElement` scroll capture
- `postMessage` with `ArrayBuffer` transfer is efficient and avoids base64 overhead
- The capture JPEG quality is set to 0.7 for a good size/quality tradeoff (~30-80KB per thumbnail)
- Mobile doorway: sidebar becomes a slide-out drawer, shelf stacks vertically with 2-column grid
