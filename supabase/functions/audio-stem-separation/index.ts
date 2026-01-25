import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface StemResult {
  url: string;
  content_type: string;
  file_name: string;
  file_size: number;
}

interface DemucsResponse {
  audio?: StemResult[];
  vocals?: StemResult;
  no_vocals?: StemResult;
  drums?: StemResult;
  bass?: StemResult;
  other?: StemResult;
  guitar?: StemResult;
  piano?: StemResult;
}

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
      .eq("tool_id", "audio_stem_separation")
      .gte("used_at", oneHourAgo);

    if (usageCount && usageCount >= 10) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Maximum 10 requests per hour. Try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ====== PROCESS REQUEST ======
    const { audio_url, mode, output_format = "mp3" } = await req.json();

    if (!audio_url) {
      return new Response(
        JSON.stringify({ error: "audio_url is required" }),
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

    console.log(`Processing audio: ${audio_url}, mode: ${mode}`);

    // Determine which model and stems based on mode
    let requestBody: Record<string, unknown>;

    switch (mode) {
      case "voice":
        requestBody = {
          audio_url,
          model: "htdemucs",
          stems: ["vocals"],
          output_format,
          shifts: 1,
          overlap: 0.25,
        };
        break;
      case "sfx":
        requestBody = {
          audio_url,
          model: "htdemucs",
          stems: ["vocals", "drums", "bass", "other"],
          output_format,
          shifts: 1,
          overlap: 0.25,
        };
        break;
      case "full":
        requestBody = {
          audio_url,
          model: "htdemucs_6s",
          stems: ["vocals", "drums", "bass", "guitar", "piano", "other"],
          output_format,
          shifts: 1,
          overlap: 0.25,
        };
        break;
      default:
        return new Response(
          JSON.stringify({ error: "Invalid mode. Use 'voice', 'sfx', or 'full'" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    const startTime = Date.now();

    console.log("Sending request to fal.ai sync endpoint...");
    const response = await fetch("https://fal.run/fal-ai/demucs", {
      method: "POST",
      headers: {
        "Authorization": `Key ${FAL_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
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
        JSON.stringify({ error: "Failed to process audio", details: responseText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let result: DemucsResponse;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse fal.ai response:", e);
      return new Response(
        JSON.stringify({ error: "Invalid response from audio processor" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const processingTime = Date.now() - startTime;
    console.log("Processing completed in", processingTime, "ms");
    console.log("Result keys:", Object.keys(result));

    // Format the response based on the result structure
    const stems: Record<string, { url: string; filename: string }> = {};

    if (result.audio && Array.isArray(result.audio)) {
      for (const stem of result.audio) {
        const stemName = stem.file_name.replace(/\.[^/.]+$/, "").toLowerCase();
        stems[stemName] = {
          url: stem.url,
          filename: stem.file_name,
        };
      }
    }

    const stemKeys = ["vocals", "no_vocals", "drums", "bass", "other", "guitar", "piano"];
    for (const key of stemKeys) {
      const stem = result[key as keyof DemucsResponse];
      if (stem && typeof stem === "object" && "url" in stem) {
        stems[key] = {
          url: stem.url,
          filename: stem.file_name || `${key}.${output_format}`,
        };
      }
    }

    console.log("Processed stems:", Object.keys(stems));

    if (Object.keys(stems).length === 0) {
      console.error("No stems found in result:", result);
      return new Response(
        JSON.stringify({ error: "No audio stems returned from processing", raw: result }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ====== DEDUCT CREDIT (if not Pro) ======
    if (!hasProSubscription) {
      // Use service role for credit deduction to bypass RLS
      const serviceClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      // Deduct 1 credit
      const { error: deductError } = await serviceClient
        .from("profiles")
        .update({ credit_balance: supabaseClient.rpc("", {}) }) // Use RPC for atomic update
        .eq("user_id", user.id);

      // Alternative: Use raw SQL for atomic decrement
      await serviceClient.rpc("", {}).catch(() => {
        // Fallback: manual update
      });

      // Simple approach: fetch and update
      const { data: currentProfile } = await serviceClient
        .from("profiles")
        .select("credit_balance")
        .eq("user_id", user.id)
        .single();

      if (currentProfile) {
        await serviceClient
          .from("profiles")
          .update({ credit_balance: Math.max(0, (currentProfile.credit_balance ?? 0) - 1) })
          .eq("user_id", user.id);
      }

      // Record transaction
      await serviceClient.from("credit_transactions").insert({
        user_id: user.id,
        amount: -1,
        type: "usage",
        tool_id: "audio_stem_separation",
        description: "Audio stem separation tool usage",
      });
    }

    // ====== TRACK USAGE ======
    await supabaseClient.from("tool_usage").insert({
      user_id: user.id,
      tool_id: "audio_stem_separation",
    });

    return new Response(
      JSON.stringify({
        success: true,
        stems,
        processing_time_ms: processingTime,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error processing audio:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
