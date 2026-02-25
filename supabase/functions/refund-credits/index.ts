import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Authenticate the user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await anonClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { jobId, reason } = await req.json();
    if (!jobId || !reason) {
      return new Response(JSON.stringify({ error: "Missing jobId or reason" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // 1. Look up the job to get cost info and verify ownership
    const { data: job, error: jobError } = await adminClient
      .from("ai_generation_jobs")
      .select("id, user_id, status, model_id")
      .eq("id", jobId)
      .maybeSingle();

    if (jobError || !job) {
      return new Response(JSON.stringify({ error: "Job not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Security: ensure the job belongs to this user
    if (job.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Find the most recent debit transaction for this model/action
    //    to determine how many credits to refund
    const { data: recentTx } = await adminClient
      .from("wallet_transactions")
      .select("amount")
      .eq("user_id", user.id)
      .lt("amount", 0) // debits are negative
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const refundAmount = recentTx ? Math.abs(recentTx.amount) : 5; // fallback to 5 credits

    // 3. Issue the refund
    const { error: refundError } = await adminClient.rpc("add_credits", {
      p_user_id: user.id,
      p_amount: refundAmount,
      p_action: "refund",
      p_description: `Auto-refund: client validation blocked commit (${reason})`,
    });

    if (refundError) {
      console.error("[refund-credits] Refund RPC failed:", refundError);
      return new Response(JSON.stringify({ error: "Refund failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[refund-credits] ✅ Refunded ${refundAmount} credits to ${user.id} for job ${jobId} (${reason})`);

    return new Response(
      JSON.stringify({ success: true, refunded: refundAmount }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("[refund-credits] Exception:", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
