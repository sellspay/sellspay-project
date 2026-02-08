
# Healer Protocol: Advanced Truncation Recovery System

## Summary

This plan adds a **backend linter** with structural integrity checks to the `vibecoder-v2` edge function and enhances the Ghost Fixer's **auto-resume logic** to handle mid-string and mid-tag truncation gracefully. The goal is to prevent broken code from ever reaching the frontend and enable surgical self-healing when truncation occurs.

---

## Current State vs. Proposed State

| Capability | Current | After This Plan |
|------------|---------|-----------------|
| Sentinel Check | Frontend only (`useStreamingCode`) | Backend + Frontend (double-check) |
| Mid-string detection | Basic (last char check) | Advanced (quote parity + line analysis) |
| Resume prompt | Generic "continue from here" | String-aware "close the quote first, then continue" |
| Backend validation | None before saving to DB | `validateOutputIntegrity()` guard |
| Error flagging | Console warnings | Structured `TRUNCATION_DETECTED` / `SYNTAX_ERROR` codes |

---

## Implementation Plan

### Phase 1: Backend Linter Function (Edge Function)

**File: `supabase/functions/vibecoder-v2/index.ts`**

Add a `validateOutputIntegrity()` function that runs BEFORE saving code to the `ai_generation_jobs` table:

```text
validateOutputIntegrity(code)
├─ 1. Check for VIBECODER_COMPLETE sentinel at end
│     → Missing = TRUNCATION_DETECTED
├─ 2. Check for unterminated strings (last 5 lines)
│     → Odd quote count = SYNTAX_ERROR (open string)
├─ 3. Check for unterminated JSX tags (< without >)
│     → SYNTAX_ERROR (open tag)
└─ 4. Check brace/paren balance
      → Unbalanced = SYNTAX_ERROR (structural)
```

If validation fails:
- **Do NOT save broken code to the job's `code_result`**
- Instead, save `validation_error` with the error type and context
- The frontend can then trigger Ghost Fixer with more precision

### Phase 2: Enhanced Ghost Fixer Resume Prompt

**File: `src/hooks/useGhostFixer.ts`**

Upgrade `buildContinuationPrompt()` to include string-safety awareness:

```text
[CONTINUATION_MODE]
Your previous response was CUT OFF mid-generation.

TRUNCATION CONTEXT:
- Last 400 characters: [context]
- Error type: [TRUNCATION_TYPE - e.g., "OPEN_STRING", "OPEN_TAG", "UNBALANCED_BRACES"]

CRITICAL INSTRUCTIONS:
1. If the truncation ended inside a string (e.g., className="...), 
   your FIRST characters must CLOSE that string and any open tags
2. Then continue the logic naturally
3. End with: // --- VIBECODER_COMPLETE ---
```

This ensures the AI doesn't output invalid syntax on the first token of the continuation.

### Phase 3: Truncation Type Detection

**File: `src/hooks/useGhostFixer.ts`**

Add a `detectTruncationType()` function that analyzes the truncated code:

```text
detectTruncationType(code)
├─ Check if last line ends with unclosed "
│     → Return "OPEN_DOUBLE_QUOTE"
├─ Check if last line ends with unclosed '
│     → Return "OPEN_SINGLE_QUOTE"
├─ Check if last line ends with unclosed `
│     → Return "OPEN_TEMPLATE_LITERAL"
├─ Check if last line ends with <tag without >
│     → Return "OPEN_JSX_TAG"
├─ Check if code has unbalanced braces
│     → Return "UNBALANCED_BRACES"
└─ Default: Return "GENERAL_TRUNCATION"
```

The continuation prompt will include this type for surgical precision.

### Phase 4: Backend Job Processing Enhancement

**File: `supabase/functions/vibecoder-v2/index.ts`**

Modify the job processing logic (around line 1304-1370) to:

1. Run `validateOutputIntegrity()` on `fullContent` before marking job as completed
2. If validation fails:
   - Set `status: 'needs_continuation'` (new status)
   - Save `validation_error` field with the error details
   - The frontend listens for this status and auto-triggers Ghost Fixer
3. If validation passes:
   - Normal flow - save to `code_result`

### Phase 5: Realtime Listener for Continuation Trigger

**File: `src/components/ai-builder/AIBuilderCanvas.tsx`**

Update the job completion listener to:
1. Check if job status is `'needs_continuation'`
2. If so, automatically trigger `ghostFixer.triggerContinuation()` with the partial code
3. The user sees "Auto-healing code..." toast during this process

---

## Technical Details

### validateOutputIntegrity Function

```typescript
function validateOutputIntegrity(code: string): { 
  isValid: boolean; 
  errorType?: string;
  errorMessage?: string;
  truncationLine?: number;
} {
  const sentinel = "// --- VIBECODER_COMPLETE ---";
  const trimmed = code.trim();
  
  // 1. Check for completion sentinel
  if (!trimmed.includes(sentinel)) {
    return { 
      isValid: false, 
      errorType: "TRUNCATION_DETECTED",
      errorMessage: "AI output missing completion sentinel - likely truncated"
    };
  }

  // 2. Check for unterminated strings in last 5 lines
  const lines = trimmed.split('\n');
  const lastLines = lines.slice(-5).join('\n');
  const doubleQuotes = (lastLines.match(/"/g) || []).length;
  const singleQuotes = (lastLines.match(/'/g) || []).length;
  
  if (doubleQuotes % 2 !== 0) {
    return { 
      isValid: false, 
      errorType: "OPEN_STRING",
      errorMessage: "Unterminated double-quote string in last 5 lines",
      truncationLine: lines.length
    };
  }
  if (singleQuotes % 2 !== 0) {
    return { 
      isValid: false, 
      errorType: "OPEN_STRING",
      errorMessage: "Unterminated single-quote string in last 5 lines",
      truncationLine: lines.length
    };
  }

  return { isValid: true };
}
```

### Enhanced Continuation Prompt Template

```typescript
const HEALER_CONTINUATION_PROMPT = `[HEALER_MODE: AUTO_RESUME]
Your previous generation was TRUNCATED at approximately line {LINE_NUMBER}.
ERROR TYPE: {ERROR_TYPE}

{ERROR_TYPE === "OPEN_STRING" ? `
⚠️ STRING SAFETY: Your last token was inside an unclosed string.
YOUR FIRST OUTPUT MUST: Close the string with " (or ' or \`) and any open tags.
EXAMPLE: ...gradient-to-r from-zinc-900"> to close a className.
` : ""}

LAST 400 CHARACTERS:
\`\`\`
{CONTEXT_TAIL}
\`\`\`

INSTRUCTIONS:
1. Continue EXACTLY from the cutoff point
2. Do NOT repeat any code
3. Complete the remaining logic
4. End with: // --- VIBECODER_COMPLETE ---`;
```

---

## File Changes Summary

| File | Changes |
|------|---------|
| `supabase/functions/vibecoder-v2/index.ts` | Add `validateOutputIntegrity()`, modify job processing to check validation before saving |
| `src/hooks/useGhostFixer.ts` | Add `detectTruncationType()`, enhance `buildContinuationPrompt()` with error-type-aware instructions |
| `src/components/ai-builder/AIBuilderCanvas.tsx` | Handle `needs_continuation` job status, auto-trigger Ghost Fixer |

---

## Expected Outcomes

| Issue | Before | After |
|-------|--------|-------|
| Broken code saved to DB | Possible | Blocked by backend linter |
| Mid-string continuation fails | Common (AI outputs invalid first token) | Fixed (prompt tells AI to close string) |
| User sees "Unterminated string" error | Frequently | Rarely (healed automatically) |
| Recovery precision | Generic continuation | Surgical (knows exact error type) |

---

## Rollout Strategy

1. **Phase 1** (Backend Linter) - Add `validateOutputIntegrity()` and logging first, don't block saves yet
2. **Phase 2** (Enhanced Prompts) - Upgrade Ghost Fixer with string-aware continuation
3. **Phase 3** (Full Enforcement) - Enable `needs_continuation` status flow
4. **Phase 4** (Monitoring) - Watch logs for truncation patterns and tune detection
