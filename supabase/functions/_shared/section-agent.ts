// ─── Section-tree Agent Loop ───────────────────────────────────────────────
// Mirrors agent-loop.ts but operates on a JSON section tree (storefront blocks)
// rather than a file map. Tools mutate the tree in-memory; on done() the final
// tree is returned, and the caller wraps it into the existing op format
// (clearAllSections + addSection x N) so the storefront apply pipeline is
// unchanged.

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

export interface Section {
  id: string;
  section_type: string;
  // Free-form section data (props, content, style_options, etc.)
  [k: string]: any;
}

export type SectionTree = Section[];

export interface AssetRequest {
  kind?: string;
  spec?: { purpose?: string; style?: string; [k: string]: any };
  [k: string]: any;
}

export interface SectionEmit {
  (event: string, data: any): void;
}

export interface RunSectionAgentOptions {
  prompt: string;
  initialSections: SectionTree;
  apiKey: string;
  systemPrompt?: string;
  /** Brand / product / collection context, formatted text */
  brandContext?: string;
  productContext?: string;
  editorModel?: string;
  plannerModel?: string;
  emit?: SectionEmit;
  maxSteps?: number;
  budgetMs?: number;
  /** Allowed section types — passed through to the model in the system prompt */
  allowedSectionTypes?: string[];
  validate?: (
    sections: SectionTree,
  ) => Promise<{ ok: boolean; errors?: string[] }> | { ok: boolean; errors?: string[] };
  maxRevisions?: number;
}

export interface RunSectionAgentResult {
  sections: SectionTree;
  assetRequests: AssetRequest[];
  steps: number;
  toolCalls: number;
  summary: string;
  validatedOk: boolean;
  validationErrors?: string[];
}

// ─── Tool schema (OpenAI function-calling) ────────────────────────────────

const TOOLS = [
  {
    type: "function",
    function: {
      name: "list_sections",
      description: "List the current storefront sections (id, section_type, short summary). Call this first.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "get_section",
      description: "Read the full JSON of one section by id.",
      parameters: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_section",
      description:
        "Append a new section to the tree, or insert it after another section if after_id is provided. Returns the assigned id.",
      parameters: {
        type: "object",
        properties: {
          after_id: { type: "string", description: "Optional id to insert after. Omit to append." },
          section: {
            type: "object",
            description:
              "Section JSON. Must include section_type. Include any props, content, style_options the renderer needs.",
          },
        },
        required: ["section"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_section",
      description: "Shallow-merge a patch into the section with the given id. Use to tweak content/style.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string" },
          patch: { type: "object", description: "Fields to merge into the section." },
        },
        required: ["id", "patch"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "remove_section",
      description: "Remove a section by id.",
      parameters: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "reorder_sections",
      description: "Reorder the entire tree by providing the new id order. All current ids must be present.",
      parameters: {
        type: "object",
        properties: {
          ids: { type: "array", items: { type: "string" } },
        },
        required: ["ids"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "clear_sections",
      description: "Wipe all current sections. Use for fresh builds before adding new sections.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "request_asset",
      description:
        "Queue an asset generation request (image/video) the renderer should fulfill. Use sparingly.",
      parameters: {
        type: "object",
        properties: {
          kind: { type: "string", description: "image | video | icon" },
          purpose: { type: "string", description: "Where it's used (e.g. hero_background)" },
          style: { type: "string", description: "Short style description" },
        },
        required: ["kind", "purpose"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "done",
      description: "Call when the storefront is ready. Provide a one-paragraph summary.",
      parameters: {
        type: "object",
        properties: { summary: { type: "string" } },
        required: ["summary"],
      },
    },
  },
] as const;

// ─── Helpers ────────────────────────────────────────────────────────────────

function newId(): string {
  return `sec_${crypto.randomUUID().slice(0, 8)}`;
}

function summarize(sec: Section): string {
  const t = sec.section_type;
  const headline =
    sec.props?.headline ||
    sec.content?.headline ||
    sec.headline ||
    sec.title ||
    "";
  return `${sec.id} [${t}]${headline ? ` "${String(headline).slice(0, 60)}"` : ""}`;
}

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
  const body: any = { model, messages, temperature: 0.5 };
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

// ─── Planner ────────────────────────────────────────────────────────────────

async function planStorefront(
  apiKey: string,
  model: string,
  prompt: string,
  sections: SectionTree,
  systemPrefix: string,
  brandContext: string,
  productContext: string,
  signal: AbortSignal,
): Promise<{ summary: string; steps: string[] }> {
  const isFresh = sections.length === 0;
  const layout = sections.map(summarize).join("\n") || "(empty)";

  const sys = `You are the planner for a storefront-editing agent.
${systemPrefix}

Output STRICT JSON only:
{
  "summary": "one sentence",
  "steps": ["short imperative step", "..."]
}

Rules:
- 3-7 steps, ≤ 12 words each.
- Be concrete about which sections to add/update/remove.`;

  const user = `User request:
${prompt}

${brandContext ? `Brand:\n${brandContext}\n` : ""}${productContext ? `${productContext}\n` : ""}\nCurrent layout:
${isFresh ? "(empty — fresh build)" : layout}`;

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
    };
  } catch {
    return { summary: "Apply requested storefront changes.", steps: [] };
  }
}

// ─── Editor system prompt ──────────────────────────────────────────────────

const EDITOR_SYSTEM = `You are a senior storefront-editing agent operating on a JSON section tree through tools.

WORKFLOW (mandatory):
1. Call list_sections first to see what exists.
2. Use get_section before update_section to know the current shape.
3. For fresh builds (empty tree), call clear_sections is NOT needed — just add_section repeatedly.
4. For makeovers, prefer clear_sections + 5-7 add_section calls over many small updates.
5. Use update_section for surgical tweaks (copy, style_options).
6. Call request_asset only when you genuinely need a new image/video.
7. When the storefront is complete, call "done" with a summary.

QUALITY BAR:
- Fresh builds MUST end with at least 5 sections covering: hero/headline, products/features, social proof, about/why, FAQ or final CTA.
- Every section must have real, on-brand copy — no lorem ipsum, no placeholders like "TODO".
- Use only allowed section_types provided in the system prompt.

OUTPUT:
- All changes happen via tools. Do not paste JSON in your text replies.
- Be terse between tool calls.`;

// ─── The loop ──────────────────────────────────────────────────────────────

export async function runSectionAgent(
  opts: RunSectionAgentOptions,
): Promise<RunSectionAgentResult> {
  const {
    prompt,
    initialSections,
    apiKey,
    systemPrompt = "",
    brandContext = "",
    productContext = "",
    editorModel = "google/gemini-2.5-pro",
    plannerModel = "google/gemini-2.5-flash",
    emit = () => {},
    maxSteps = 40,
    budgetMs = 90_000,
    allowedSectionTypes,
    validate,
    maxRevisions = 1,
  } = opts;

  // Clone so we never mutate the caller's array
  let sections: SectionTree = initialSections.map((s) => ({ ...s }));
  const assetRequests: AssetRequest[] = [];
  let toolCalls = 0;
  let summary = "";
  const startedAt = Date.now();
  const controller = new AbortController();
  const budgetTimer = setTimeout(() => controller.abort(), budgetMs);

  const allowedHint = allowedSectionTypes?.length
    ? `\n\nALLOWED section_types (use ONLY these):\n${allowedSectionTypes.join(", ")}`
    : "";

  try {
    emit("phase", { phase: "planning" });
    const planned = await planStorefront(
      apiKey,
      plannerModel,
      prompt,
      sections,
      systemPrompt + allowedHint,
      brandContext,
      productContext,
      controller.signal,
    );
    emit("analysis", { text: planned.summary });
    if (planned.steps.length) emit("plan", { items: planned.steps });

    emit("phase", { phase: "building" });

    const messages: ChatMessage[] = [
      {
        role: "system",
        content: `${EDITOR_SYSTEM}\n\n${systemPrompt}${allowedHint}`,
      },
      {
        role: "user",
        content:
          `User request:\n${prompt}\n\n` +
          `Plan: ${planned.summary}\n` +
          (planned.steps.length ? `Steps:\n${planned.steps.map((s) => `- ${s}`).join("\n")}\n` : "") +
          (brandContext ? `\nBrand:\n${brandContext}\n` : "") +
          (productContext ? `${productContext}\n` : "") +
          `\nCurrent layout (${sections.length} sections):\n${
            sections.length ? sections.map(summarize).join("\n") : "(empty)"
          }`,
      },
    ];

    let doneCalled = false;
    let step = 0;

    const runStep = async (): Promise<boolean> => {
      const data = await callGateway(
        apiKey,
        editorModel,
        messages,
        TOOLS as any,
        controller.signal,
      );
      const msg = data?.choices?.[0]?.message;
      if (!msg) return false;

      messages.push({
        role: "assistant",
        content: msg.content ?? null,
        tool_calls: msg.tool_calls,
      });

      const calls = msg.tool_calls ?? [];
      if (!calls.length) {
        messages.push({
          role: "user",
          content: 'Continue using tools. Call "done" when the storefront is ready.',
        });
        return false;
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
          if (name === "list_sections") {
            result = sections.length
              ? sections.map(summarize).join("\n")
              : "(empty tree)";
          } else if (name === "get_section") {
            const sec = sections.find((s) => s.id === args.id);
            result = sec ? JSON.stringify(sec, null, 2).slice(0, 6000) : `ERROR: no section ${args.id}`;
          } else if (name === "add_section") {
            const incoming = args.section || {};
            if (!incoming.section_type) {
              result = "ERROR: section.section_type is required";
            } else if (
              allowedSectionTypes?.length &&
              !allowedSectionTypes.includes(incoming.section_type)
            ) {
              result = `ERROR: section_type "${incoming.section_type}" not allowed. Allowed: ${allowedSectionTypes.join(", ")}`;
            } else {
              const sec: Section = { ...incoming, id: incoming.id || newId() };
              if (args.after_id) {
                const idx = sections.findIndex((s) => s.id === args.after_id);
                if (idx === -1) {
                  sections.push(sec);
                } else {
                  sections.splice(idx + 1, 0, sec);
                }
              } else {
                sections.push(sec);
              }
              result = `OK: added ${sec.id} (${sec.section_type}). Total ${sections.length}.`;
              emit("tool", { name, id: sec.id, section_type: sec.section_type, ok: true });
              emit("sections", { partial: true, sections });
            }
          } else if (name === "update_section") {
            const idx = sections.findIndex((s) => s.id === args.id);
            if (idx === -1) {
              result = `ERROR: no section ${args.id}`;
            } else {
              sections[idx] = { ...sections[idx], ...(args.patch || {}), id: sections[idx].id };
              result = `OK: updated ${args.id}`;
              emit("tool", { name, id: args.id, ok: true });
              emit("sections", { partial: true, sections });
            }
          } else if (name === "remove_section") {
            const before = sections.length;
            sections = sections.filter((s) => s.id !== args.id);
            result = sections.length < before
              ? `OK: removed ${args.id}. Total ${sections.length}.`
              : `ERROR: no section ${args.id}`;
            if (sections.length < before) emit("sections", { partial: true, sections });
          } else if (name === "reorder_sections") {
            const ids: string[] = Array.isArray(args.ids) ? args.ids : [];
            const map = new Map(sections.map((s) => [s.id, s]));
            const missing = ids.filter((id) => !map.has(id));
            const orphan = sections.filter((s) => !ids.includes(s.id));
            if (missing.length) {
              result = `ERROR: unknown ids: ${missing.join(", ")}`;
            } else if (orphan.length) {
              result = `ERROR: missing ids in new order: ${orphan.map((s) => s.id).join(", ")}`;
            } else {
              sections = ids.map((id) => map.get(id)!);
              result = `OK: reordered ${sections.length} sections`;
              emit("sections", { partial: true, sections });
            }
          } else if (name === "clear_sections") {
            sections = [];
            result = "OK: cleared all sections";
            emit("sections", { partial: true, sections });
          } else if (name === "request_asset") {
            assetRequests.push({
              kind: String(args.kind || "image"),
              spec: { purpose: String(args.purpose || ""), style: String(args.style || "") },
            });
            result = `OK: asset queued (${assetRequests.length} total)`;
          } else if (name === "done") {
            summary = String(args.summary ?? "");
            doneCalled = true;
            result = "OK";
          } else {
            result = `ERROR: unknown tool ${name}`;
          }
        } catch (err) {
          result = `ERROR: ${err instanceof Error ? err.message : String(err)}`;
        }

        messages.push({
          role: "tool",
          tool_call_id: call.id,
          name,
          content: result.slice(0, 6000),
        });
      }

      return doneCalled;
    };

    for (; step < maxSteps; step++) {
      if (Date.now() - startedAt > budgetMs) break;
      const finished = await runStep();
      if (finished) break;
    }

    // ─── Validate + revise ──────────────────────────────────────────
    let validatedOk = true;
    let validationErrors: string[] | undefined;

    if (validate) {
      emit("phase", { phase: "validating" });
      for (let attempt = 0; attempt <= maxRevisions; attempt++) {
        const v = await validate(sections);
        if (v.ok) {
          validatedOk = true;
          validationErrors = undefined;
          break;
        }
        validatedOk = false;
        validationErrors = v.errors ?? ["validation failed"];
        if (attempt >= maxRevisions) break;
        if (Date.now() - startedAt > budgetMs) break;

        emit("phase", { phase: "repairing" });
        messages.push({
          role: "user",
          content: `Validation failed:\n${validationErrors.join("\n")}\n\nFix using the section tools, then call done.`,
        });

        const repairMaxSteps = Math.min(10, maxSteps - step);
        for (let r = 0; r < repairMaxSteps; r++) {
          if (Date.now() - startedAt > budgetMs) break;
          const finished = await runStep();
          if (finished) break;
        }
      }
    }

    return {
      sections,
      assetRequests,
      steps: step,
      toolCalls,
      summary: summary || planned.summary,
      validatedOk,
      validationErrors,
    };
  } finally {
    clearTimeout(budgetTimer);
  }
}
