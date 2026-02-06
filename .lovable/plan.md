
# Race Condition Fix: Strict Project ID Locking

## ✅ IMPLEMENTED

This fix prevents AI generations from leaking across projects when users switch mid-generation.

## Problem Analysis

The race condition occurred because:

1. **User starts "New Project"** → AI begins generating code in the background
2. **User switches to "Old Project"** before generation completes
3. **AI finishes** and writes the result to the current canvas state
4. The canvas blindly applied the new code to whatever project was currently active, **overwriting the old project**

## Solution: Strict ID Locking

Implemented a **generation lock** that captures the project ID when generation starts and verifies it before any writes.

### Implementation Details

#### 1. `generationLockRef` in `AIBuilderCanvas.tsx`
- Ref that stores the project ID when a generation starts
- Set immediately in `handleSendMessage()` BEFORE starting the agent
- Checked in all completion callbacks before writes
- Cleared after successful writes or on error

#### 2. `shouldAbort` callback in `useStreamingCode.ts`
- New option that checks if the generation should be discarded
- Called just before `onComplete` fires
- Returns `true` if project ID mismatch detected

#### 3. `forProjectId` parameter in `addMessage()` (useVibecoderProjects.ts)
- Optional explicit project ID to prevent writes to wrong project
- Only updates local state if target matches currently active project

#### 4. Project ID tracking in `useAgentLoop.ts`
- Added `lockedProjectId` to agent state
- `startAgent()` now accepts projectId parameter
- `onStreamingComplete()` checks lock before proceeding

#### 5. Abort on project switch in `verifyAndLoadProject` effect
- If user switches projects while generation is running, the stream is cancelled
- Generation lock is cleared

### Edge Cases Handled

1. ✅ User switches projects mid-generation → Generation aborted, no data written
2. ✅ User deletes the generating project → Lock becomes orphaned, writes blocked
3. ✅ User creates new project while old is generating → Old generation aborted
4. ✅ User refreshes mid-generation → Lock is lost, generation result discarded
5. ✅ Complete generation without switching → Works normally
