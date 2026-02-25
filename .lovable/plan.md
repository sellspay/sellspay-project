

# VibeCoder Orchestration Architecture Refactor

## Overview
Refactor the `vibecoder-v2` edge function from a monolithic 4000-line file into a modular, scope-aware orchestration system. This eliminates truncation failures, prevents full-project rewrites for small edits, and reduces token waste.

## Current State (Problems)
- Single 4000+ line `index.ts` file handles everything
- MODIFY intent sends ALL project files to Claude, even for "change button color"
- No token estimation before calling the model -- output can exceed limits
- Retry logic only exists at the JSON-parse level (fallbacks 1-3), not at the model-call level
- Micro-edit detection exists but doesn't actually scope which files to send

## Architecture: 4-Layer System

```text
User Prompt
     |
     v
[Layer 1: Intent Classifier]  (existing, Gemini Flash Lite -- no change)
     |
     v
[Layer 2: Scope Analyzer]     (NEW -- lightweight Claude call for MODIFY)
     |  Returns: affectedFiles[], estimatedComplexity
     v
[Layer 3: Model Router]       (UPGRADED -- token-aware decision engine)
     |  Decides: model, maxTokens, which files to include in context
     v
[Layer 4: Generation + Retry] (UPGRADED -- structured retry with scope reduction)
     |  On failure: reduce scope, retry with explicit instruction
     v
[Zero-Trust Gate]              (existing -- no changes)
```

## Phase 1: Scope Analyzer (NEW)

**What it does:** Before any MODIFY generation, makes a lightweight call to determine which files need changing.

**Implementation:**
- Add a new `analyzeScope()` function in `index.ts`
- Uses Gemini Flash (cheap, fast) with a structured prompt
- Input: file list (paths only, no content), user prompt, conversation history
- Output: `{ affectedFiles: string[], strategy: "micro" | "partial" | "full", estimatedOutputTokens: number }`

**Prompt template:**
```
Given this project file list and user request, return ONLY a JSON object:
- affectedFiles: array of file paths that must change
- strategy: "micro" (1 file, < 50 lines changed), "partial" (2-4 files), or "full" (5+ files or structural)
- estimatedOutputTokens: rough estimate of output size

File list: [paths]
User request: "..."
```

**Integration point:** Called after intent classification, before `executeIntent()`. Result feeds into the context builder to send only relevant files.

## Phase 2: Context Scoping (MODIFY intent)

**What changes:** In `executeIntent()`, the code context builder (lines ~2455-2483) currently sends ALL project files for MODIFY.

**New behavior:**
- If scope analyzer returns `strategy: "micro"` or `"partial"`, only include `affectedFiles` in the context
- Include a file listing of OTHER files (paths only, no content) so the model knows what exists
- This dramatically reduces input tokens (e.g., 8 files x 200 lines = 12K tokens down to 2 files x 200 lines = 3K tokens)

**Code change:** Modify the `projectFiles` filtering block:
```typescript
// If scope analysis available, filter context to affected files only
if (scopeResult && scopeResult.strategy !== 'full') {
  const scopedFiles: Record<string, string> = {};
  const otherPaths: string[] = [];
  for (const [path, content] of Object.entries(projectFiles)) {
    if (scopeResult.affectedFiles.includes(path)) {
      scopedFiles[path] = content;
    } else {
      otherPaths.push(path);
    }
  }
  // Build context with scoped files + path listing of untouched files
  codeContext = `FILES TO MODIFY:\n${Object.entries(scopedFiles).map(...)}\n\nOTHER FILES (do not output these):\n${otherPaths.join('\n')}`;
}
```

## Phase 3: Token Guardrail System

**What it does:** Before calling Claude, estimates whether the generation will exceed safe output limits.

**Implementation:**
- Add `estimateTokenBudget()` function
- Input tokens: count chars in system prompt + user message, divide by 4
- Output estimate: from scope analyzer's `estimatedOutputTokens`, or heuristic based on file count x average file size
- If estimated output exceeds 50K tokens (Claude's safe zone), force strategy to `"partial"` and reduce files

**Hard rules:**
- Claude Sonnet: cap at 50K output tokens (leave headroom from 64K limit)
- If scope says 8+ files need full rewrite, split into 2 batches (not implemented in v1 -- just limit to most critical files)

## Phase 4: Structured Retry Mechanism

**What changes:** Currently, retries only happen at JSON-parse level (fallbacks 1-3). No model-level retry exists.

**New behavior:** Add a retry wrapper around `callModelAPI()` for code generation:

```typescript
async function generateWithRetry(config, messages, opts, maxRetries = 1): Promise<Response> {
  const response = await callModelAPI(config, messages, opts);
  
  // If streaming, can't retry here -- handled in stream processing
  if (opts.stream) return response;
  
  // For non-streaming: check response quality
  const text = await response.text();
  const parsed = tryParseCodeResponse(text);
  
  if (!parsed && maxRetries > 0) {
    // Retry with explicit instruction
    const retryMessages = [...messages];
    retryMessages.push({
      role: "user",
      content: "Previous output was truncated or invalid JSON. Return ONLY the JSON file map. Reduce verbosity if needed but ensure every bracket is closed."
    });
    return generateWithRetry(config, retryMessages, { ...opts, temperature: 0.1 }, maxRetries - 1);
  }
  
  return new Response(text, { status: response.status, headers: response.headers });
}
```

**For streaming (primary path):** After the stream completes and JSON parse fails in the SUMMARY handler (lines ~3184-3445), before falling through to fallbacks:
- If all 3 fallbacks fail AND we haven't retried yet, trigger a non-streaming retry call with reduced scope
- Emit a `phase: retrying` event to the frontend

## Phase 5: Strategy Matrix

**Integrated into Scope Analyzer output:**

| User Request Pattern | Strategy | Files Sent | Max Output |
|---|---|---|---|
| "change button color" | micro | 1 file | 8K tokens |
| "update hero and footer" | partial | 2-3 files | 20K tokens |
| "make it more premium" (style change) | partial | theme.ts + affected components | 30K tokens |
| "rebuild everything" | full | all files | 50K tokens |
| First BUILD (no existing code) | full | none (fresh) | 50K tokens |

## Files Changed

**1. `supabase/functions/vibecoder-v2/index.ts`** (the only file)

Changes:
- Add `analyzeScope()` function (~60 lines) after the existing `analyzeIntent()` function
- Add `estimateTokenBudget()` function (~20 lines)
- Modify `executeIntent()` to accept and use scope results for context filtering
- Modify the main `serve()` handler to call scope analyzer before execution (for MODIFY/FIX intents)
- Add retry logic in the stream processing section (after fallback 3 fails)
- Update streaming to emit `phase: scoping` event during scope analysis

**2. Frontend changes: None required**
- The existing `StreamingPhaseCard` already handles dynamic phase names
- New phases (`scoping`, `retrying`) will display automatically

## Constraints Preserved
- Zero-Trust commit gate: untouched
- Validation logic: untouched (except benefiting from less truncation)
- Atomic job authority: untouched
- Credit system: untouched
- All existing fallback/rescue logic: preserved as-is

## Expected Outcomes
- "make it more premium" modifies only theme.ts + affected component files (not all 8)
- Token usage drops 40-60% for typical MODIFY requests
- Truncation failures drop significantly (less output pressure)
- CHAT responses still use Gemini Flash (no change)
- BUILD still uses Claude with full context (no change)

