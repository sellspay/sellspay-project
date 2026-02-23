

# Harden Streaming Pipeline: Kill the JSON-as-Code Bug

## Problem

The streaming layer in `useStreamingCode.ts` has a critical leak between its two tiers:

1. **Tier 1 (Streaming)**: Visual feedback only -- chunks arrive for live preview
2. **Tier 2 (Atomic)**: `event: files` delivers validated JSON payload for final commit

The leak: when `event: code_chunk` fires (legacy fallback), raw chunks are buffered in `streamingCodeBuffer`. If those chunks contain JSON (e.g., `{"files": {"/App.tsx": "..."}}`), the code at **line 951-953** injects the raw buffer directly into Sandpack state:

```
if (streamingCodeBuffer.length > 100) {
  setState(prev => ({ ...prev, code: streamingCodeBuffer }));
}
```

This means a raw JSON string like `{"files":{...}}` gets set as `/App.tsx` content, and Babel crashes trying to transpile it.

Additionally, if `extractCodeFromRaw` returns empty (NO_CODE_EXTRACTED), the legacy code path at **lines 1140-1171** correctly aborts -- but the streaming path at **line 952** already injected garbage before we got there.

## Fix (3 Surgical Changes)

### 1. Add `looksLikeCode()` guard to `code_chunk` streaming injection (line 951-953)

Before injecting `streamingCodeBuffer` into state for live preview, check that it actually looks like code, not JSON or SSE metadata:

```typescript
function looksLikeCode(chunk: string): boolean {
  if (!chunk || chunk.trim().length < 10) return false;
  const trimmed = chunk.trim();
  if (trimmed.startsWith('{') && trimmed.includes('"files"')) return false;
  if (trimmed.startsWith('{"')) return false;
  if (trimmed.startsWith('event:')) return false;
  return true;
}
```

Apply this guard at line 951:
```typescript
// BEFORE (line 951-953):
if (streamingCodeBuffer.length > 100) {
  setState(prev => ({ ...prev, code: streamingCodeBuffer }));
}

// AFTER:
if (streamingCodeBuffer.length > 100 && looksLikeCode(streamingCodeBuffer)) {
  setState(prev => ({ ...prev, code: streamingCodeBuffer }));
}
```

### 2. Add the same guard to the `extractCodeFromRaw` mid-stream path (line 1072-1080)

The raw stream mode also injects during the read loop. Add the same guard:

```typescript
// BEFORE (line 1072-1080):
if (mode === 'code') {
  const cleanCode = extractCodeFromRaw(rawStream);
  if (cleanCode && isLikelyCompleteTsx(cleanCode)) {
    lastGoodCodeRef.current = cleanCode;
    setState(prev => ({ ...prev, code: cleanCode }));
    options.onChunk?.(cleanCode);
  }
}

// AFTER:
if (mode === 'code') {
  const cleanCode = extractCodeFromRaw(rawStream);
  if (cleanCode && looksLikeCode(cleanCode) && isLikelyCompleteTsx(cleanCode)) {
    lastGoodCodeRef.current = cleanCode;
    setState(prev => ({ ...prev, code: cleanCode }));
    options.onChunk?.(cleanCode);
  }
}
```

### 3. Add final safety net in `code_chunk` JSON detection (line 916)

The existing JSON detection at line 916 only fires when the buffer starts with `{` AND includes `"files"`. But the `try/catch` parse can fail on incomplete JSON, and execution falls through to line 951 where the raw buffer gets injected anyway. Add an early `return` after the JSON detection block to prevent fallthrough:

```typescript
// After the JSON detection block (line 915-949), add:
if (trimmedBuf.startsWith('{') && trimmedBuf.includes('"files"')) {
  // Already handled above or still buffering -- either way, do NOT
  // inject raw JSON into Sandpack as code.
  break;
}
```

This replaces the current logic where the JSON parse failure falls through to raw injection.

## Files Changed

- `src/components/ai-builder/useStreamingCode.ts` -- 3 surgical edits, no architectural changes

## What This Does NOT Change

- The `event: files` atomic path (already correct)
- The guardrails system (already correct)
- The `extractCodeFromRaw` JSON unwrapping (already correct)
- The final validation at lines 1140-1171 (already correct)

## Result

After this fix, the pipeline becomes:

```
AI -> Stream chunk -> looksLikeCode? -> NO -> skip (never touches Sandpack)
AI -> Stream chunk -> looksLikeCode? -> YES -> inject for live preview
AI -> event: files -> atomic commit (unchanged, already safe)
```

No JSON will ever reach Babel again.

