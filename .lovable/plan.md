
# Nuclear Error Silence Protocol

## The Problem
The current noise suppression hook (`useSuppressPreviewNoise`) only patches the outer window's console and error handlers, but **Sandpack renders inside an iframe** with its own JavaScript context. Errors from the AI-generated code crash inside that iframe, trigger react-error-overlay, and spam the iframe's console—none of which is caught by the parent window patches.

Additionally, the `ErrorDetector` component inside Sandpack is watching `sandpack.error` and sometimes mutates or reads frozen Error objects, causing secondary crashes.

## Architecture Overview

```text
┌────────────────────────────────────────────────────────────────────┐
│  PARENT WINDOW (Lovable App)                                       │
│  • useSuppressPreviewNoise → patches console.error/warn            │
│  • CSS hides .sp-error-overlay, #react-error-overlay               │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  IFRAME (Sandpack Preview)                                   │  │
│  │  • Has its OWN window + console + error overlay              │  │
│  │  • react-error-overlay runs INSIDE this iframe               │  │
│  │  • Errors here spam the IFRAME'S console, not parent's       │  │
│  │  • Currently: NO suppression active inside iframe            │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────┘
```

## Solution: Multi-Layer "Nuclear Silence" Shield

### Layer 1: Inject CSS Into Sandpack Iframe
Sandpack allows injecting custom CSS via a special file. We'll add styles that hide react-error-overlay and any crash banners inside the iframe itself.

### Layer 2: Inject Runtime Silencer Script
Sandpack supports custom entry files. We'll inject a tiny script that patches the iframe's `console.error` and `window.onerror` before React even boots.

### Layer 3: Disable React Error Overlay at Compile Time
Sandpack can be configured to disable the default react-error-overlay entirely using `showSandpackErrorOverlay={false}` (already set) AND by not including the error overlay dependency.

### Layer 4: Strengthen Parent Window Suppression
Expand the regex patterns in `useSuppressPreviewNoise` to catch additional noisy patterns like `MutationRecord`, `attributeName`, `SyntaxError`, and any Sandpack bundler spam.

### Layer 5: CSS "!important" Nuclear Strike on All Error UI
Expand the existing CSS block to target every known Sandpack/React error class, including iframe-injected overlays and the `.sp-error-message` banner.

---

## Technical Changes

### 1. Expand Noise Suppression Patterns
**File:** `src/components/ai-builder/hooks/useSuppressPreviewNoise.ts`

Add additional regex patterns to silence:
- `MutationRecord` / `attributeName` (the specific error in your console)
- `SyntaxError` patterns from bundler
- `Cannot read properties of undefined`
- Sandpack bundler noise (`/sandbox\.`, `/static\/js\/`)

### 2. Inject Silence Script Into Sandpack Files
**File:** `src/components/ai-builder/VibecoderPreview.tsx`

Add a hidden file to the Sandpack `files` object that:
- Patches `window.onerror` and `window.onunhandledrejection` inside the iframe
- Patches `console.error` and `console.warn` inside the iframe
- Removes any DOM elements that look like error overlays every 500ms (mutation observer fallback)

### 3. Inject "Nuclear CSS" Into Iframe
**File:** `src/components/ai-builder/VibecoderPreview.tsx`

Add a hidden CSS file that hides:
- `#react-error-overlay`
- `.error-overlay`
- `[data-react-error-overlay]`
- Any `div` with red background and "Error" text (fallback)

### 4. Safer ErrorDetector Logic
**File:** `src/components/ai-builder/VibecoderPreview.tsx`

Wrap ALL reads of `sandpack.error` in try/catch with read-only guards:
- Never pass the original Error object reference
- Clone the message string immediately
- Add a debounce/throttle to prevent rapid-fire re-reporting

### 5. Strengthen Parent CSS
**File:** `src/components/ai-builder/VibecoderPreview.tsx`

Expand the `SANDPACK_HEIGHT_FIX` CSS to include:
- `.cm-diagnosticMessage` (CodeMirror inline errors)
- `.sp-bridge-frame` error UI
- Any element with `position: fixed` and red color

---

## Files to Modify

| File | Change Summary |
|------|----------------|
| `src/components/ai-builder/hooks/useSuppressPreviewNoise.ts` | Add more regex patterns for MutationRecord, SyntaxError, bundler noise |
| `src/components/ai-builder/VibecoderPreview.tsx` | Inject silencer script + CSS into Sandpack files, strengthen parent CSS, safer ErrorDetector |
| `src/lib/vibecoder-stdlib.ts` | Add iframe-silence.js and iframe-silence.css entries |

---

## Expected Outcome
1. **No overlay ever** - the red/white error screen will never appear, inside or outside the iframe
2. **No console spam** - errors from the iframe will be silently caught and dropped
3. **Toast-only feedback** - the `FixErrorToast` at the bottom remains the only error UI
4. **Streaming stability** - errors during streaming are completely suppressed since `isStreaming` guard is active

## Testing Checklist
After implementation:
1. Generate code that intentionally has a syntax error → No overlay, toast appears
2. Generate code with missing import → No overlay, toast appears
3. Generate code with undefined function call → No infinite loop, toast appears
4. Watch console during generation → No spam
5. Complete a successful generation → Preview renders cleanly
