import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const VIDEO_COST = 50; // credits per video generation

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ====== AUTH ======
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: { user }, error: authError } = await createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    ).auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid authentication" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { prompt, image_url, duration = "5", aspect_ratio = "16:9", model = "kling-v2" } = await req.json();

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ====== CREDIT CHECK & DEDUCT ======
    const { data: wallet } = await supabase
      .from("user_wallets").select("balance").eq("user_id", user.id).single();

    const currentBalance = wallet?.balance ?? 0;
    if (currentBalance < VIDEO_COST) {
      return new Response(JSON.stringify({
        error: "INSUFFICIENT_CREDITS",
        message: `Insufficient credits. You have ${currentBalance}, but this costs ${VIDEO_COST}.`,
        required: VIDEO_COST, available: currentBalance,
      }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: deductSuccess, error: deductError } = await supabase.rpc("deduct_credits", {
      p_user_id: user.id, p_amount: VIDEO_COST, p_action: "video_gen",
    });

    if (deductError || !deductSuccess) {
      return new Response(JSON.stringify({ error: "INSUFFICIENT_CREDITS", message: "Insufficient credits." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ====== FAL.AI VIDEO GENERATION ======
    const FAL_KEY = Deno.env.get("FAL_KEY");
    if (!FAL_KEY) {
      // Refund
      await supabase.rpc("add_credits", { p_user_id: user.id, p_amount: VIDEO_COST, p_action: "refund", p_description: "Refund: FAL_KEY not configured" });
      return new Response(JSON.stringify({ error: "Video service not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Choose fal endpoint based on mode
    const isImageToVideo = !!image_url;
    const falModel = isImageToVideo
      ? "fal-ai/kling-video/v2/master/image-to-video"
      : "fal-ai/kling-video/v2/master/text-to-video";

    const requestBody: Record<string, unknown> = {
      prompt: prompt.trim(),
      duration,
      aspect_ratio,
    };

    if (isImageToVideo) {
      requestBody.image_url = image_url;
    }

    console.log(`Generating video for user ${user.id}: model=${falModel}, duration=${duration}`);

    const startTime = Date.now();
    const response = await fetch(`https://fal.run/${falModel}`, {
      method: "POST",
      headers: {
        Authorization: `Key ${FAL_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("fal.ai error:", response.status, errorText);

      // Refund on failure
      await supabase.rpc("add_credits", {
        p_user_id: user.id, p_amount: VIDEO_COST, p_action: "refund",
        p_description: `Refund: video generation failed (${response.status})`,
      });

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`Video generation failed: ${response.status}`);
    }

    const result = await response.json();
    const processingTime = Date.now() - startTime;
    console.log("Video generated in", processingTime, "ms");

    // Extract video URL from result
    const videoUrl = result.video?.url;
    if (!videoUrl) {
      console.error("No video in response:", JSON.stringify(result).substring(0, 500));
      await supabase.rpc("add_credits", {
        p_user_id: user.id, p_amount: VIDEO_COST, p_action: "refund",
        p_description: "Refund: no video in response",
      });
      throw new Error("No video generated");
    }

    // Track usage
    await supabase.from("tool_usage").insert({ user_id: user.id, tool_id: "video_gen" });

    // Get updated balance
    const { data: newWallet } = await supabase
      .from("user_wallets").select("balance").eq("user_id", user.id).single();

    return new Response(JSON.stringify({
      success: true,
      video_url: videoUrl,
      duration,
      processing_time_ms: processingTime,
      credits_deducted: VIDEO_COST,
      remaining_credits: newWallet?.balance ?? 0,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("Video generation error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
