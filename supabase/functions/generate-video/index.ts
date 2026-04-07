import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VIDEO_COST = 50;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    const body = await req.json();

    // ===== POLL MODE =====
    if (body.action === "poll" && body.request_id) {
      const { data: statusData } = await supabase
        .from("video_generation_queue")
        .select("status, result_url, error_message")
        .eq("id", body.request_id)
        .eq("user_id", user.id)
        .single();

      if (!statusData) {
        return new Response(JSON.stringify({ error: "Request not found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({
        status: statusData.status,
        video_url: statusData.result_url,
        error: statusData.error_message,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ===== SUBMIT MODE =====
    const { prompt, image_url, video_url, duration = "5", aspect_ratio = "16:9", mode = "image-to-video" } = body;

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Credit check & deduct
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

    const FAL_KEY = Deno.env.get("FAL_KEY");
    if (!FAL_KEY) {
      await supabase.rpc("add_credits", { p_user_id: user.id, p_amount: VIDEO_COST, p_action: "refund", p_description: "Refund: FAL_KEY not configured" });
      return new Response(JSON.stringify({ error: "Video service not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Choose fal endpoint
    let falModel: string;
    if (mode === "video-reference" && video_url) {
      falModel = "fal-ai/kling-video/o1/video-to-video/reference";
    } else if (image_url) {
      falModel = "fal-ai/kling-video/v2/master/image-to-video";
    } else {
      falModel = "fal-ai/kling-video/v2/master/text-to-video";
    }

    const requestBody: Record<string, unknown> = {
      prompt: prompt.trim(),
      duration,
      aspect_ratio,
    };

    // For video-reference mode: send BOTH image_url and video_url
    if (mode === "video-reference" && video_url) {
      requestBody.video_url = video_url;
      if (image_url) requestBody.image_url = image_url;
    } else if (image_url) {
      requestBody.image_url = image_url;
    }

    // Create queue entry
    const { data: queueEntry, error: queueError } = await supabase
      .from("video_generation_queue")
      .insert({
        user_id: user.id,
        status: "processing",
        prompt: prompt.trim(),
        fal_model: falModel,
        request_body: requestBody,
      })
      .select("id")
      .single();

    if (queueError) {
      await supabase.rpc("add_credits", { p_user_id: user.id, p_amount: VIDEO_COST, p_action: "refund", p_description: "Refund: queue insert failed" });
      throw new Error("Failed to create generation request");
    }

    const requestId = queueEntry.id;

    console.log(`Submitting video to fal.ai queue: model=${falModel}, requestId=${requestId}`);

    // Submit to fal.ai queue endpoint (returns immediately)
    const queueResponse = await fetch(`https://queue.fal.run/${falModel}`, {
      method: "POST",
      headers: {
        Authorization: `Key ${FAL_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!queueResponse.ok) {
      const errorText = await queueResponse.text();
      console.error("fal.ai queue submit error:", queueResponse.status, errorText);
      await supabase.from("video_generation_queue").update({ status: "failed", error_message: `fal.ai error: ${queueResponse.status}` }).eq("id", requestId);
      await supabase.rpc("add_credits", { p_user_id: user.id, p_amount: VIDEO_COST, p_action: "refund", p_description: `Refund: fal.ai queue submit failed (${queueResponse.status})` });
      throw new Error(`Video generation failed: ${queueResponse.status}`);
    }

    const queueResult = await queueResponse.json();
    const falRequestId = queueResult.request_id;
    const statusUrl = queueResult.status_url;
    const responseUrl = queueResult.response_url;
    console.log("fal.ai queued, request_id:", falRequestId, "status_url:", statusUrl, "response_url:", responseUrl);

    // Store the fal request ID and URLs for polling
    await supabase.from("video_generation_queue").update({
      fal_request_id: falRequestId,
    }).eq("id", requestId);

    // Now poll fal.ai for completion (we have ~300s in edge functions)
    const maxPollTime = 280_000; // 280s max polling
    const pollInterval = 5_000; // 5s between polls
    const startTime = Date.now();

    let videoUrl: string | null = null;

    while (Date.now() - startTime < maxPollTime) {
      await new Promise(r => setTimeout(r, pollInterval));

      try {
        const statusResponse = await fetch(`https://queue.fal.run/${falModel}/requests/${falRequestId}/status`, {
          headers: { Authorization: `Key ${FAL_KEY}` },
        });

        if (!statusResponse.ok) {
          const txt = await statusResponse.text();
          console.log("Poll status error:", statusResponse.status, txt);
          continue;
        }

        const statusResult = await statusResponse.json();
        console.log("Poll status:", statusResult.status);

        if (statusResult.status === "COMPLETED") {
          // Fetch the result
          const resultResponse = await fetch(`https://queue.fal.run/${falModel}/requests/${falRequestId}`, {
            headers: { Authorization: `Key ${FAL_KEY}` },
          });

          if (resultResponse.ok) {
            const resultData = await resultResponse.json();
            videoUrl = resultData.video?.url;
          }
          break;
        } else if (statusResult.status === "FAILED") {
          const errMsg = statusResult.error || "Video generation failed on provider";
          console.error("fal.ai job failed:", errMsg);
          await supabase.from("video_generation_queue").update({ status: "failed", error_message: errMsg }).eq("id", requestId);
          await supabase.rpc("add_credits", { p_user_id: user.id, p_amount: VIDEO_COST, p_action: "refund", p_description: "Refund: fal.ai generation failed" });
          return new Response(JSON.stringify({ error: "Video generation failed", request_id: requestId }), {
            status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        // IN_QUEUE or IN_PROGRESS — keep polling
      } catch (pollErr) {
        console.error("Poll error:", pollErr);
      }
    }

    if (!videoUrl) {
      // Timed out polling — update queue so client can keep polling
      await supabase.from("video_generation_queue").update({
        status: "processing", // still processing
      }).eq("id", requestId);

      return new Response(JSON.stringify({
        status: "processing",
        request_id: requestId,
        message: "Video is still generating. Poll for status.",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Success!
    await supabase.from("video_generation_queue").update({
      status: "completed",
      result_url: videoUrl,
    }).eq("id", requestId);

    await supabase.from("tool_usage").insert({ user_id: user.id, tool_id: "video_gen" });

    const { data: newWallet } = await supabase
      .from("user_wallets").select("balance").eq("user_id", user.id).single();

    return new Response(JSON.stringify({
      success: true,
      status: "completed",
      video_url: videoUrl,
      request_id: requestId,
      duration,
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
