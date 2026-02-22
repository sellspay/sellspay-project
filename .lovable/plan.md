

# Bulletproof Fix: CORS + JSON-in-Code + Navigation + Missing Break

This plan addresses the 4 tangled failures you identified, plus a critical bug I found during exploration.

---

## Bug Summary

| # | Issue | Root Cause | File |
|---|-------|-----------|------|
| 1 | OPTIONS preflight returning `"ok"` body | Some proxies reject non-empty preflight bodies | `vibecoder-v2/index.ts` |
| 2 | JSON `{ files: ... }` written into `/App.tsx` | `code_chunk` fallback doesn't detect JSON wrapper; also **missing `break`** in `case 'files'` causes fall-through | `useStreamingCode.ts` |
| 3 | Sandboxed iframe navigation crash | `window.open()` still blocked in some sandbox configs; needs `postMessage` bridge | `VibecoderPreview.tsx`, `vibecoder-v2/index.ts` |
| 4 | `StreamingPhaseCard` ref warning | Already fixed with `forwardRef` (confirmed in current code) | N/A |

---

## Fix 1: OPTIONS preflight (vibecoder-v2/index.ts)

Change the OPTIONS handler from returning `"ok"` with `status: 200` to returning `null` body with `status: 204`:

```text
Before: return new Response("ok", { status: 200, headers: corsHeaders });
After:  return new Response(null, { status: 204, headers: corsHeaders });
```

This prevents proxy/CDN layers from rejecting preflight responses with unexpected bodies.

---

## Fix 2: Missing `break` + JSON-in-code_chunk defense (useStreamingCode.ts)

**Critical bug found**: The `case 'files':` handler (line 848) has no `break` statement, causing it to fall through into `case 'code_progress'`. This means after receiving files, execution continues into the next case block.

Changes:
- Add `break;` after line 860 (`receivedFiles = true;`)
- In `case 'code_chunk'`: add JSON wrapper detection -- if the accumulated buffer starts with `{` and contains `"files"`, attempt to parse it as a project files map and route to `state.files` instead of `state.code`

---

## Fix 3: postMessage navigation bridge

Instead of `window.open()` (which can also be blocked in sandboxed iframes), use a `postMessage` bridge:

**Backend (vibecoder-v2 prompt)**: Change product linking instructions to use:
```ts
window.parent?.postMessage({ type: 'VIBECODER_NAVIGATE', url }, '*');
```

**Frontend sanitizer (useStreamingCode.ts)**: Update `sanitizeNavigation` to also rewrite `window.open(...)` calls to `postMessage`.

**Parent listener (VibecoderPreview.tsx)**: Add a `useEffect` in the `VibecoderPreview` component (the outermost wrapper, lines 550-627) that listens for `VIBECODER_NAVIGATE` messages and calls `window.open(url, '_blank')` from the parent frame.

**Published storefront (AIStorefrontRenderer.tsx)**: Same listener added for the published storefront viewer.

---

## Fix 4: StreamingPhaseCard ref warning

Already resolved -- current code uses `forwardRef`. No changes needed.

---

## Technical Changes

### File: `supabase/functions/vibecoder-v2/index.ts`

1. Line 1449: Change OPTIONS response to `new Response(null, { status: 204, headers: corsHeaders })`
2. Lines ~947-968: Change product linking prompt from `window.open()` to `window.parent?.postMessage({ type: 'VIBECODER_NAVIGATE', url }, '*')`

### File: `src/components/ai-builder/useStreamingCode.ts`

1. Line 861: Add missing `break;` after `case 'files'` block
2. Lines 867-881: Add JSON-wrapper detection in `case 'code_chunk'` -- parse `{ "files": {...} }` and route to `state.files`
3. Lines 547-557: Update `sanitizeNavigation` to rewrite `window.open()` and `window.location.href` to `postMessage`

### File: `src/components/ai-builder/VibecoderPreview.tsx`

1. Lines 572-604 area: Add `useEffect` with `window.addEventListener('message', ...)` to handle `VIBECODER_NAVIGATE` messages, calling `window.open(url, '_blank')` from the parent

### File: `src/components/profile/AIStorefrontRenderer.tsx`

1. Add same `useEffect` message listener for published storefronts

### Deployment

- `vibecoder-v2` edge function will be redeployed automatically

