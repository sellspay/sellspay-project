
# Fresh Boot Experience: Chat-to-Create Transformation

## Overview

Transform the AI Builder from a "button-first" onboarding flow into a seamless "prompt-first" experience where the user's intent (typing and sending a message) is the sole trigger for project creation.

## Current vs. Target State

```text
Current Flow:
+---------------------+       +---------------------+       +---------------------+
|   Empty Canvas      |  -->  | Click "Start new    |  -->  |  Project Created,   |
|   (no chat visible) |       |  project" button    |       |  now can use chat   |
+---------------------+       +---------------------+       +---------------------+

Target Flow:
+---------------------+       +---------------------+
|   Empty Canvas      |  -->  |  User types prompt, |
|   WITH chat input   |       |  project auto-creates,
|   always visible    |       |  generation starts   |
+---------------------+       +---------------------+
```

## Implementation Plan

### Step 1: Redesign EmptyCanvasState Component

Upgrade the empty state to a premium, professional "zero state" that feels aspirational:

**Changes:**
- Remove the "Start a new project" button entirely
- Add a floating call-to-action that directs users to the chat input (e.g., "Just type your idea in the chat to begin")
- Upgrade visual treatment with a dark gradient background and inspiration cards (Portfolio, Store, SaaS Landing, etc.)
- Cards are non-interactive visual cues, not buttons

**Visual Hierarchy:**
```text
+-----------------------------------------------+
|                                               |
|           [Sparkles Icon with Glow]           |
|                                               |
|    "What do you want to build today?"         |
|    I'm your AI engineering team...            |
|                                               |
|   [Portfolio] [Store] [SaaS] [Dashboard]      |
|                                               |
|   --> Just type your idea in the chat         |
|                                               |
+-----------------------------------------------+
```

### Step 2: Always-Visible Chat Input

The chat panel must remain visible even when `hasActiveProject` is `false`.

**Current AIBuilderCanvas structure (lines 705-790):**
```text
{!hasActiveProject ? (
  <EmptyCanvasState />      // NO CHAT!
) : (
  <PreviewPanel + ChatPanel>
)}
```

**New structure:**
```text
<div className="flex-1 flex">
  {/* LEFT: Empty State OR Live Preview */}
  {!hasActiveProject ? (
    <EmptyCanvasState />
  ) : (
    <LivePreviewPanel />
  )}

  {/* RIGHT: Chat Panel - ALWAYS VISIBLE */}
  <ChatPanel onSendMessage={handleSendMessage} />
</div>
```

This ensures the user can type immediately on page load.

### Step 3: Modify handleSendMessage for Genesis Prompt

The `handleSendMessage` function already calls `ensureProject()`, but we want clearer UX feedback:

```text
handleSendMessage(prompt):
  1. If no active project:
     - Show "Creating your workspace..." log in chat
     - Call ensureProject() to silently create DB record
     - Update URL to include project ID
  2. Add user message to history
  3. Start agent loop (code generation begins)
```

The existing code already handles this via `ensureProject()` (line 425), but we'll add visual polish.

### Step 4: Project Naming from First Prompt

Currently, projects get a generic name "New Storefront" on explicit creation. With chat-to-create, we should derive a smarter name from the first prompt:

```text
// In handleSendMessage:
const projectName = generateProjectName(prompt);
// e.g., "Premium Store" from "A luxury dark mode storefront..."

const projectId = await ensureProject(projectName);
```

This requires a minor enhancement to `ensureProject()` or `createProject()` to accept an optional name parameter.

---

## Technical Changes Summary

### File 1: src/components/ai-builder/EmptyCanvasState.tsx

| Change | Details |
|--------|---------|
| Remove "Start a new project" button | Users trigger creation via chat, not button click |
| Add inspiration cards | Non-clickable visual cues for Portfolio, Store, SaaS, Dashboard, Blog |
| Add CTA directing to chat | "Just type your idea in the chat to begin" with arrow pointing right |
| Upgrade visuals | Dark gradient background, glowing icon, premium typography |

### File 2: src/components/ai-builder/AIBuilderCanvas.tsx

| Change | Details |
|--------|---------|
| Restructure layout | Chat panel always rendered, empty state only replaces preview area |
| Update handleSendMessage | Add visual feedback ("Creating workspace...") before ensureProject() |
| Smart project naming | Extract title from first prompt (first 4-5 words or keyword extraction) |

### File 3: src/components/ai-builder/hooks/useVibecoderProjects.ts

| Change | Details |
|--------|---------|
| Update createProject() | Accept optional `name` parameter with fallback to timestamp-based default |
| Update ensureProject() | Pass optional name to createProject() |

---

## User Experience Flow

1. **User lands on /ai-builder** - Sees the premium empty state on the left, empty chat panel on the right with quick prompt suggestions
2. **User types first prompt** - "A luxury dark mode storefront for selling digital presets"
3. **User hits Enter/Send** - System:
   - Extracts smart name: "Luxury Dark Mode Storefront"
   - Calls `createProject("Luxury Dark Mode Storefront")`
   - Updates URL to `/ai-builder?project=abc123`
   - Adds user message to chat history
   - Starts agent loop (Planning → Writing → Building)
4. **Empty state swaps to live preview** - Sandpack mounts, code streams in real-time
5. **User iterates** - Subsequent prompts refine the design

---

## Technical Notes

- The `hasActiveProject` check determines what shows in the LEFT panel only (Empty State vs. Preview)
- The Chat panel is always mounted, ensuring the input bar is immediately accessible
- The `onCreateProject` callback on EmptyCanvasState can be removed entirely (it was only used by the button)
- The StarterCard components become purely decorative, not interactive
