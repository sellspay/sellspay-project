
# Vibecoder Agent Loop v1 — Core Tool Loop

Goal: stop sending one giant prompt and praying. Make the AI plan, inspect, then edit through structured tool calls. Apply to both `vibecoder-v2` (full storefront generator) and `storefront-vibecoder` (chat section editor). Keep the Gate 5 design critique we already shipped.

## What changes for the user

- Generations stop blowing up on large projects — the model only loads files it actually needs.
- Edits become surgical (search/replace) instead of full-file rewrites, so unrelated code doesn't get mangled when you ask for a small change.
- You'll see a real plan stream before edits start, then per-file edit events, then validation.
- Same UI shell. No new buttons, no migrations, no auth changes.

## Architecture

```text
User prompt
   │
   ▼
[Phase 1: Plan]   ── model w/ tool access ──▶  emits plan + which files to inspect
   │
   ▼
[Phase 2: Inspect] ── glob / grep / read_file ──▶ model loads only relevant context
   │
   ▼
[Phase 3: Edit]   ── replace_in_file / write_file ──▶ structured edits, applied server-side
   │
   ▼
[Phase 4: Validate] ── existing validateAllFilesServer + Gate 5 critique ──▶ revise loop
   │
   ▼
Stream final files to client (unchanged SSE contract)
```

The outer SSE event shape (`phase`, `analysis`, `plan`, `files`, `complete`) stays the same so `useAgentLoop` and the preview don't need rewrites.

## Tool surface (server-only, both engines)

Minimal set — exactly the 5 the user called out:

| Tool | Input | Returns |
|---|---|---|
| `glob` | `{ pattern: string }` | array of file paths |
| `grep` | `{ query: string, pattern?: string }` | matches with file + line + snippet |
| `read_file` | `{ path: string, start?: number, end?: number }` | chunked file content (max ~400 lines/call) |
| `replace_in_file` | `{ path: string, find: string, replace: string }` | ok/err + new file content |
| `write_file` | `{ path: string, content: string }` | ok |

Implemented as a `Tools` map with `inputSchema` (zod) and `execute`, run via the AI SDK `streamText` + `stopWhen: stepCountIs(50)` loop. No more hand-rolled OpenAI tool payloads.

`replace_in_file` requires a unique exact match; on miss it returns an error string back to the model so it can retry — same pattern Cursor/Claude Code use.

## Phase 1 — Planner

- New helper `planChanges(prompt, fileMap)` calls `gemini-2.5-flash` (cheap) with: user prompt + a compact repo map (just file paths + first-line section comment).
- Output is structured (`Output.object`) → `{ summary, plan: string[], filesToInspect: string[] }`.
- Streams as `analysis` + `plan` events to keep current UI working.

## Phase 2 + 3 — Tool-using editor

- Single `streamText` call with `gemini-2.5-pro` (or `gpt-5` if user picked it), the 5 tools, and a system prompt that enforces:
  > Never edit before inspecting. Use `read_file` on every file you intend to change. Prefer `replace_in_file` over `write_file` unless creating a new file.
- Working file map is held in a server-side `Map<string, string>`. Tools mutate that map; nothing hits Sandpack until Phase 4 passes.
- After each successful `replace_in_file` / `write_file`, emit a partial `files` SSE so the client streams progress (matches existing UX standard).

## Phase 4 — Validation (reuse existing gates)

- Run existing `validateAllFilesServer` (syntax + TS).
- Run existing `critiqueDesignQuality` (Gate 5, style-agnostic version).
- On failure, feed errors back to the editor model in a second loop turn — same `streamText` session, max 2 revision attempts (matches current cap).
- Final files committed via existing `emitEvent('files', …)` and `complete`.

## Repo map (lightweight)

No tree-sitter / ts-morph yet — primitive is enough:

```ts
function buildRepoMap(files: Record<string,string>) {
  return Object.entries(files).map(([path, content]) => {
    const exports = [...content.matchAll(/export\s+(?:default\s+)?(?:function|const|class)\s+(\w+)/g)].map(m=>m[1]);
    return { path, exports, bytes: content.length };
  });
}
```

Sent to planner only, not to the editor (editor uses tools to discover).

## Differences between the two engines

- **vibecoder-v2** (full generator): Phase 1 plan covers full-storefront generation. On a fresh project, planner outputs the file scaffold; editor uses `write_file` for new files and `replace_in_file` only for iterative requests.
- **storefront-vibecoder** (chat section editor): no scaffolding — every request is iterative. Same tool loop, but planner is biased toward `replace_in_file` and `read_file` only the targeted section.

Both share a new helper module `supabase/functions/_shared/agent-loop.ts` so we don't duplicate the tool implementations or the planner.

## File touch list

- New: `supabase/functions/_shared/agent-loop.ts` — tools, planner, runAgent loop.
- Edit: `supabase/functions/vibecoder-v2/index.ts` — replace single-shot generation call with `runAgent(...)`. Keep all SSE event names. Keep Gate 5 wiring (called from inside runAgent now).
- Edit: `supabase/functions/storefront-vibecoder/index.ts` — same swap, smaller blast radius.
- No frontend changes. `useAgentLoop`, `VibecoderPreview`, `useVibecoderChat` all keep working because the SSE contract is unchanged.

## Out of scope (future passes)

- Symbol index via tree-sitter / ts-morph
- `run_command` tool (build/lint/test inside edge function — not feasible there anyway)
- Model routing per task (cheap planner / strong editor is the only split this pass)
- Skill injection based on detected stack

## Risks

- Edge function wall time: tool loops can run longer. Mitigation: `stepCountIs(50)` cap + per-tool 5s timeout + total 90s budget; on budget exhaustion fall back to current single-shot path so users never get a blank screen.
- `replace_in_file` exact-match failures: handled by returning a structured error to the model + retry; if it still fails twice on the same hunk we fall back to `write_file` for that file only.
- Streaming partial files: we already do this elsewhere, but we'll guard against emitting half-applied edit batches by only flushing after each successful tool call returns.
