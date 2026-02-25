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

    // 1. Check if user is admin/owner — they bypass billing so no refund needed
    const { data: isOwner } = await adminClient.rpc("has_role", {
      _user_id: user.id,
      _role: "owner",
    });
    const { data: isAdmin } = await adminClient.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });

    if (isOwner === true || isAdmin === true) {
      console.log(`[refund-credits] ⏭️ Skipped refund for admin/owner ${user.id} (job ${jobId}) — no credits were charged`);
      return new Response(
        JSON.stringify({ success: true, refunded: 0, reason: "bypass_user" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 2. Look up the job to verify ownership
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

    if (job.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Find the actual debit transaction for this job
    //    Look for recent debits with vibecoder actions within the last 5 minutes
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: recentTx } = await adminClient
      .from("wallet_transactions")
      .select("amount, action")
      .eq("user_id", user.id)
      .lt("amount", 0)
      .gte("created_at", fiveMinAgo)
      .in("action", ["vibecoder_gen_precharge", "vibecoder_gen_dynamic"])
      .order("created_at", { ascending: false })
      .limit(5);

    // Sum up all vibecoder debits for this recent window (pre-charge + remainder)
    const totalDebited = recentTx
      ? recentTx.reduce((sum: number, tx: any) => sum + Math.abs(tx.amount), 0)
      : 0;

    if (totalDebited === 0) {
      console.log(`[refund-credits] ⏭️ No recent debits found for ${user.id} (job ${jobId}) — nothing to refund`);
      return new Response(
        JSON.stringify({ success: true, refunded: 0, reason: "no_debit_found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 4. Issue the refund for exactly what was charged
    const { error: refundError } = await adminClient.rpc("add_credits", {
      p_user_id: user.id,
      p_amount: totalDebited,
      p_action: "refund",
      p_description: `Auto-refund: ${totalDebited} credits for failed job ${jobId} (${reason})`,
    });

    if (refundError) {
      console.error("[refund-credits] Refund RPC failed:", refundError);
      return new Response(JSON.stringify({ error: "Refund failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[refund-credits] ✅ Refunded ${totalDebited} credits to ${user.id} for job ${jobId} (${reason})`);

    return new Response(
      JSON.stringify({ success: true, refunded: totalDebited }),
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
