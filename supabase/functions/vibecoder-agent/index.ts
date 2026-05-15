// ════════════════════════════════════════════════════════════════════════════
// vibecoder-agent — Agent Loop v1 entry point
//
// Lean, opt-in alternative to vibecoder-v2 that uses the shared agent loop:
//   plan → tool-driven inspect/edit → validate → revise.
//
// Streams SSE events compatible with the existing client (useStreamingCode):
//   phase, analysis, plan, files (partial + final), tool, complete, error
//
// Credit handling: flat 3-credit charge with auto-refund on failure.
// Bypassed for owner/admin roles.
// ════════════════════════════════════════════════════════════════════════════

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import ts from "npm:typescript@5.8.3";
import { runAgent, type FileMap } from "../_shared/agent-loop.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FLAT_COST = 3;

// Lightweight syntax validator — same approach as vibecoder-v2's syntax gate
function validateSyntax(files: FileMap): { ok: boolean; errors?: string[] } {
  const errors: string[] = [];
  for (const [path, content] of Object.entries(files)) {
    if (!/\.(ts|tsx|js|jsx)$/.test(path)) continue;
    if (!content || content.length === 0) continue;
    try {
      const isTSX = path.endsWith(".tsx") || path.endsWith(".jsx");
      const sourceFile = ts.createSourceFile(
        path,
        content,
        ts.ScriptTarget.ESNext,
        true,
        isTSX ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
      );
      // @ts-ignore — internal API used widely
      const parseDiagnostics = (sourceFile as any).parseDiagnostics ?? [];
      if (parseDiagnostics.length > 0) {
        const first = parseDiagnostics[0];
        const msg = ts.flattenDiagnosticMessageText(first.messageText, "\n");
        errors.push(`${path}: ${msg.slice(0, 200)}`);
      }
    } catch (e) {
      errors.push(`${path}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  return errors.length ? { ok: false, errors } : { ok: true };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  let supabase: any = null;
  let userId: string | null = null;
  let chargedCredits = 0;
  let refunded = false;

  const refund = async (reason: string) => {
    if (!supabase || refunded || !userId || chargedCredits <= 0) return;
    try {
      await supabase.rpc("add_credits", {
        p_user_id: userId,
        p_amount: chargedCredits,
        p_action: "refund",
        p_description: `Auto-refund: vibecoder-agent failed (${reason})`,
      });
      refunded = true;
    } catch (e) {
      console.error("[vibecoder-agent] Refund error:", e);
    }
  };

  try {
    const body = await req.json().catch(() => ({}));
    const {
      prompt,
      projectFiles,
      currentCode,
    }: {
      prompt?: string;
      projectFiles?: FileMap;
      currentCode?: string;
    } = body;

    if (!prompt || typeof prompt !== "string") {
      return new Response(JSON.stringify({ error: "prompt is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // ── Auth ─────────────────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    userId = userData.user.id;

    // ── Privilege check (owners/admins skip credits) ─────────────────
    const [{ data: isOwner }, { data: isAdmin }] = await Promise.all([
      supabase.rpc("has_role", { _user_id: userId, _role: "owner" }),
      supabase.rpc("has_role", { _user_id: userId, _role: "admin" }),
    ]);
    const bypassCredits = isOwner === true || isAdmin === true;

    // ── Credit deduction ─────────────────────────────────────────────
    if (!bypassCredits) {
      const { data: ok, error: dedErr } = await supabase.rpc("deduct_credits", {
        p_user_id: userId,
        p_amount: FLAT_COST,
        p_action: "vibecoder_agent",
      });
      if (dedErr || !ok) {
        return new Response(
          JSON.stringify({
            error: "INSUFFICIENT_CREDITS",
            message: `You need ${FLAT_COST} credits to use the agent loop.`,
          }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      chargedCredits = FLAT_COST;
    }

    // ── Initial file map ─────────────────────────────────────────────
    let initialFiles: FileMap = {};
    if (projectFiles && typeof projectFiles === "object") {
      initialFiles = { ...projectFiles };
    } else if (currentCode && typeof currentCode === "string") {
      // Treat single-blob input as App.tsx (matches vibecoder-v2's convention)
      initialFiles = { "/App.tsx": currentCode };
    }

    // ── SSE stream setup ─────────────────────────────────────────────
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        let closed = false;
        const send = (event: string, data: unknown) => {
          if (closed) return;
          try {
            controller.enqueue(
              encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
            );
          } catch {
            closed = true;
          }
        };

        // Heartbeat
        const heartbeat = setInterval(() => send("heartbeat", { t: Date.now() }), 10_000);

        try {
          send("phase", { phase: "analyzing" });

          const result = await runAgent({
            prompt,
            initialFiles,
            apiKey: LOVABLE_API_KEY,
            emit: (type, data) => send(type, data),
            systemPrompt: [
              "PROJECT CONSTRAINTS:",
              "- React + Vite + Tailwind. Never use Next.js imports (next/link, next/router).",
              "- Static UI only — no event handlers, no React hooks beyond useState/useEffect for view-only state.",
              "- All commerce uses useSellsPayCheckout(). Never invent payment gateways.",
              "- Theme is pure black (#000000). Use semantic Tailwind tokens.",
              "- File paths look like /App.tsx, /components/Hero.tsx, etc.",
            ].join("\n"),
            validate: (files) => validateSyntax(files),
            maxRevisions: 2,
            budgetMs: 110_000,
          });

          // Final files event (full snapshot)
          send("files", { files: result.files, partial: false });
          send("complete", {
            summary: result.summary,
            steps: result.steps,
            toolCalls: result.toolCalls,
            changedFiles: result.changedFiles,
            validatedOk: result.validatedOk,
            validationErrors: result.validationErrors,
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error("[vibecoder-agent] runAgent failed:", msg);
          await refund(msg.slice(0, 80));
          send("error", { code: "AGENT_FAILED", message: msg });
        } finally {
          clearInterval(heartbeat);
          closed = true;
          try {
            controller.close();
          } catch {
            /* already closed */
          }
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[vibecoder-agent] fatal:", msg);
    await refund("fatal");
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
