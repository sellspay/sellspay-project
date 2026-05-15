// ════════════════════════════════════════════════════════════════════════════
// Vibecoder Agent Loop v1
//
// A small, self-contained agentic editor that runs inside a Deno Edge Function.
// Replaces "single giant prompt" generation with: plan → inspect → edit → validate.
//
// Tools exposed to the model (OpenAI tool-calling format, routed through the
// Lovable AI Gateway):
//   - glob          discover files by pattern
//   - grep          search for substrings
//   - read_file     read a file (chunked)
//   - replace_in_file   surgical edit by exact-match find/replace
//   - write_file    create or fully rewrite a file
//
// Caller passes in:
//   - the working file map (mutated by tools)
//   - SSE emit callback (so partial files / tool events stream to the client)
//   - optional validate() callback that runs after each edit batch and feeds
//     errors back into the loop
//
// Designed to be importable from any edge function without dragging in the
// full AI SDK bundle (Edge Function cold-start budget is tight).
// ════════════════════════════════════════════════════════════════════════════

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

export type FileMap = Record<string, string>;

export interface EmitEvent {
  (type: string, payload: unknown): void;
}

export interface ValidateResult {
  ok: boolean;
  errors?: string[];
}

export interface RunAgentOptions {
  /** User's natural-language request */
  prompt: string;
  /** Initial file map (will be cloned, not mutated) */
  initialFiles: FileMap;
  /** Lovable Gateway API key */
  apiKey: string;
  /** Editor model (default: gemini-2.5-pro) */
  editorModel?: string;
  /** Planner model (default: gemini-2.5-flash) */
  plannerModel?: string;
  /** Stream events to the client (phase, plan, files, tool, log) */
  emit?: EmitEvent;
  /** Optional system prompt prefix (project-specific rules) */
  systemPrompt?: string;
  /** Max tool-loop steps (default: 50) */
  maxSteps?: number;
  /** Total wall-time budget in ms (default: 120_000) */
  budgetMs?: number;
  /** Optional post-edit validator; failures are fed back to the model */
  validate?: (files: FileMap) => Promise<ValidateResult> | ValidateResult;
  /** Max revision attempts after validation failure (default: 2) */
  maxRevisions?: number;
}

export interface RunAgentResult {
  files: FileMap;
  steps: number;
  toolCalls: number;
  changedFiles: string[];
  plan?: string[];
  summary?: string;
  validatedOk: boolean;
  validationErrors?: string[];
}

// ─── Tool definitions (OpenAI function-calling schema) ──────────────────────

const TOOLS = [
  {
    type: "function",
    function: {
      name: "glob",
      description:
        "List file paths matching a glob-like pattern. Use this to discover repo structure before reading files. Patterns support * and **.",
      parameters: {
        type: "object",
        properties: {
          pattern: {
            type: "string",
            description: "Glob pattern, e.g. 'src/**/*.tsx' or '*.ts'",
          },
        },
        required: ["pattern"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "grep",
      description:
        "Search for a substring across the project. Returns matching files with line numbers and snippets. Use to find references before editing.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Exact substring to search for (case-sensitive)" },
          pattern: { type: "string", description: "Optional file glob to limit the search" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "read_file",
      description:
        "Read a file's contents. Use start/end (1-indexed line numbers) for chunked reads on large files. Default returns up to 400 lines.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string" },
          start: { type: "number", description: "Start line (1-indexed, inclusive)" },
          end: { type: "number", description: "End line (1-indexed, inclusive)" },
        },
        required: ["path"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "replace_in_file",
      description:
        "Surgical edit: find an exact substring in a file and replace it. The 'find' string MUST appear exactly once in the file. Prefer this over write_file for any change to an existing file.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string" },
          find: { type: "string", description: "Exact substring to find. Must be unique in the file." },
          replace: { type: "string", description: "Replacement text" },
        },
        required: ["path", "find", "replace"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "write_file",
      description:
        "Create a new file or fully rewrite an existing one. Use only for new files or when more than ~50% of a file is changing.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string" },
          content: { type: "string" },
        },
        required: ["path", "content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "done",
      description:
        "Call this when all required edits are made. Provide a one-paragraph summary of what changed.",
      parameters: {
        type: "object",
        properties: {
          summary: { type: "string" },
        },
        required: ["summary"],
      },
    },
  },
] as const;

// ─── Tool implementations ──────────────────────────────────────────────────

function globToRegex(pattern: string): RegExp {
  // Minimal glob → regex: ** = any chars, * = any except /, ? = single
  let re = "^";
  for (let i = 0; i < pattern.length; i++) {
    const c = pattern[i];
    if (c === "*") {
      if (pattern[i + 1] === "*") {
        re += ".*";
        i++;
      } else {
        re += "[^/]*";
      }
    } else if (c === "?") re += "[^/]";
    else if (".+^$()|{}[]\\".includes(c)) re += "\\" + c;
    else re += c;
  }
  re += "$";
  return new RegExp(re);
}

function tool_glob(files: FileMap, args: { pattern: string }): string {
  const re = globToRegex(args.pattern);
  const matches = Object.keys(files).filter((p) => re.test(p));
  if (matches.length === 0) return `No files match ${args.pattern}`;
  return matches.slice(0, 200).join("\n");
}

function tool_grep(files: FileMap, args: { query: string; pattern?: string }): string {
  const re = args.pattern ? globToRegex(args.pattern) : null;
  const out: string[] = [];
  let total = 0;
  for (const [path, content] of Object.entries(files)) {
    if (re && !re.test(path)) continue;
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(args.query)) {
        out.push(`${path}:${i + 1}: ${lines[i].trim().slice(0, 200)}`);
        total++;
        if (total >= 80) break;
      }
    }
    if (total >= 80) break;
  }
  return out.length ? out.join("\n") : `No matches for "${args.query}"`;
}

function tool_read(files: FileMap, args: { path: string; start?: number; end?: number }): string {
  const content = files[args.path];
  if (content == null) return `ERROR: file not found: ${args.path}`;
  const lines = content.split("\n");
  const start = Math.max(1, args.start ?? 1);
  const end = Math.min(lines.length, args.end ?? Math.min(lines.length, start + 399));
  const slice = lines.slice(start - 1, end);
  const header = `// ${args.path} (lines ${start}-${end} of ${lines.length})\n`;
  return header + slice.map((l, i) => `${start + i}: ${l}`).join("\n");
}

interface ReplaceResult {
  ok: boolean;
  message: string;
  newContent?: string;
}

function tool_replace(
  files: FileMap,
  args: { path: string; find: string; replace: string },
): ReplaceResult {
  const content = files[args.path];
  if (content == null) {
    return { ok: false, message: `ERROR: file not found: ${args.path}. Use write_file to create it.` };
  }
  const idx = content.indexOf(args.find);
  if (idx === -1) {
    return {
      ok: false,
      message: `ERROR: 'find' string not found in ${args.path}. Re-read the file and use the exact text. Tip: include enough context to make the match unique.`,
    };
  }
  const last = content.lastIndexOf(args.find);
  if (last !== idx) {
    return {
      ok: false,
      message: `ERROR: 'find' string appears multiple times in ${args.path}. Add more surrounding context to make the match unique.`,
    };
  }
  const next = content.slice(0, idx) + args.replace + content.slice(idx + args.find.length);
  return { ok: true, message: `OK: replaced ${args.find.length} chars in ${args.path}`, newContent: next };
}

// ─── Lovable AI Gateway call (OpenAI-compatible chat/completions) ──────────

interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: any[];
  tool_call_id?: string;
  name?: string;
}

async function callGateway(
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  tools?: any[],
  signal?: AbortSignal,
): Promise<any> {
  const body: any = { model, messages, temperature: 0.4 };
  if (tools) {
    body.tools = tools;
    body.tool_choice = "auto";
  }
  const resp = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey,
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
    signal,
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    if (resp.status === 429) throw new Error("RATE_LIMITED");
    if (resp.status === 402) throw new Error("CREDITS_EXHAUSTED");
    throw new Error(`Gateway ${resp.status}: ${text.slice(0, 300)}`);
  }
  return await resp.json();
}

// ─── Repo map (lightweight) ─────────────────────────────────────────────────

function buildRepoMap(files: FileMap): string {
  const entries = Object.entries(files).map(([path, content]) => {
    const exports = [
      ...content.matchAll(/export\s+(?:default\s+)?(?:function|const|class|interface|type)\s+(\w+)/g),
    ]
      .map((m) => m[1])
      .slice(0, 6);
    const lines = content.split("\n").length;
    return `- ${path} (${lines}L)${exports.length ? ` exports: ${exports.join(", ")}` : ""}`;
  });
  return entries.slice(0, 200).join("\n");
}

// ─── Planner ────────────────────────────────────────────────────────────────

interface Plan {
  summary: string;
  steps: string[];
  filesToInspect: string[];
}

async function plan(
  apiKey: string,
  model: string,
  prompt: string,
  files: FileMap,
  systemPrefix: string,
  signal: AbortSignal,
): Promise<Plan> {
  const repoMap = buildRepoMap(files);
  const isFresh = Object.keys(files).length === 0;

  const sys = `You are the planner for a code-editing agent.
${systemPrefix}

You will produce a JSON plan describing what needs to change. Do NOT write code.
Output STRICT JSON only, no markdown fences:
{
  "summary": "one-sentence description of the work",
  "steps": ["short imperative step", "..."],
  "filesToInspect": ["path/relative/to/repo", "..."]
}

Rules:
- 3-7 steps, each ≤ 12 words.
- filesToInspect: only files that already exist and are likely to be edited or referenced. Empty array if creating from scratch.
- Be concrete about which sections/files change.`;

  const user = `User request:
${prompt}

${isFresh ? "Repo is empty (fresh build)." : `Existing files:\n${repoMap}`}`;

  const data = await callGateway(
    apiKey,
    model,
    [
      { role: "system", content: sys },
      { role: "user", content: user },
    ],
    undefined,
    signal,
  );
  const raw = data?.choices?.[0]?.message?.content ?? "";
  const jsonText = raw.replace(/```(?:json)?\s*([\s\S]*?)```/g, "$1").trim();
  try {
    const parsed = JSON.parse(jsonText);
    return {
      summary: String(parsed.summary ?? ""),
      steps: Array.isArray(parsed.steps) ? parsed.steps.map(String).slice(0, 12) : [],
      filesToInspect: Array.isArray(parsed.filesToInspect)
        ? parsed.filesToInspect.map(String).slice(0, 20)
        : [],
    };
  } catch {
    return { summary: "Apply requested changes.", steps: [], filesToInspect: [] };
  }
}

// ─── Editor system prompt ───────────────────────────────────────────────────

const EDITOR_SYSTEM = `You are a senior code-editing agent operating on a project's file tree through tools.

WORKFLOW (mandatory):
1. Use glob/grep to discover files relevant to the request.
2. Use read_file on every file you intend to modify BEFORE editing it.
3. Prefer replace_in_file over write_file. Only use write_file for new files or full rewrites.
4. Make small, targeted edits. Do not rewrite unrelated code.
5. When all changes are made, call the "done" tool with a summary.

TOOL RULES:
- replace_in_file's "find" must be the EXACT existing text and must appear exactly once. If it fails, re-read and try with more surrounding context.
- Never invent file paths. If a file doesn't exist, create it with write_file.
- Keep working in small steps. Don't dump huge files unnecessarily.

OUTPUT:
- All changes happen via tools. Do not paste code in your text replies.
- Talk only when needed to reason about next tool calls.`;

// ─── The loop ───────────────────────────────────────────────────────────────

export async function runAgent(opts: RunAgentOptions): Promise<RunAgentResult> {
  const {
    prompt,
    initialFiles,
    apiKey,
    editorModel = "google/gemini-2.5-pro",
    plannerModel = "google/gemini-2.5-flash",
    emit = () => {},
    systemPrompt = "",
    maxSteps = 50,
    budgetMs = 120_000,
    validate,
    maxRevisions = 2,
  } = opts;

  const files: FileMap = { ...initialFiles };
  const changedFiles = new Set<string>();
  let toolCalls = 0;
  let summary = "";
  const startedAt = Date.now();
  const controller = new AbortController();
  const budgetTimer = setTimeout(() => controller.abort(), budgetMs);

  try {
    // ─── Phase 1: plan ────────────────────────────────────────────────
    emit("phase", { phase: "planning" });
    const planned = await plan(apiKey, plannerModel, prompt, files, systemPrompt, controller.signal);
    emit("analysis", { text: planned.summary });
    if (planned.steps.length) emit("plan", { items: planned.steps });

    // Pre-load inspected files into context as a hint
    const inspectedHint = planned.filesToInspect
      .filter((p) => files[p] != null)
      .map((p) => `- ${p}`)
      .join("\n");

    // ─── Phase 2 + 3: tool-using editor loop ─────────────────────────
    emit("phase", { phase: "building" });

    const messages: ChatMessage[] = [
      { role: "system", content: `${EDITOR_SYSTEM}\n\n${systemPrompt}` },
      {
        role: "user",
        content:
          `User request:\n${prompt}\n\n` +
          `Plan summary: ${planned.summary}\n` +
          (planned.steps.length ? `Plan steps:\n${planned.steps.map((s) => `- ${s}`).join("\n")}\n` : "") +
          (inspectedHint ? `\nFiles likely to inspect:\n${inspectedHint}\n` : "") +
          `\nRepo map:\n${buildRepoMap(files) || "(empty repo)"}\n`,
      },
    ];

    let doneCalled = false;
    let step = 0;

    for (; step < maxSteps; step++) {
      if (Date.now() - startedAt > budgetMs) break;

      const data = await callGateway(
        apiKey,
        editorModel,
        messages,
        TOOLS as any,
        controller.signal,
      );
      const msg = data?.choices?.[0]?.message;
      if (!msg) break;

      // Track assistant turn (preserve tool_calls so the API stays valid)
      messages.push({
        role: "assistant",
        content: msg.content ?? null,
        tool_calls: msg.tool_calls,
      });

      const calls = msg.tool_calls ?? [];
      if (!calls.length) {
        // Model talked without calling a tool — nudge it once, then stop.
        messages.push({
          role: "user",
          content:
            'Continue using tools. If all edits are complete, call the "done" tool with a summary.',
        });
        // Avoid infinite chatter: if it happens twice, break.
        if (msg.content && messages.filter((m) => m.role === "user").length > 4) break;
        continue;
      }

      for (const call of calls) {
        toolCalls++;
        const name = call.function?.name;
        let args: any = {};
        try {
          args =
            typeof call.function?.arguments === "string"
              ? JSON.parse(call.function.arguments || "{}")
              : call.function?.arguments || {};
        } catch {
          args = {};
        }

        let result = "";
        try {
          if (name === "glob") {
            result = tool_glob(files, args);
          } else if (name === "grep") {
            result = tool_grep(files, args);
          } else if (name === "read_file") {
            result = tool_read(files, args);
          } else if (name === "replace_in_file") {
            const r = tool_replace(files, args);
            result = r.message;
            if (r.ok && r.newContent != null) {
              files[args.path] = r.newContent;
              changedFiles.add(args.path);
              emit("tool", { name, path: args.path, ok: true });
              emit("files", { partial: true, files: { [args.path]: r.newContent } });
            } else {
              emit("tool", { name, path: args.path, ok: false, error: r.message });
            }
          } else if (name === "write_file") {
            files[args.path] = String(args.content ?? "");
            changedFiles.add(args.path);
            result = `OK: wrote ${args.path} (${(args.content ?? "").length} chars)`;
            emit("tool", { name, path: args.path, ok: true });
            emit("files", { partial: true, files: { [args.path]: files[args.path] } });
          } else if (name === "done") {
            summary = String(args.summary ?? "");
            doneCalled = true;
            result = "OK";
          } else {
            result = `ERROR: unknown tool ${name}`;
          }
        } catch (err) {
          result = `ERROR: ${err instanceof Error ? err.message : String(err)}`;
          emit("tool", { name, ok: false, error: result });
        }

        messages.push({
          role: "tool",
          tool_call_id: call.id,
          name,
          content: result.slice(0, 8000),
        });
      }

      if (doneCalled) break;
    }

    // ─── Phase 4: validate + revise ──────────────────────────────────
    let validatedOk = true;
    let validationErrors: string[] | undefined;

    if (validate) {
      emit("phase", { phase: "validating" });
      for (let attempt = 0; attempt <= maxRevisions; attempt++) {
        const v = await validate(files);
        if (v.ok) {
          validatedOk = true;
          validationErrors = undefined;
          break;
        }
        validatedOk = false;
        validationErrors = v.errors ?? ["validation failed"];

        if (attempt >= maxRevisions) break;
        if (Date.now() - startedAt > budgetMs) break;

        // Feed errors back and let the model fix them
        emit("phase", { phase: "repairing" });
        messages.push({
          role: "user",
          content: `Validation failed:\n${validationErrors.join("\n")}\n\nFix using the same tools, then call done.`,
        });

        // Run a short repair sub-loop
        const repairMaxSteps = Math.min(15, maxSteps - step);
        let repairDone = false;
        for (let r = 0; r < repairMaxSteps; r++) {
          if (Date.now() - startedAt > budgetMs) break;
          const data = await callGateway(
            apiKey,
            editorModel,
            messages,
            TOOLS as any,
            controller.signal,
          );
          const m = data?.choices?.[0]?.message;
          if (!m) break;
          messages.push({ role: "assistant", content: m.content ?? null, tool_calls: m.tool_calls });
          const calls = m.tool_calls ?? [];
          if (!calls.length) break;
          for (const call of calls) {
            toolCalls++;
            const n = call.function?.name;
            let a: any = {};
            try {
              a = typeof call.function?.arguments === "string"
                ? JSON.parse(call.function.arguments || "{}")
                : call.function?.arguments || {};
            } catch { a = {}; }
            let res = "";
            if (n === "read_file") res = tool_read(files, a);
            else if (n === "glob") res = tool_glob(files, a);
            else if (n === "grep") res = tool_grep(files, a);
            else if (n === "replace_in_file") {
              const rr = tool_replace(files, a);
              res = rr.message;
              if (rr.ok && rr.newContent != null) {
                files[a.path] = rr.newContent;
                changedFiles.add(a.path);
                emit("files", { partial: true, files: { [a.path]: rr.newContent } });
              }
            } else if (n === "write_file") {
              files[a.path] = String(a.content ?? "");
              changedFiles.add(a.path);
              res = `OK: wrote ${a.path}`;
              emit("files", { partial: true, files: { [a.path]: files[a.path] } });
            } else if (n === "done") {
              res = "OK";
              repairDone = true;
            } else res = `ERROR: unknown tool ${n}`;
            messages.push({ role: "tool", tool_call_id: call.id, name: n, content: res.slice(0, 8000) });
          }
          if (repairDone) break;
        }
      }
    }

    return {
      files,
      steps: step,
      toolCalls,
      changedFiles: [...changedFiles],
      plan: planned.steps,
      summary: summary || planned.summary,
      validatedOk,
      validationErrors,
    };
  } finally {
    clearTimeout(budgetTimer);
  }
}
