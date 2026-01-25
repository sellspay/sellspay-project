import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ====== AUTHENTICATION CHECK ======
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Authenticated user:", user.id);

    // ====== SERVER-SIDE CREDIT CHECK ======
    // Check if user has Pro subscription
    const { data: proSub } = await supabaseClient
      .from("pro_tool_subscriptions")
      .select("status")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    const hasProSubscription = !!proSub;

    // If no Pro subscription, check credits
    if (!hasProSubscription) {
      const { data: profile } = await supabaseClient
        .from("profiles")
        .select("id, credit_balance")
        .eq("user_id", user.id)
        .single();

      if (!profile || (profile.credit_balance ?? 0) < 1) {
        return new Response(
          JSON.stringify({ error: "Insufficient credits. Please purchase credits or subscribe to Pro." }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // ====== RATE LIMITING (10 requests per hour) ======
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: usageCount } = await supabaseClient
      .from("tool_usage")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("tool_id", "sfx_generation")
      .gte("used_at", oneHourAgo);

    if (usageCount && usageCount >= 10) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Maximum 10 requests per hour. Try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ====== PROCESS REQUEST ======
    const { prompt, duration = 10 } = await req.json();

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "prompt is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const FAL_KEY = Deno.env.get("FAL_KEY");
    if (!FAL_KEY) {
      console.error("FAL_KEY not configured");
      return new Response(
        JSON.stringify({ error: "FAL_KEY is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Generating SFX: "${prompt}", duration: ${duration}s`);

    const startTime = Date.now();

    const response = await fetch("https://fal.run/fal-ai/elevenlabs/sound-effects/v2", {
      method: "POST",
      headers: {
        "Authorization": `Key ${FAL_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: prompt.trim(),
        duration_seconds: Math.min(Math.max(duration, 1), 22),
      }),
    });

    const responseText = await response.text();
    console.log("fal.ai response status:", response.status);
    console.log("fal.ai response body:", responseText.substring(0, 500));

    if (!response.ok) {
      console.error("fal.ai API error:", response.status, responseText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Failed to generate sound effect", details: responseText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let result: { audio?: { url: string; content_type?: string; file_name?: string; file_size?: number } };
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse fal.ai response:", e);
      return new Response(
        JSON.stringify({ error: "Invalid response from audio generator" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const processingTime = Date.now() - startTime;
    console.log("Generation completed in", processingTime, "ms");

    if (!result.audio?.url) {
      console.error("No audio URL in result:", result);
      return new Response(
        JSON.stringify({ error: "No audio generated", raw: result }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // NOTE: Credit deduction is handled client-side via the deduct-credit edge function
    // BEFORE calling this function. We only validate credits exist above, not deduct here.
    // This prevents double-deduction bugs.

    // ====== TRACK USAGE ======
    await supabaseClient.from("tool_usage").insert({
      user_id: user.id,
      tool_id: "sfx_generation",
    });

    return new Response(
      JSON.stringify({
        success: true,
        audio_url: result.audio.url,
        filename: result.audio.file_name || "generated-sfx.wav",
        duration_seconds: duration,
        processing_time_ms: processingTime,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error generating SFX:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
