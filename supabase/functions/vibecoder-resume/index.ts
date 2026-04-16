import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_BUILD_ATTEMPTS = 2;

/**
 * vibecoder-resume
 * Called by the client when a job's heartbeat goes stale (worker presumed dead).
 * - If build_attempts < MAX_BUILD_ATTEMPTS: increment, reset status to 'pending',
 *   and re-invoke vibecoder-v2 to continue work.
 * - Otherwise: mark the job 'failed' with a clear breadcrumb.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { jobId } = await req.json();
    if (!jobId || typeof jobId !== "string") {
      return new Response(
        JSON.stringify({ error: "jobId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Validate caller (must be the job owner)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load job (with service role to bypass RLS for read)
    const { data: job, error: jobErr } = await supabase
      .from("ai_generation_jobs")
      .select("*")
      .eq("id", jobId)
      .single();

    if (jobErr || !job) {
      return new Response(JSON.stringify({ error: "Job not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (job.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Already terminal — nothing to do
    if (["completed", "failed", "cancelled"].includes(job.status)) {
      return new Response(
        JSON.stringify({ resumed: false, reason: `Job already ${job.status}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const currentAttempts = job.build_attempts ?? 0;

    // Out of retries — mark failed
    if (currentAttempts >= MAX_BUILD_ATTEMPTS) {
      await supabase
        .from("ai_generation_jobs")
        .update({
          status: "failed",
          error_message: "Generation worker crashed and could not be recovered after multiple attempts.",
          failure_stage: job.failure_stage || "generation",
          completed_at: new Date().toISOString(),
        })
        .eq("id", jobId);
      return new Response(
        JSON.stringify({ resumed: false, reason: "Max retries exceeded" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Bump attempts, reset to pending, refresh heartbeat
    const newAttempts = currentAttempts + 1;
    const { error: updateErr } = await supabase
      .from("ai_generation_jobs")
      .update({
        status: "pending",
        build_attempts: newAttempts,
        last_heartbeat_at: new Date().toISOString(),
        error_message: null,
        failure_stage: null,
      })
      .eq("id", jobId);

    if (updateErr) {
      return new Response(JSON.stringify({ error: updateErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Re-invoke vibecoder-v2 (fire and forget — it will pick up the reset job)
    // We forward the user's auth header so the worker runs in the same auth context.
    const invokeUrl = `${supabaseUrl}/functions/v1/vibecoder-v2`;
    fetch(invokeUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
        apikey: Deno.env.get("SUPABASE_ANON_KEY")!,
      },
      body: JSON.stringify({
        jobId,
        projectId: job.project_id,
        prompt: job.prompt,
        aiPrompt: job.ai_prompt,
        modelId: job.model_id,
        isPlanMode: job.is_plan_mode,
        isResume: true,
      }),
    }).catch((e) => console.warn("[vibecoder-resume] re-invoke fetch error:", e));

    return new Response(
      JSON.stringify({
        resumed: true,
        attempt: newAttempts,
        maxAttempts: MAX_BUILD_ATTEMPTS,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("[vibecoder-resume] error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
