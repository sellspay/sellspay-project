

# Prompt Specialization: Dedicated MODIFY Prompt

## Problem
MODIFY currently uses `CODE_EXECUTOR_PROMPT` which forces Claude to output 5 sections (ANALYSIS, PLAN, CODE, SUMMARY, CONFIDENCE). For a "change button color" request, this means Claude generates hundreds of tokens of reasoning before any JSON, inflating output size and increasing truncation risk.

## Solution
Create a dedicated `CODE_MODIFY_PROMPT` — a lean, JSON-only system prompt used exclusively when `intent === "MODIFY"`.

## Changes (single file)

**File: `supabase/functions/vibecoder-v2/index.ts`**

### 1. Add new `CODE_MODIFY_PROMPT` constant (~line 1642, before `CODE_EXECUTOR_PROMPT`)

A strict JSON-only prompt with no ANALYSIS/PLAN/SUMMARY sections:

```
You are a structured code modification engine.
You are operating inside an automated pipeline.
If your output is not valid JSON, the run will fail.

You MUST:
- Output ONLY valid JSON.
- Output nothing before JSON.
- Output nothing after JSON.
- Do not include ANALYSIS.
- Do not include PLAN.
- Do not include SUMMARY.
- Do not explain.
- Do not describe changes.
- Do not include markdown.
- Do not include backticks.

Return format:
{
  "files": {
    "/path/to/file.tsx": "FULL updated file content"
  }
}

Rules:
- Only return files listed for modification.
- Preserve all unrelated code.
- Changes must be minimal.
- Each file must be complete and syntactically valid.
- Never truncate syntax.
- First character must be '{'.
- Last character must be '}'.
```

This prompt will also include the mandatory layout hierarchy, technology constraints, scrollbar handling, and file structure protocol sections (copied from `CODE_EXECUTOR_PROMPT`) since those rules still apply.

### 2. Update the switch statement (~line 2395)

Change:
```typescript
case "FIX":
case "BUILD":
case "MODIFY":
default:
  systemPrompt = CODE_EXECUTOR_PROMPT;
```

To:
```typescript
case "MODIFY":
  systemPrompt = CODE_MODIFY_PROMPT;
  break;
case "FIX":
case "BUILD":
default:
  systemPrompt = CODE_EXECUTOR_PROMPT;
```

### 3. Update stream parser for MODIFY responses

The existing stream parser extracts code from `=== CODE ===` sections. For MODIFY, the entire response IS the JSON — no section extraction needed. Add a check: if intent is MODIFY, treat the full streamed text as the code result (skip section parsing).

## What Does NOT Change
- BUILD prompt (keeps ANALYSIS/PLAN/CODE/SUMMARY)
- FIX prompt (keeps structured format)
- QUESTION/REFUSE prompts (already separate)
- Zero-Trust commit gate
- Scope analyzer
- Token guardrails
- Retry logic
- All existing injections (brand memory, brand layer, products, creator identity) still get appended to the MODIFY prompt

## Expected Impact
- MODIFY output shrinks by 30-50% (no ANALYSIS/PLAN/SUMMARY overhead)
- Truncation probability drops significantly
- JSON starts at character 0 — no text-before-JSON drift
- Stream parser becomes simpler for MODIFY path
