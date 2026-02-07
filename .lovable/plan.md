
## Goal
Fix three critical AI Builder issues without introducing new lockouts:
1) Doorway “first prompt” not appearing in chat when creating a new project.
2) Switching/refreshing projects loads the wrong project (code/chat bleed and refresh mismatch).
3) Repeated Sandpack “Build error: Cannot assign to read only property 'message'…” toast during generations.

---

## What’s actually causing each problem (diagnosis)

### 1) Doorway prompt not showing
In `AIBuilderCanvas.tsx`, `heroOnStart()` currently does:
- `ensureProject(...)` (creates & sets `activeProjectId`, but React state update is async)
- `await addMessage('user', prompt)` **without a project id**
- `navigate(..., { state: { initialPrompt } })`

Because `addMessage()` in `useVibecoderProjects` uses:
```ts
const targetProjectId = forProjectId || activeProjectId;
```
…there’s a real window where `activeProjectId` is still `null`, so the user message insert/optimistic UI never happens.

There’s a second, separate issue: the “auto-start initial prompt” effect is guarded by `hasStartedInitialRef`, which is **never reset**. After you’ve used the doorway once, that ref can prevent future doorway prompts from being optimistically injected/started in the same session.

### 2) Wrong project loads / overlap + refresh mismatch
There are two overlapping causes:

**A) Refresh mismatch**
- `selectProject(projectId)` only updates React state, not the URL query param.
- On refresh, `useVibecoderProjects` initializes `activeProjectId` from `?project=...`.
So if you switched projects but the URL never changed, refreshing re-loads the old project (exactly what you reported: “Both”).

**B) Cross-project code snapshot bleed on switch**
In `AIBuilderCanvas.tsx`, the “scorched earth orchestrator” effect runs on `activeProjectId` change and *immediately* does:
```ts
const lastSnapshot = getLastCodeSnapshotRef.current();
setCode(lastSnapshot);
```
But at that moment, `messages` may still be from the *previous* project (because the message fetch for the new project hasn’t completed yet). That means `getLastCodeSnapshot()` can return the wrong project’s snapshot, and you mount the wrong code.

Even if we “gate” rendering, this still breaks correctness because the wrong code is now in state and can leak into subsequent operations.

### 3) “Cannot assign to read only property 'message' …” build error spam
Your screenshot shows Sandpack reporting this as a build error. This commonly comes from an **error overlay** trying to “decorate”/rewrite an error object (assigning to `.message`) where the underlying error instance (often a SyntaxError) is read-only/frozen in that environment.

You already avoid mutating `sandpack.error` in `ErrorDetector`, which is good, but Sandpack’s own overlay can still do it. The clean fix is to **disable Sandpack’s built-in error overlay** and rely on your existing FixErrorToast + Safe extraction.

---

## Implementation approach (minimal, surgical, correct)

### A) Make doorway prompt always appear (and start reliably)
**File:** `src/components/ai-builder/AIBuilderCanvas.tsx`

1) In `heroOnStart`:
- Either remove the premature `addMessage('user', prompt)` entirely and let the “auto-start initial prompt” effect handle the optimistic insert…
  - OR pass `newProjectId` explicitly: `addMessage('user', prompt, undefined, newProjectId)`

Given your current architecture already has an “auto-start initial prompt” flow that *also* adds a user message (line ~315), the cleanest is:
- **Stop inserting the message inside `heroOnStart`**
- Rely on the auto-start effect to do the optimistic user message + agent start

2) Reset the “auto-start guard” per project:
- Replace `hasStartedInitialRef` (single boolean for the entire session) with a **per-project/per-navigation guard**, e.g.:
  - `startedInitialPromptForProjectRef.current = activeProjectId`
  - or store `{projectId, promptHash}`.
- Reset it when:
  - `activeProjectId` changes, or
  - `location.state?.initialPrompt` changes.

This ensures every new project created from the doorway always injects the first user message and starts the agent.

**Expected result:** The initial prompt bubble always shows immediately (optimistic), every time, for doorway-created projects.

---

### B) Fix “wrong project loads” for switching + refreshing
**Files:**
- `src/components/ai-builder/hooks/useVibecoderProjects.ts`
- `src/components/ai-builder/AIBuilderCanvas.tsx`

#### B1) URL must always reflect the selected project (fix refresh mismatch)
In `useVibecoderProjects.ts`, update `selectProject(projectId)` to:
- set `activeProjectId`
- update the URL query param `?project=...` via `history.replaceState` (consistent with createProject behavior)

This makes refresh deterministic and aligned with what you’re currently viewing.

#### B2) Hard stop: never derive code from `messages` during the “project switch” orchestrator
In `AIBuilderCanvas.tsx` project-switch orchestrator (`useLayoutEffect` on `[activeProjectId]`):
- Remove/avoid this step:
  - “load code from getLastCodeSnapshotRef.current()” during verification
- On project change, do only:
  - `resetCode()` (blank safe template)
  - `setContentProjectId(null)` (gate stays closed)
  - start verification
  - mount agent lock `mountAgentProject(activeProjectId)` (fine)
  - let the **separate restoration effect** (the one that waits for `messagesLoading === false`) restore the correct snapshot once messages are loaded for the new project.

#### B3) Ensure messages cannot remain from previous project for even a moment
In `useVibecoderProjects.ts` message loader effect on `[activeProjectId]`:
- Immediately call `setMessages([])` when `activeProjectId` changes (before starting fetch).
This prevents the restoration effect and UI from seeing old messages while the new fetch is in flight.

#### B4) Set `contentProjectId` only when the correct project’s content is actually ready
Right now `contentProjectId` is set in the orchestrator *before* messages necessarily load (so the gate can open too early). We will change:
- Don’t set `contentProjectId` inside the orchestrator after verification.
- Instead set it in the **restoration effect** after:
  - `messagesLoading` is false
  - and we have either restored a snapshot or confirmed there is none

This makes the gate reflect the true “content mounted” moment.

**Expected result:** Switching projects never shows the wrong code/messages; refresh always lands on the project in the URL.

---

### C) Stop the repeating “read only property 'message'” build error toast
**File:** `src/components/ai-builder/VibecoderPreview.tsx`

Disable Sandpack’s built-in overlay to prevent internal mutation attempts:
- Pass `showSandpackErrorOverlay={false}` to `SandpackPreviewComponent`

You already have:
- `ErrorDetector` to capture errors
- `FixErrorToast` UI
So removing the default overlay is safe and should eliminate this particular class of error.

(If Sandpack also supports `showErrorScreen={false}`, we’ll use that too, but `showSandpackErrorOverlay` is the key one per Sandpack docs/snippets.)

**Expected result:** The specific “Cannot assign to read only property 'message'…” error should stop appearing repeatedly during generations. If there are real build errors from generated code, you’ll still see them via your own toast and can click Fix.

---

## Step-by-step execution order (so we don’t make things worse)
1) **Fix URL sync** on project selection (`useVibecoderProjects.selectProject`).
2) **Clear messages immediately** on `activeProjectId` change (`useVibecoderProjects`).
3) **Stop loading snapshot from stale messages** in the orchestrator (remove that part) and **move `contentProjectId` “ready”** to the restoration effect (`AIBuilderCanvas`).
4) **Fix doorway prompt**:
   - remove `heroOnStart` premature addMessage OR pass explicit `newProjectId`
   - reset the initialPrompt guard per project
5) **Disable Sandpack error overlay** (`VibecoderPreview`).

---

## How we’ll verify (explicit test checklist)
1) Doorway flow:
   - Click “New project” → doorway appears → type prompt
   - Confirm your prompt bubble shows immediately (before AI finishes)
   - Confirm the created project contains that first prompt after refresh
2) Switching projects:
   - Create 2 projects with very different prompts (easy to tell apart)
   - Switch A → B → A repeatedly
   - Confirm code + chat always match the selected project
3) Refresh correctness:
   - Switch to Project B
   - Refresh the page
   - Confirm it still loads Project B (and URL has `?project=B`)
4) Build error spam:
   - Ask “add a shop button”
   - Confirm the “Cannot assign to read only property 'message'…” toast no longer appears
   - If a real syntax error occurs, confirm Fix toast still appears and works

---

## Files we will change
- `src/components/ai-builder/AIBuilderCanvas.tsx`
  - Fix doorway prompt insertion/guard
  - Remove snapshot restore from orchestrator
  - Move `contentProjectId` set to restoration-ready moment
- `src/components/ai-builder/hooks/useVibecoderProjects.ts`
  - Clear messages immediately on project change
  - Update URL on `selectProject`
- `src/components/ai-builder/VibecoderPreview.tsx`
  - Disable Sandpack error overlay (`showSandpackErrorOverlay={false}`)

---

## Notes / edge cases handled
- Sidebar always stays visible during transitions (we keep your “gatekeeper inside content” layout).
- Cancels in-flight generations on switch are preserved (you already do `cancelStream()` + `cancelAgent()`).
- We avoid reintroducing the old “messages dependency infinite loop” by keeping orchestration on `activeProjectId` only; restoration happens in the existing effect that already waits for `messagesLoading`.

